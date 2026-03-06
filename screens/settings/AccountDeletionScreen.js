import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { deleteAccount } from '../../utils/accountDeletion';

export default function AccountDeletionScreen({ navigation }) {
  const [busy, setBusy] = useState(false);

  const confirmDelete = () => {
    Alert.alert(
      'Delete account?',
      'This will permanently delete your account and your data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (busy) return;
            setBusy(true);
            const res = await deleteAccount();
            setBusy(false);
            if (!res.success) {
              Alert.alert('Deletion failed', res.error || 'Please try again.');
              return;
            }
            Alert.alert('Account deleted', 'Your account has been deleted.');
          },
        },
      ]
    );
  };

  const deletionItems = [
    { icon: 'person-outline', text: 'Your profile and business card' },
    { icon: 'radio-outline', text: 'NFC ring programming data' },
    { icon: 'link-outline', text: 'All social links and contact info' },
    { icon: 'cloud-outline', text: 'Cloud-synced data' },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1A0A0A', '#0E0505', '#080204', '#000000']}
        locations={[0, 0.3, 0.6, 1]}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <View style={styles.backButtonInner}>
              <Ionicons name="arrow-back" size={20} color="#ffffff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Delete Account</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.body}>
          {/* Warning Icon with glow */}
          <View style={styles.warningGlow}>
            <View style={styles.warningCircle}>
              <Ionicons name="warning-outline" size={36} color="#FF6B6B" />
            </View>
          </View>

          <Text style={styles.title}>Permanent Deletion</Text>
          <Text style={styles.sub}>
            This action cannot be undone. The following will be permanently removed:
          </Text>

          {/* What gets deleted */}
          <View style={styles.deletionCard}>
            {deletionItems.map((item, i) => (
              <View style={[styles.deletionItem, i < deletionItems.length - 1 && styles.deletionItemBorder]} key={i}>
                <View style={styles.deletionIconWrap}>
                  <Ionicons name={item.icon} size={16} color="#FF6B6B" />
                </View>
                <Text style={styles.deletionText}>{item.text}</Text>
              </View>
            ))}
          </View>

          {/* Delete Button */}
          <TouchableOpacity
            style={[styles.deleteBtn, busy && { opacity: 0.5 }]}
            onPress={confirmDelete}
            disabled={busy}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#FF6B6B', '#E04545']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.deleteBtnGradient}
            >
              <Ionicons name="trash-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.deleteTxt}>{busy ? 'Deleting\u2026' : 'Delete my account'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
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
    marginBottom: 24,
  },
  backButtonInner: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    paddingTop: 20,
  },
  warningGlow: {
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    marginBottom: 20,
  },
  warningCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255, 107, 107, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  sub: {
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  deletionCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 107, 107, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 28,
  },
  deletionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  deletionItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 107, 107, 0.06)',
  },
  deletionIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 107, 107, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deletionText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '500',
  },
  deleteBtn: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  deleteBtnGradient: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteTxt: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
