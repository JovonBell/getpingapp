import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
  Linking,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import { signInWithGoogle, signInWithApple } from '../../utils/storage/supabaseStorage';

export default function CreateAccountScreen({ navigation }) {
  const [busy, setBusy] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleGoogleSignIn = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await signInWithGoogle();
      if (!res.success) {
        if (String(res.error).includes('canceled')) return;
        Alert.alert('Sign in failed', res.error || 'Please try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  const handleAppleSignIn = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await signInWithApple();
      if (!res.success) {
        if (String(res.error).includes('canceled') || String(res.error).includes('ERR_REQUEST_CANCELED')) return;
        Alert.alert('Sign in failed', res.error || 'Please try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0A1A12', '#060E09', '#020804', '#000000']}
        locations={[0, 0.3, 0.6, 1]}
        style={styles.gradient}
      >
        {/* Back button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <View style={styles.backButtonInner}>
            <Ionicons name="arrow-back" size={20} color="#ffffff" />
          </View>
        </TouchableOpacity>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>create account</Text>
              <Text style={styles.subtitle}>sign in to create your card.</Text>
            </View>

            {/* Glass card with auth buttons */}
            <View style={styles.authCard}>
              <View style={styles.authCardInner}>
                {/* Sign in buttons - Apple MUST be first per App Store guideline 4.8 / HIG */}
                {Platform.OS === 'ios' && (
                  <AppleAuthentication.AppleAuthenticationButton
                    buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
                    buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
                    cornerRadius={14}
                    style={styles.appleButton}
                    onPress={handleAppleSignIn}
                  />
                )}

                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={handleGoogleSignIn}
                  disabled={busy}
                  activeOpacity={0.8}
                >
                  <View style={styles.googleLogo}>
                    <Text style={styles.googleG}>G</Text>
                  </View>
                  <Text style={styles.socialButtonText}>Continue with Google</Text>
                </TouchableOpacity>

                <Text style={styles.helperText}>
                  Sign in quickly to access your card across devices.
                </Text>
              </View>
            </View>

            {/* Footer Links */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                by continuing, you agree to our{' '}
                <Text style={styles.footerLink} onPress={() => Linking.openURL('https://getping.today/terms')}>terms</Text> and{' '}
                <Text style={styles.footerLink} onPress={() => Linking.openURL('https://getping.today/privacy')}>privacy policy</Text>.
              </Text>
              <TouchableOpacity style={styles.signInLink} onPress={() => navigation.goBack()}>
                <Text style={styles.signInText}>
                  already have an account? <Text style={styles.signInLinkText}>sign in</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
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
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  backButton: {
    marginBottom: 24,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
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
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    marginBottom: 36,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 0.3,
  },
  authCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 32,
  },
  authCardInner: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    padding: 20,
  },
  appleButton: {
    width: '100%',
    height: 50,
    marginBottom: 10,
  },
  socialButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    width: '100%',
  },
  googleLogo: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  googleG: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#4285F4',
  },
  socialButtonText: {
    color: '#1a1a1a',
    fontSize: 15,
    fontWeight: '600',
  },
  helperText: {
    marginTop: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  footerLink: {
    textDecorationLine: 'underline',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  signInLink: {
    paddingVertical: 8,
  },
  signInText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 14,
  },
  signInLinkText: {
    fontWeight: '600',
    color: '#4FFFB0',
  },
});
