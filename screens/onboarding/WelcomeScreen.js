import React, { useEffect, useRef } from 'react';
import { Alert, StyleSheet, Text, View, TouchableOpacity, Platform, Animated, Easing, Dimensions, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import { signInWithGoogle, signInWithApple } from '../../utils/storage/supabaseStorage';

const { width: SW, height: SH } = Dimensions.get('window');

const CHECKOUT_URL = 'https://checkout.stripe.com/c/pay/cs_live_a1cckx1aTHCoZZMw5VfOMmOP6F2S1yqzFF0aPrhQngZEzD8YvB605AtTX4#fidnandhYHdWcXxpYCc%2FJ2FgY2RwaXEnKSdkdWxOYHwnPyd1blppbHNgWjA0V3N2U0JANGZdX1RibUlDfE1QSGRmSXJ0Vm1ca05WaHR8QU5mSHZJZ2FzcGljSEM3amh3TTBUbWI0Ml9nREpkdjQ8UkdJSXRVXHdNMXBxUnFcSm1NM11JNTV0RkhXQ3FfSicpJ2N3amhWYHdzYHcnP3F3cGApJ2dkZm5id2pwa2FGamlqdyc%2FJyZjY2NjY2MnKSdpZHxqcHFRfHVgJz8ndmxrYmlgWmxxYGgnKSdga2RnaWBVaWRmYG1qaWFgd3YnP3F3cGB4JSUl';

// Floating dot component
function FloatingDot({ x, y, size, delay, duration, driftX, driftY }) {
  const drift = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1, duration: 1800, delay, useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(drift, { toValue: 0, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.delay(delay % 1000),
        Animated.timing(pulse, { toValue: 1, duration: 1800 + (delay % 800), easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1800 + (delay % 800), easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const translateX = drift.interpolate({ inputRange: [0, 1], outputRange: [0, driftX] });
  const translateY = drift.interpolate({ inputRange: [0, 1], outputRange: [0, driftY] });
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.5] });
  const opacity = pulse.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.15, 0.7, 0.15] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: '#4FFFB0',
        opacity: Animated.multiply(opacity, fade),
        transform: [{ translateX }, { translateY }, { scale }],
        shadowColor: '#4FFFB0',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: size * 2,
      }}
    />
  );
}

// Pre-generate dot positions
const DOTS = Array.from({ length: 25 }, (_, i) => ({
  x: Math.random() * SW,
  y: Math.random() * SH,
  size: 2 + Math.random() * 10,
  delay: i * 80,
  duration: 4000 + Math.random() * 5000,
  driftX: -20 + Math.random() * 40,
  driftY: -20 + Math.random() * 40,
}));

export default function WelcomeScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const ring1Anim = useRef(new Animated.Value(0.4)).current;
  const ring2Anim = useRef(new Animated.Value(0.6)).current;
  const ring3Anim = useRef(new Animated.Value(0.8)).current;
  const centerGlow = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 800, useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
    ]).start();

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

  const handleGetPing = () => {
    Alert.alert(
      'do you have a ping! already?',
      '',
      [
        {
          text: 'no',
          onPress: async () => {
            await WebBrowser.openBrowserAsync(CHECKOUT_URL);
            navigation.navigate('CreateAccount', { orderCompleted: true });
          },
        },
        {
          text: 'yes',
          onPress: () => navigation.navigate('CreateAccount'),
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      {/* Floating particle dots */}
      {DOTS.map((d, i) => <FloatingDot key={i} {...d} />)}

      <Animated.View style={[styles.mainContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {/* Ping Logo with concentric rings */}
        <View style={styles.pingContainer}>
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

        {/* Get Ping CTA */}
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={handleGetPing}
          activeOpacity={0.85}
        >
          <View style={styles.ctaGradientBg}>
            <Text style={styles.ctaText}>get ping today!</Text>
          </View>
        </TouchableOpacity>

        {/* Auth Section */}
        <View style={styles.authSection}>
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or sign in</Text>
            <View style={styles.dividerLine} />
          </View>

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
        </View>

        {/* Terms & Privacy — required by Apple */}
        <View style={styles.legalFooter}>
          <Text style={styles.legalText}>
            by continuing, you agree to our{' '}
            <Text style={styles.legalLink} onPress={() => Linking.openURL('https://getping.today/terms')}>terms</Text> and{' '}
            <Text style={styles.legalLink} onPress={() => Linking.openURL('https://getping.today/privacy')}>privacy policy</Text>.
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  mainContent: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    zIndex: 10,
  },
  pingContainer: {
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
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
    width: 120, height: 120, borderRadius: 60,
    borderWidth: 1.5, borderColor: '#4FFFB0',
  },
  pingCircle2: {
    position: 'absolute',
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 1.5, borderColor: '#4FFFB0',
  },
  pingCircle3: {
    position: 'absolute',
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#4FFFB0',
  },
  pingCenter: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#4FFFB0',
    shadowColor: '#4FFFB0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8, shadowRadius: 10,
  },
  title: {
    fontSize: 52, fontWeight: '700', color: '#ffffff',
    letterSpacing: -1, marginBottom: 6,
  },
  tagline: {
    fontSize: 16, color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 1, marginBottom: 36,
  },
  ctaButton: {
    width: '100%', borderRadius: 14, overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#4FFFB0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12,
  },
  ctaGradientBg: {
    backgroundColor: '#4FFFB0',
    paddingVertical: 16, alignItems: 'center', borderRadius: 14,
  },
  ctaText: {
    color: '#0A0A0F', fontSize: 17, fontWeight: '700', letterSpacing: 0.5,
  },
  authSection: {
    width: '100%',
  },
  divider: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 14, width: '100%',
  },
  dividerLine: {
    flex: 1, height: 1, backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  dividerText: {
    color: 'rgba(255, 255, 255, 0.3)', paddingHorizontal: 16, fontSize: 13,
  },
  appleButton: {
    width: '100%', height: 50, marginBottom: 10,
  },
  socialButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 14, paddingHorizontal: 20, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginBottom: 10, width: '100%',
  },
  googleLogo: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#fff', marginRight: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  googleG: {
    fontSize: 16, fontWeight: 'bold', color: '#4285F4',
  },
  socialButtonText: {
    color: '#1a1a1a', fontSize: 15, fontWeight: '600',
  },
  legalFooter: {
    marginTop: 20,
    paddingHorizontal: 10,
  },
  legalText: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  legalLink: {
    textDecorationLine: 'underline',
    color: 'rgba(255, 255, 255, 0.45)',
  },
});
