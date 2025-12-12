import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { deleteAccount } from '../utils/accountDeletion';

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

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0a2e1a', '#05140a', '#000000']} style={styles.gradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Delete account</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.body}>
          <Ionicons name="warning-outline" size={54} color="#ff6b6b" />
          <Text style={styles.title}>Permanent deletion</Text>
          <Text style={styles.sub}>
            This will delete your profile, circles, contacts you imported, and messages associated with your account.
          </Text>

          <TouchableOpacity
            style={[styles.deleteBtn, busy && { opacity: 0.6 }]}
            onPress={confirmDelete}
            disabled={busy}
          >
            <Text style={styles.deleteTxt}>{busy ? 'Deleting…' : 'Delete my account'}</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1, paddingTop: 60 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  headerTitle: { color: '#ffffff', fontSize: 20, fontWeight: '700' },
  body: { flex: 1, paddingHorizontal: 20, alignItems: 'center', paddingTop: 30 },
  title: { color: '#ffffff', fontSize: 22, fontWeight: '800', marginTop: 12 },
  sub: { color: '#ffffff', opacity: 0.75, textAlign: 'center', marginTop: 10, lineHeight: 20 },
  deleteBtn: {
    marginTop: 24,
    width: '100%',
    backgroundColor: '#ff6b6b',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteTxt: { color: '#1a1a1a', fontSize: 16, fontWeight: '800' },
});


