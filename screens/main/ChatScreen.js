import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActionSheetIOS,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getCurrentUser } from '../../utils/storage/supabaseStorage';
import { fetchConversation, markConversationRead, sendMessage } from '../../utils/storage/messagesStorage';
import { fetchRecipientPushTokens, sendExpoPush } from '../../utils/notifications/pushNotifications';

export default function ChatScreen({ navigation, route }) {
  const { contact } = route.params || {};
  const receiverId = route?.params?.receiverId || contact?.matchedUserId || contact?.userId || null;
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const flatListRef = useRef(null);

  const load = async () => {
    const { success, user } = await getCurrentUser();
    const uid = success ? user?.id : null;
    setCurrentUserId(uid);
    if (!uid || !receiverId) return;
    const res = await fetchConversation(uid, receiverId, 200);
    setMessages(res.messages || []);
    await markConversationRead(uid, receiverId);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
  };

  useEffect(() => {
    if (!receiverId) {
      Alert.alert(
        'Not on ping yet',
        'This contact is not on ping yet, so you can\'t message them yet.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      return;
    }
    load();
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [navigation, receiverId]);

  const handleMoreOptions = () => {
    const contactName = contact?.name || 'this user';
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Report User', 'Block User'],
          destructiveButtonIndex: 2,
          cancelButtonIndex: 0,
          title: contactName,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) handleReport();
          if (buttonIndex === 2) handleBlock();
        }
      );
    } else {
      Alert.alert(contactName, 'Choose an action', [
        { text: 'Report User', onPress: handleReport },
        { text: 'Block User', onPress: handleBlock, style: 'destructive' },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const handleReport = () => {
    Alert.alert(
      'Report User',
      `Why are you reporting ${contact?.name || 'this user'}?`,
      [
        { text: 'Spam or Scam', onPress: () => submitReport('spam') },
        { text: 'Harassment or Abuse', onPress: () => submitReport('harassment') },
        { text: 'Inappropriate Content', onPress: () => submitReport('inappropriate') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const submitReport = async (reason) => {
    try {
      if (!currentUserId || !receiverId) return;
      const { supabase } = require('../../lib/supabase');
      await supabase.from('reports').insert({
        reporter_id: currentUserId,
        reported_user_id: receiverId,
        reason,
        status: 'pending',
      });
    } catch (e) {
      console.warn('[ChatScreen] Report submission error (non-fatal):', e?.message);
    }
    Alert.alert('Report Submitted', 'Thank you for helping keep ping safe. We will review this report.');
  };

  const handleBlock = () => {
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${contact?.name || 'this user'}? They won\'t be able to message you.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!currentUserId || !receiverId) return;
              const { supabase } = require('../../lib/supabase');
              await supabase.from('blocked_users').insert({
                blocker_id: currentUserId,
                blocked_id: receiverId,
              });
            } catch (e) {
              console.warn('[ChatScreen] Block error (non-fatal):', e?.message);
            }
            Alert.alert('User Blocked', `${contact?.name || 'This user'} has been blocked.`, [
              { text: 'OK', onPress: () => navigation.goBack() },
            ]);
          },
        },
      ]
    );
  };

  const handleSend = () => {
    (async () => {
      const text = message.trim();
      if (!text) return;
      if (!currentUserId || !receiverId) return;

      try {
        const res = await sendMessage(currentUserId, receiverId, text);
        if (!res.success) {
          Alert.alert('Send failed', res.error || 'Please try again.');
          return; // Keep message in input so user can retry
        }

        // Only clear message AFTER successful send
        setMessage('');
        await load();

        // Push notify recipient (best-effort)
        try {
          const tokensRes = await fetchRecipientPushTokens(receiverId);
          await sendExpoPush(tokensRes.tokens, {
            title: 'ping!',
            body: `${contact?.name || 'Someone'}: ${text}`,
            data: { type: 'message', senderId: currentUserId },
          });
        } catch (e) {
          // ignore push notification errors
        }
      } catch (error) {
        console.error('[ChatScreen] Send error:', error);
        Alert.alert('Error', 'Failed to send message. Please check your connection.');
        // Keep message in input so user can retry
      }
    })();
  };

  const renderMessage = ({ item }) => {
    const mine = item.sender_id === currentUserId;
    return (
    <View
      style={[
        styles.messageBubble,
        mine ? styles.myMessage : styles.theirMessage,
      ]}
    >
      <Text style={styles.messageText}>{item.content}</Text>
      <Text style={styles.messageTime}>
        {item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
      </Text>
    </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a2e1a', '#05140a', '#000000']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
            <View style={[styles.avatar, { backgroundColor: '#4FFFB0' }]}>
              <Text style={styles.avatarText}>
                {contact?.initials || contact?.name?.substring(0, 2).toUpperCase() || 'NA'}
              </Text>
            </View>
            <View>
              <Text style={styles.contactName}>{contact?.name || 'Unknown'}</Text>
              <Text style={styles.contactStatus}>Active now</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.headerIcon}>
              <Ionicons name="call-outline" size={24} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIcon} onPress={handleMoreOptions}>
              <Ionicons name="ellipsis-vertical" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Messages List */}
        <KeyboardAvoidingView
          style={styles.chatContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          />

          {/* Input Bar */}
          <View style={styles.inputContainer}>
            <TouchableOpacity style={styles.attachButton}>
              <Ionicons name="add-circle" size={28} color="#4FFFB0" />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor="#666"
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!message.trim()}
            >
              <Ionicons
                name="send"
                size={20}
                color={message.trim() ? '#000000' : '#666'}
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a3a2a',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  contactStatus: {
    fontSize: 12,
    color: '#4FFFB0',
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  headerIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#4FFFB0',
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#2a3a2a',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    color: '#ffffff',
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a3a2a',
    backgroundColor: '#05140a',
    gap: 12,
  },
  attachButton: {
    paddingBottom: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#2a3a2a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#ffffff',
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4FFFB0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#2a3a2a',
  },
});
