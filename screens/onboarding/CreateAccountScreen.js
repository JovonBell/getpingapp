import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { signInWithGoogle } from '../../utils/storage/supabaseStorage';

export default function CreateAccountScreen({ navigation }) {
  const [busy, setBusy] = useState(false);

  const handleGoogleSignIn = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await signInWithGoogle();
      if (!res.success) {
        if (String(res.error).includes('canceled')) return;
        Alert.alert('Sign in failed', res.error || 'Please try again.');
      }
      // On success: App.js auth gate will switch stacks automatically.
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a2e1a', '#05140a', '#000000']}
        style={styles.gradient}
      >
        {/* Back button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>create account</Text>
          <Text style={styles.subtitle}>sign in to visualize your circle.</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Sign in with Google */}
          <View style={{ alignItems: 'center', marginTop: 10 }}>
            <TouchableOpacity
              style={styles.socialButton}
              onPress={handleGoogleSignIn}
              disabled={busy}
            >
              <View style={styles.googleLogo}>
                <Text style={styles.googleG}>G</Text>
              </View>
              <Text style={styles.socialButtonText}>continue with google</Text>
            </TouchableOpacity>
            <Text style={styles.helperText}>
              We use Google Sign In so you can quickly access your circles across devices.
            </Text>
          </View>

        {/* Footer Links */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            by continuing, you agree to our{' '}
            <Text style={styles.footerLink}>terms</Text> and{' '}
            <Text style={styles.footerLink}>privacy policy</Text>.
          </Text>
          <TouchableOpacity style={styles.signInLink}>
            <Text style={styles.signInText}>
              already have an account? <Text style={styles.signInLinkText}>sign in</Text>
            </Text>
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  backButton: {
    marginBottom: 30,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  header: {
    marginBottom: 40,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#ffffff',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#cccccc',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#000000',
  },
  inputFocused: {
    borderColor: '#00ff88',
    borderWidth: 2,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 14,
  },
  continueButton: {
    backgroundColor: '#a8e6cf',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  continueButtonText: {
    color: '#1a1a1a',
    fontSize: 18,
    fontWeight: '600',
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ffffff',
    opacity: 0.3,
  },
  separatorText: {
    color: '#ffffff',
    paddingHorizontal: 16,
    fontSize: 14,
  },
  helperText: {
    marginTop: 14,
    color: '#ffffff',
    opacity: 0.75,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  socialButton: {
    backgroundColor: '#f5f5dc',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  googleLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  googleG: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4285F4',
  },
  socialButtonText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    marginTop: 30,
    alignItems: 'center',
  },
  footerText: {
    color: '#ffffff',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 20,
  },
  footerLink: {
    textDecorationLine: 'underline',
  },
  signInLink: {
    marginTop: 10,
  },
  signInText: {
    color: '#ffffff',
    fontSize: 14,
  },
  signInLinkText: {
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
