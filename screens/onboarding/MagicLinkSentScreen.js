import React, { useState, useEffect } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { signInWithMagicLink } from '../../utils/storage/supabaseStorage';

export default function MagicLinkSentScreen({ navigation, route }) {
  const { email } = route.params || {};
  const [resendCooldown, setResendCooldown] = useState(60);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    setLoading(true);
    try {
      const res = await signInWithMagicLink(email);
      if (!res.success) {
        Alert.alert('Failed to Resend', res.error || 'Please try again.');
      } else {
        setResendCooldown(60);
        Alert.alert('Email Sent', 'Check your inbox for the new magic link.');
      }
    } catch (e) {
      Alert.alert('Failed to Resend', e?.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a2e1a', '#05140a', '#000000']}
        style={styles.gradient}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.content}>
          {/* Email icon with animated ring */}
          <View style={styles.iconContainer}>
            <View style={styles.iconRing}>
              <Ionicons name="mail" size={48} color="#a8e6cf" />
            </View>
          </View>

          <Text style={styles.title}>Check your inbox</Text>

          <Text style={styles.description}>
            We sent a magic link to{'\n'}
            <Text style={styles.emailText}>{email}</Text>
          </Text>

          <Text style={styles.instructions}>
            Click the link in your email to sign in instantly.
            The link will expire in 1 hour.
          </Text>

          <View style={styles.tipsContainer}>
            <View style={styles.tip}>
              <Ionicons name="checkmark-circle" size={20} color="#a8e6cf" />
              <Text style={styles.tipText}>Check your spam folder</Text>
            </View>
            <View style={styles.tip}>
              <Ionicons name="checkmark-circle" size={20} color="#a8e6cf" />
              <Text style={styles.tipText}>Allow emails from ping</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.resendButton,
              resendCooldown > 0 && styles.resendButtonDisabled,
            ]}
            onPress={handleResend}
            disabled={resendCooldown > 0 || loading}
          >
            {loading ? (
              <ActivityIndicator color="#1a1a1a" />
            ) : resendCooldown > 0 ? (
              <Text style={styles.resendButtonTextDisabled}>
                Resend in {resendCooldown}s
              </Text>
            ) : (
              <Text style={styles.resendButtonText}>Resend Email</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tryAnotherButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.tryAnotherText}>Try another email</Text>
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
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
    padding: 8,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  iconContainer: {
    marginBottom: 30,
  },
  iconRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(168, 230, 207, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(168, 230, 207, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 24,
  },
  emailText: {
    color: '#a8e6cf',
    fontWeight: '600',
  },
  instructions: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  tipsContainer: {
    marginBottom: 30,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipText: {
    color: '#ccc',
    fontSize: 14,
    marginLeft: 10,
  },
  resendButton: {
    backgroundColor: '#a8e6cf',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  resendButtonDisabled: {
    backgroundColor: 'rgba(168, 230, 207, 0.3)',
  },
  resendButtonText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: '600',
  },
  resendButtonTextDisabled: {
    color: '#888',
    fontSize: 16,
    fontWeight: '600',
  },
  tryAnotherButton: {
    paddingVertical: 12,
  },
  tryAnotherText: {
    color: '#a8e6cf',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
