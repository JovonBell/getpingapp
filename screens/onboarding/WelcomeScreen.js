import React, { useEffect, useRef } from 'react';
import { Alert, StyleSheet, Text, View, TouchableOpacity, Platform, Animated, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import { signInWithGoogle, signInWithApple } from '../../utils/storage/supabaseStorage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const ring1Anim = useRef(new Animated.Value(0.4)).current;
  const ring2Anim = useRef(new Animated.Value(0.6)).current;
  const ring3Anim = useRef(new Animated.Value(0.8)).current;
  const centerGlow = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    // Fade in content
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    // Breathing pulse on rings (staggered)
    const pulseRing = (anim, minVal, maxVal, duration) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: maxVal, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(anim, { toValue: minVal, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );

    pulseRing(ring1Anim, 0.3, 0.7, 2400).start();
    pulseRing(ring2Anim, 0.5, 0.9, 2000).start();
    pulseRing(ring3Anim, 0.7, 1, 1600).start();
    pulseRing(centerGlow, 0.5, 1, 1800).start();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      const res = await signInWithGoogle();
      if (!res.success) {
        if (String(res.error).includes('canceled')) return;
        Alert.alert('Sign in failed', res.error || 'Please try again.');
      }
    } catch (e) {
      Alert.alert('Sign in failed', e?.message || 'Please try again.');
    }
  };

  const handleAppleSignIn = async () => {
    try {
      const res = await signInWithApple();
      if (!res.success) {
        if (String(res.error).includes('canceled') || String(res.error).includes('ERR_REQUEST_CANCELED')) return;
        Alert.alert('Sign in failed', res.error || 'Please try again.');
      }
    } catch (e) {
      Alert.alert('Sign in failed', e?.message || 'Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0A1A12', '#060E09', '#020804', '#000000']}
        locations={[0, 0.3, 0.6, 1]}
        style={styles.gradient}
      >
        <Animated.View style={[styles.mainContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {/* Ping Logo */}
          <View style={styles.pingContainer}>
            {/* Ambient glow behind rings */}
            <View style={styles.ambientGlow} />

            <View style={styles.pingRing}>
              <View style={styles.pingRingInner}>
                <Animated.View style={[styles.pingCircle1, { opacity: ring1Anim }]} />
                <Animated.View style={[styles.pingCircle2, { opacity: ring2Anim }]} />
                <Animated.View style={[styles.pingCircle3, { opacity: ring3Anim }]} />
                <Animated.View style={[styles.pingCenter, { opacity: centerGlow }]} />
              </View>
            </View>
          </View>

          {/* App Title */}
          <Text style={styles.title}>ping!</Text>
          <Text style={styles.tagline}>your digital business card.</Text>

          {/* Auth Buttons */}
          <View style={styles.authSection}>
            {/* Apple MUST be first per App Store guideline 4.8 / HIG */}
            {Platform.OS === 'ios' && (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
                cornerRadius={14}
                style={styles.appleButton}
                onPress={handleAppleSignIn}
              />
            )}

            <TouchableOpacity
              style={styles.socialButton}
              onPress={handleGoogleSignIn}
              activeOpacity={0.8}
            >
              <View style={styles.googleLogo}>
                <Text style={styles.googleG}>G</Text>
              </View>
              <Text style={styles.socialButtonText}>Sign in with Google</Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Email */}
            <TouchableOpacity
              style={styles.emailButton}
              onPress={() => navigation.navigate('EmailAuth')}
              activeOpacity={0.8}
            >
              <Ionicons name="mail-outline" size={18} color="#4FFFB0" style={{ marginRight: 10 }} />
              <Text style={styles.emailButtonText}>Continue with Email</Text>
            </TouchableOpacity>
          </View>

          {/* Get Started CTA */}
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => navigation.navigate('CreateAccount')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#4FFFB0', '#00D68F']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              <Text style={styles.ctaText}>get started</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Sign In Link */}
          <TouchableOpacity
            style={styles.signInContainer}
            onPress={() => navigation.navigate('CreateAccount')}
          >
            <Text style={styles.signInText}>
              already have an account? <Text style={styles.signInLink}>sign in</Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  mainContent: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  pingContainer: {
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ambientGlow: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(79, 255, 176, 0.04)',
  },
  pingRing: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(79, 255, 176, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pingRingInner: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pingCircle1: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1.5,
    borderColor: '#4FFFB0',
  },
  pingCircle2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1.5,
    borderColor: '#4FFFB0',
  },
  pingCircle3: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#4FFFB0',
  },
  pingCenter: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4FFFB0',
    shadowColor: '#4FFFB0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  title: {
    fontSize: 52,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: -1,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 1,
    marginBottom: 44,
  },
  authSection: {
    width: '100%',
    marginBottom: 24,
  },
  appleButton: {
    width: '100%',
    height: 50,
    marginBottom: 10,
  },
  socialButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 14,
    paddingHorizontal: 20,
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
    backgroundColor: '#fff',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleG: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4285F4',
  },
  socialButtonText: {
    color: '#1a1a1a',
    fontSize: 15,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  dividerText: {
    color: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 16,
    fontSize: 13,
  },
  emailButton: {
    backgroundColor: 'rgba(79, 255, 176, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(79, 255, 176, 0.15)',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  emailButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '500',
  },
  ctaButton: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#4FFFB0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  ctaGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 14,
  },
  ctaText: {
    color: '#0A0A0F',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  signInContainer: {
    marginTop: 4,
    paddingVertical: 8,
  },
  signInText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 14,
  },
  signInLink: {
    fontWeight: '600',
    color: '#4FFFB0',
  },
});
