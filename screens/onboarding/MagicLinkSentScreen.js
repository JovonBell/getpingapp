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
        colors={['#0A1A12', '#060E09', '#020804', '#000000']}
        locations={[0, 0.3, 0.6, 1]}
        style={styles.gradient}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <View style={styles.backButtonInner}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </View>
        </TouchableOpacity>

        <View style={styles.content}>
          {/* Email icon */}
          <View style={styles.iconGlow}>
            <View style={styles.iconCircle}>
              <Ionicons name="mail" size={36} color="#4FFFB0" />
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

          {/* Tips card */}
          <View style={styles.tipsCard}>
            <View style={styles.tip}>
              <Ionicons name="checkmark-circle" size={18} color="#4FFFB0" />
              <Text style={styles.tipText}>Check your spam folder</Text>
            </View>
            <View style={[styles.tip, { borderBottomWidth: 0 }]}>
              <Ionicons name="checkmark-circle" size={18} color="#4FFFB0" />
              <Text style={styles.tipText}>Allow emails from ping</Text>
            </View>
          </View>

          {/* Resend Button */}
          <TouchableOpacity
            style={styles.resendButton}
            onPress={handleResend}
            disabled={resendCooldown > 0 || loading}
            activeOpacity={0.85}
          >
            {resendCooldown > 0 ? (
              <View style={styles.resendDisabledInner}>
                <Text style={styles.resendDisabledText}>Resend in {resendCooldown}s</Text>
              </View>
            ) : (
              <LinearGradient
                colors={['#4FFFB0', '#00D68F']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.resendGradient}
              >
                {loading ? <ActivityIndicator color="#0A0A0F" /> : <Text style={styles.resendText}>Resend Email</Text>}
              </LinearGradient>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.tryAnotherButton} onPress={() => navigation.goBack()}>
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  iconGlow: {
    marginBottom: 24,
    shadowColor: '#4FFFB0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(79, 255, 176, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(79, 255, 176, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 14,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 24,
  },
  emailText: {
    color: '#4FFFB0',
    fontWeight: '600',
  },
  instructions: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
    marginBottom: 28,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  tipsCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 16,
    marginBottom: 28,
    overflow: 'hidden',
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  tipText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  resendButton: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 14,
  },
  resendGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 14,
  },
  resendText: {
    color: '#0A0A0F',
    fontSize: 16,
    fontWeight: '700',
  },
  resendDisabledInner: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  resendDisabledText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 16,
    fontWeight: '600',
  },
  tryAnotherButton: {
    paddingVertical: 10,
  },
  tryAnotherText: {
    color: '#4FFFB0',
    fontSize: 14,
  },
});
