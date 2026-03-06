/**
 * NFCRingScreen - Setup and program your NFC ring
 *
 * Allows users to program their NFC ring with their contact
 * sharing URL for easy networking.
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Easing,
  Alert,
  Platform,
  Linking,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import {
  checkNfcAvailability,
  openNfcSettings,
  programRing,
  readRing,
  getStoredRingInfo,
  cancelNfcOperation,
} from '../../utils/nfc/nfcManager';
import Haptic from '../../utils/haptics';

// Status states
const STATUS = {
  CHECKING: 'checking',
  NOT_SUPPORTED: 'not_supported',
  DISABLED: 'disabled',
  READY: 'ready',
  SCANNING: 'scanning',
  READING: 'reading',
  SUCCESS: 'success',
  READ_SUCCESS: 'read_success',
  ERROR: 'error',
};

export default function NFCRingScreen({ navigation }) {
  const { theme } = useTheme();
  const [status, setStatus] = useState(STATUS.CHECKING);
  const [errorMessage, setErrorMessage] = useState(null);
  const [userId, setUserId] = useState(null);
  const [storedRingInfo, setStoredRingInfo] = useState(null);
  const [readResult, setReadResult] = useState(null);
  const [customUrl, setCustomUrl] = useState('');
  const [inputFocused, setInputFocused] = useState(false);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;
  const pulseLoopRef = useRef(null);
  const rotateLoopRef = useRef(null);
  const glowLoopRef = useRef(null);

  useEffect(() => {
    checkNfc();
    loadUserAndRingInfo();
    return () => { cancelNfcOperation(); };
  }, []);

  // Ambient glow animation
  useEffect(() => {
    glowLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 0.6, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    glowLoopRef.current.start();
    return () => { if (glowLoopRef.current) glowLoopRef.current.stop(); };
  }, []);

  useEffect(() => {
    if (status === STATUS.SCANNING || status === STATUS.READING) {
      startPulseAnimation();
      startRotateAnimation();
    } else {
      if (pulseLoopRef.current) { pulseLoopRef.current.stop(); pulseLoopRef.current = null; }
      if (rotateLoopRef.current) { rotateLoopRef.current.stop(); rotateLoopRef.current = null; }
      pulseAnim.stopAnimation();
      rotateAnim.stopAnimation();
      pulseAnim.setValue(1);
      rotateAnim.setValue(0);
    }
    return () => {
      if (pulseLoopRef.current) { pulseLoopRef.current.stop(); pulseLoopRef.current = null; }
      if (rotateLoopRef.current) { rotateLoopRef.current.stop(); rotateLoopRef.current = null; }
    };
  }, [status]);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const startPulseAnimation = () => {
    pulseLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    pulseLoopRef.current.start();
  };

  const startRotateAnimation = () => {
    rotateLoopRef.current = Animated.loop(
      Animated.timing(rotateAnim, { toValue: 1, duration: 3000, easing: Easing.linear, useNativeDriver: true })
    );
    rotateLoopRef.current.start();
  };

  const checkNfc = async () => {
    setStatus(STATUS.CHECKING);
    const result = await checkNfcAvailability();
    if (!result.supported) setStatus(STATUS.NOT_SUPPORTED);
    else if (!result.enabled) setStatus(STATUS.DISABLED);
    else setStatus(STATUS.READY);
  };

  const loadUserAndRingInfo = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) setUserId(session.user.id);
      const ringInfo = await getStoredRingInfo();
      setStoredRingInfo(ringInfo);
    } catch (error) {
      console.error('[NFCRing] Error loading info:', error);
    }
  };

  const handleProgramRing = async () => {
    const urlToWrite = customUrl.trim();
    if (!urlToWrite) {
      Alert.alert('No URL', 'Please enter a URL to write to your ring.');
      return;
    }
    let finalUrl = urlToWrite;
    if (!urlToWrite.startsWith('http://') && !urlToWrite.startsWith('https://')) {
      finalUrl = 'https://' + urlToWrite;
    }
    setStatus(STATUS.SCANNING);
    setErrorMessage(null);
    Haptic.mediumImpact();

    const result = await programRing(finalUrl);
    if (result.success) {
      setStatus(STATUS.SUCCESS);
      Haptic.success();
      setStoredRingInfo({ url: result.url, date: new Date().toISOString() });
      setTimeout(() => setStatus(STATUS.READY), 3000);
    } else {
      setStatus(STATUS.ERROR);
      setErrorMessage(result.message);
      Haptic.error();
      setTimeout(() => setStatus(STATUS.READY), 5000);
    }
  };

  const handleReadRing = async () => {
    setStatus(STATUS.READING);
    setErrorMessage(null);
    setReadResult(null);
    Haptic.mediumImpact();

    const result = await readRing();
    if (result.success) {
      setStatus(STATUS.READ_SUCCESS);
      setReadResult(result.data);
      Haptic.success();
      setTimeout(() => setStatus(STATUS.READY), 5000);
    } else {
      setStatus(STATUS.ERROR);
      setErrorMessage(result.error || 'Failed to read ring');
      Haptic.error();
      setTimeout(() => setStatus(STATUS.READY), 5000);
    }
  };

  const handleCancel = () => {
    cancelNfcOperation();
    setStatus(STATUS.READY);
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const renderRingIcon = () => {
    const isScanning = status === STATUS.SCANNING || status === STATUS.READING;
    const isSuccess = status === STATUS.SUCCESS || status === STATUS.READ_SUCCESS;
    const isError = status === STATUS.ERROR;

    const ringColor = isSuccess ? theme.success : isError ? theme.error : isScanning ? theme.primary : 'rgba(255,255,255,0.12)';
    const glowColor = isSuccess ? theme.success : isError ? theme.error : isScanning ? theme.primary : 'transparent';

    return (
      <View style={styles.ringWrapper}>
        {/* Ambient ring glow */}
        <Animated.View style={[styles.ringAmbientGlow, {
          backgroundColor: isScanning || isSuccess ? `${ringColor}10` : 'rgba(79, 255, 176, 0.02)',
          opacity: glowAnim,
        }]} />

        <Animated.View
          style={[
            styles.ringContainer,
            {
              transform: [
                { scale: isScanning ? pulseAnim : 1 },
                { rotate: isScanning ? rotateInterpolate : '0deg' },
              ],
            },
          ]}
        >
          {/* Outer ring */}
          <View style={[styles.ringOuter, {
            borderColor: ringColor,
            shadowColor: glowColor,
            shadowOpacity: isScanning || isSuccess ? 0.6 : 0,
          }]} />

          {/* Middle decorative ring */}
          <View style={[styles.ringMiddle, {
            borderColor: isScanning || isSuccess ? `${ringColor}40` : 'rgba(255,255,255,0.05)',
          }]} />

          {/* Inner ring */}
          <View style={[styles.ringInner, { borderColor: ringColor }]}>
            {isSuccess ? (
              <Ionicons name="checkmark" size={40} color={theme.success} />
            ) : isError ? (
              <Ionicons name="close" size={40} color={theme.error} />
            ) : isScanning ? (
              <Ionicons name="radio" size={40} color={theme.primary} />
            ) : (
              <Ionicons name="radio-outline" size={40} color="rgba(255,255,255,0.3)" />
            )}
          </View>
        </Animated.View>
      </View>
    );
  };

  const renderStatus = () => {
    switch (status) {
      case STATUS.CHECKING:
        return <Text style={styles.statusText}>Checking NFC availability...</Text>;

      case STATUS.NOT_SUPPORTED:
        return (
          <View style={styles.statusContainer}>
            <View style={styles.statusBadge}>
              <Ionicons name="warning" size={20} color={theme.warning} />
              <Text style={[styles.statusBadgeText, { color: theme.warning }]}>Not Available</Text>
            </View>
            <Text style={styles.statusText}>
              Your device doesn't support NFC.{'\n'}
              You'll need an NFC-enabled phone to program your ring.
            </Text>
          </View>
        );

      case STATUS.DISABLED:
        return (
          <View style={styles.statusContainer}>
            <View style={styles.statusBadge}>
              <Ionicons name="settings" size={20} color={theme.warning} />
              <Text style={[styles.statusBadgeText, { color: theme.warning }]}>NFC Disabled</Text>
            </View>
            <Text style={styles.statusText}>Please enable NFC in your device settings.</Text>
            <TouchableOpacity
              style={styles.glassButton}
              onPress={() => openNfcSettings()}
              activeOpacity={0.7}
            >
              <Text style={[styles.glassButtonText, { color: theme.primary }]}>Open Settings</Text>
            </TouchableOpacity>
          </View>
        );

      case STATUS.SCANNING:
      case STATUS.READING:
        return (
          <View style={styles.statusContainer}>
            <Text style={[styles.statusTitle, { color: theme.primary }]}>
              {status === STATUS.SCANNING ? 'Programming...' : 'Reading...'}
            </Text>
            <Text style={styles.statusText}>
              Hold your ring near the {Platform.OS === 'ios' ? 'top of your iPhone' : 'back of your phone'}
            </Text>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        );

      case STATUS.SUCCESS:
        return (
          <View style={styles.statusContainer}>
            <Text style={[styles.statusTitle, { color: theme.success }]}>Ring Programmed!</Text>
            <Text style={styles.statusText}>Your ring is ready to share your contact info.</Text>
          </View>
        );

      case STATUS.READ_SUCCESS:
        return (
          <View style={styles.statusContainer}>
            <Text style={[styles.statusTitle, { color: theme.success }]}>Ring Read!</Text>
            {readResult?.url ? (
              <View style={styles.readResultCard}>
                <Text style={styles.readResultLabel}>URL on ring</Text>
                <Text style={styles.readResultUrl}>{readResult.url}</Text>
              </View>
            ) : (
              <Text style={styles.statusText}>Ring is empty or has no URL.</Text>
            )}
          </View>
        );

      case STATUS.ERROR:
        return (
          <View style={styles.statusContainer}>
            <Text style={[styles.statusTitle, { color: theme.error }]}>Operation Failed</Text>
            <Text style={styles.statusText}>{errorMessage}</Text>
            <TouchableOpacity
              style={styles.glassButton}
              onPress={() => setStatus(STATUS.READY)}
              activeOpacity={0.7}
            >
              <Text style={[styles.glassButtonText, { color: theme.primary }]}>Try Again</Text>
            </TouchableOpacity>
          </View>
        );

      case STATUS.READY:
      default:
        return (
          <View style={styles.statusContainer}>
            <Text style={styles.statusTitle}>Program Your Ring</Text>
            <Text style={styles.statusText}>
              Write any link to your NFC ring and share it with a tap.
            </Text>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#0A0A0F', '#080D0A', '#050805', '#000000']}
        locations={[0, 0.3, 0.6, 1]}
        style={{ flex: 1 }}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>NFC Ring</Text>
                {storedRingInfo?.date && status === STATUS.READY && (
                  <View style={styles.lastProgrammedBadge}>
                    <Ionicons name="checkmark-circle" size={12} color="#4FFFB0" />
                    <Text style={styles.lastProgrammedText}>
                      Last programmed {new Date(storedRingInfo.date).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </View>

              {/* Ring Animation */}
              {renderRingIcon()}

              {/* Status */}
              {renderStatus()}

              {/* URL Input */}
              {status === STATUS.READY && (
                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>Enter URL to write</Text>
                  <View style={[
                    styles.inputWrapper,
                    inputFocused && styles.inputWrapperFocused,
                  ]}>
                    <Ionicons name="link-outline" size={18} color={inputFocused ? '#4FFFB0' : 'rgba(255,255,255,0.25)'} style={{ marginRight: 10 }} />
                    <TextInput
                      style={styles.urlInput}
                      placeholder="instagram.com/yourusername"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      value={customUrl}
                      onChangeText={setCustomUrl}
                      onFocus={() => setInputFocused(true)}
                      onBlur={() => setInputFocused(false)}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="url"
                    />
                  </View>
                  <Text style={styles.inputHint}>
                    Instagram, YouTube, website, or any link
                  </Text>
                </View>
              )}

              {/* Action Buttons */}
              {status === STATUS.READY && (
                <View style={styles.buttonRow}>
                  <TouchableOpacity
                    style={styles.writeButton}
                    onPress={handleProgramRing}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={['#4FFFB0', '#00D68F']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.writeButtonGradient}
                    >
                      <Ionicons name="create-outline" size={20} color="#0A0A0F" />
                      <Text style={styles.writeButtonText}>Write</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.readButton}
                    onPress={handleReadRing}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="scan-outline" size={20} color="#4FFFB0" />
                    <Text style={styles.readButtonText}>Read</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* How it Works */}
              {status === STATUS.READY && (
                <View style={styles.infoSection}>
                  <Text style={styles.infoTitle}>How it works</Text>
                  {[
                    { num: '1', text: 'Enter any URL \u2014 Instagram, YouTube, your website, etc.' },
                    { num: '2', text: 'Tap "Write" and hold your ring to your phone' },
                    { num: '3', text: 'Anyone who taps your ring will open your link!' },
                  ].map((item) => (
                    <View style={styles.infoItem} key={item.num}>
                      <View style={styles.infoNumber}>
                        <Text style={styles.infoNumberText}>{item.num}</Text>
                      </View>
                      <Text style={styles.infoText}>{item.text}</Text>
                    </View>
                  ))}
                </View>
              )}
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.5,
  },
  lastProgrammedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(79, 255, 176, 0.06)',
  },
  lastProgrammedText: {
    fontSize: 12,
    color: 'rgba(79, 255, 176, 0.6)',
  },
  ringWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    marginVertical: 12,
  },
  ringAmbientGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  ringContainer: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringOuter: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 24,
  },
  ringMiddle: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 1,
  },
  ringInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  statusContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    minHeight: 100,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 170, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 170, 0, 0.15)',
    marginBottom: 12,
  },
  statusBadgeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  statusText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
    lineHeight: 22,
  },
  glassButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(79, 255, 176, 0.2)',
    backgroundColor: 'rgba(79, 255, 176, 0.06)',
    marginTop: 16,
  },
  glassButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 16,
  },
  cancelButtonText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.4)',
  },
  readResultCard: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(79, 255, 176, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(79, 255, 176, 0.12)',
    alignItems: 'center',
  },
  readResultLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  readResultUrl: {
    fontSize: 14,
    color: '#4FFFB0',
    fontWeight: '500',
  },
  inputSection: {
    marginTop: 20,
    paddingHorizontal: 4,
  },
  inputLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 2,
  },
  inputWrapperFocused: {
    borderColor: 'rgba(79, 255, 176, 0.3)',
    backgroundColor: 'rgba(79, 255, 176, 0.04)',
  },
  urlInput: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    paddingVertical: 14,
  },
  inputHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.2)',
    marginTop: 8,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 20,
  },
  writeButton: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#4FFFB0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  writeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 8,
    borderRadius: 14,
  },
  writeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A0A0F',
  },
  readButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 14,
    gap: 8,
    backgroundColor: 'rgba(79, 255, 176, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(79, 255, 176, 0.2)',
  },
  readButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4FFFB0',
  },
  infoSection: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    marginBottom: 40,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.3)',
    marginBottom: 20,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 14,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  infoNumber: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(79, 255, 176, 0.12)',
  },
  infoNumberText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4FFFB0',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 20,
  },
});
