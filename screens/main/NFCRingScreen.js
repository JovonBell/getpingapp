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
  Animated,
  Easing,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';
import {
  checkNfcAvailability,
  openNfcSettings,
  programRing,
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
  SUCCESS: 'success',
  ERROR: 'error',
};

export default function NFCRingScreen({ navigation }) {
  const { theme } = useTheme();
  const [status, setStatus] = useState(STATUS.CHECKING);
  const [errorMessage, setErrorMessage] = useState(null);
  const [userId, setUserId] = useState(null);
  const [storedRingInfo, setStoredRingInfo] = useState(null);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Check NFC availability on mount
  useEffect(() => {
    checkNfc();
    loadUserAndRingInfo();

    return () => {
      cancelNfcOperation();
    };
  }, []);

  // Start pulse animation when scanning
  useEffect(() => {
    if (status === STATUS.SCANNING) {
      startPulseAnimation();
      startRotateAnimation();
    } else {
      pulseAnim.stopAnimation();
      rotateAnim.stopAnimation();
      pulseAnim.setValue(1);
      rotateAnim.setValue(0);
    }
  }, [status]);

  // Fade in animation on mount
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startRotateAnimation = () => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  };

  const checkNfc = async () => {
    setStatus(STATUS.CHECKING);
    const result = await checkNfcAvailability();

    if (!result.supported) {
      setStatus(STATUS.NOT_SUPPORTED);
    } else if (!result.enabled) {
      setStatus(STATUS.DISABLED);
    } else {
      setStatus(STATUS.READY);
    }
  };

  const loadUserAndRingInfo = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
      }

      const ringInfo = await getStoredRingInfo();
      setStoredRingInfo(ringInfo);
    } catch (error) {
      console.error('[NFCRing] Error loading info:', error);
    }
  };

  const handleProgramRing = async () => {
    if (!userId) {
      Alert.alert('Not Signed In', 'Please sign in to program your ring.');
      return;
    }

    setStatus(STATUS.SCANNING);
    setErrorMessage(null);
    Haptic.mediumImpact();

    const result = await programRing(userId);

    if (result.success) {
      setStatus(STATUS.SUCCESS);
      Haptic.success();
      setStoredRingInfo({ url: result.url, date: new Date().toISOString() });

      // Reset to ready after 3 seconds
      setTimeout(() => {
        setStatus(STATUS.READY);
      }, 3000);
    } else {
      setStatus(STATUS.ERROR);
      setErrorMessage(result.message);
      Haptic.error();

      // Reset to ready after 5 seconds
      setTimeout(() => {
        setStatus(STATUS.READY);
      }, 5000);
    }
  };

  const handleCancel = () => {
    cancelNfcOperation();
    setStatus(STATUS.READY);
  };

  const handleOpenSettings = () => {
    openNfcSettings();
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const renderRingIcon = () => {
    const isScanning = status === STATUS.SCANNING;
    const isSuccess = status === STATUS.SUCCESS;
    const isError = status === STATUS.ERROR;

    return (
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
        {/* Outer ring glow */}
        <View style={[styles.ringOuter, {
          borderColor: isSuccess ? theme.success :
                       isError ? theme.error :
                       isScanning ? theme.primary : '#333',
          shadowColor: isSuccess ? theme.success :
                      isError ? theme.error :
                      isScanning ? theme.primary : 'transparent',
        }]} />

        {/* Inner ring */}
        <View style={[styles.ringInner, {
          borderColor: isSuccess ? theme.success :
                       isError ? theme.error :
                       isScanning ? theme.primary : '#444',
        }]}>
          {isSuccess ? (
            <Ionicons name="checkmark" size={48} color={theme.success} />
          ) : isError ? (
            <Ionicons name="close" size={48} color={theme.error} />
          ) : isScanning ? (
            <Ionicons name="radio" size={48} color={theme.primary} />
          ) : (
            <Ionicons name="radio-outline" size={48} color="#666" />
          )}
        </View>
      </Animated.View>
    );
  };

  const renderStatus = () => {
    switch (status) {
      case STATUS.CHECKING:
        return (
          <Text style={styles.statusText}>Checking NFC availability...</Text>
        );

      case STATUS.NOT_SUPPORTED:
        return (
          <View style={styles.statusContainer}>
            <Ionicons name="warning" size={32} color={theme.warning} />
            <Text style={styles.statusTitle}>NFC Not Available</Text>
            <Text style={styles.statusText}>
              Your device doesn't support NFC.{'\n'}
              You'll need an NFC-enabled phone to program your ring.
            </Text>
          </View>
        );

      case STATUS.DISABLED:
        return (
          <View style={styles.statusContainer}>
            <Ionicons name="settings" size={32} color={theme.warning} />
            <Text style={styles.statusTitle}>NFC is Disabled</Text>
            <Text style={styles.statusText}>
              Please enable NFC in your device settings.
            </Text>
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: theme.primary }]}
              onPress={handleOpenSettings}
            >
              <Text style={[styles.secondaryButtonText, { color: theme.primary }]}>
                Open Settings
              </Text>
            </TouchableOpacity>
          </View>
        );

      case STATUS.SCANNING:
        return (
          <View style={styles.statusContainer}>
            <Text style={[styles.statusTitle, { color: theme.primary }]}>
              Scanning...
            </Text>
            <Text style={styles.statusText}>
              Hold your ring near the {Platform.OS === 'ios' ? 'top of your iPhone' : 'back of your phone'}
            </Text>
            <TouchableOpacity
              style={[styles.cancelButton]}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        );

      case STATUS.SUCCESS:
        return (
          <View style={styles.statusContainer}>
            <Text style={[styles.statusTitle, { color: theme.success }]}>
              Ring Programmed!
            </Text>
            <Text style={styles.statusText}>
              Your ring is ready to share your contact info.
            </Text>
          </View>
        );

      case STATUS.ERROR:
        return (
          <View style={styles.statusContainer}>
            <Text style={[styles.statusTitle, { color: theme.error }]}>
              Programming Failed
            </Text>
            <Text style={styles.statusText}>{errorMessage}</Text>
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: theme.primary }]}
              onPress={() => setStatus(STATUS.READY)}
            >
              <Text style={[styles.secondaryButtonText, { color: theme.primary }]}>
                Try Again
              </Text>
            </TouchableOpacity>
          </View>
        );

      case STATUS.READY:
      default:
        return (
          <View style={styles.statusContainer}>
            <Text style={styles.statusTitle}>Setup Your Ring</Text>
            <Text style={styles.statusText}>
              Your NFC ring lets you share your contact info with a simple tap.
            </Text>
          </View>
        );
    }
  };

  const canProgram = status === STATUS.READY && userId;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>NFC Ring</Text>
          {storedRingInfo?.date && status === STATUS.READY && (
            <Text style={styles.subtitle}>
              Last programmed: {new Date(storedRingInfo.date).toLocaleDateString()}
            </Text>
          )}
        </View>

        {/* Ring Animation */}
        <View style={styles.ringWrapper}>
          {renderRingIcon()}
        </View>

        {/* Status */}
        {renderStatus()}

        {/* Program Button */}
        {canProgram && (
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.primary }]}
            onPress={handleProgramRing}
            activeOpacity={0.8}
          >
            <Ionicons name="radio" size={24} color="#000" />
            <Text style={styles.primaryButtonText}>
              {storedRingInfo?.url ? 'Reprogram Ring' : 'Program My Ring'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Info Section */}
        {status === STATUS.READY && (
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>How it works</Text>
            <View style={styles.infoItem}>
              <View style={[styles.infoNumber, { backgroundColor: theme.primary }]}>
                <Text style={styles.infoNumberText}>1</Text>
              </View>
              <Text style={styles.infoText}>
                Tap "Program My Ring" and hold your ring to your phone
              </Text>
            </View>
            <View style={styles.infoItem}>
              <View style={[styles.infoNumber, { backgroundColor: theme.primary }]}>
                <Text style={styles.infoNumberText}>2</Text>
              </View>
              <Text style={styles.infoText}>
                Your contact card URL gets written to the ring
              </Text>
            </View>
            <View style={styles.infoItem}>
              <View style={[styles.infoNumber, { backgroundColor: theme.primary }]}>
                <Text style={styles.infoNumberText}>3</Text>
              </View>
              <Text style={styles.infoText}>
                When someone taps your ring, they see your contact card!
              </Text>
            </View>
          </View>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  ringWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    marginVertical: 20,
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
    borderWidth: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  ringInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  statusContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    minHeight: 120,
  },
  statusTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#fff',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  statusText: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    marginTop: 24,
    gap: 10,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 16,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 16,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#888',
  },
  infoSection: {
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  infoNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#888',
    lineHeight: 20,
  },
});
