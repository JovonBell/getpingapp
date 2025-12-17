import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const HINT_STORAGE_KEY = '@ping_gesture_hints_seen';

/**
 * Swipe gesture hint animation - shows a hand swiping left/right
 */
export function SwipeHint({ visible, onDismiss }) {
  const translateX = useRef(new Animated.Value(-30)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Fade in
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Swipe animation loop
      const swipeAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(translateX, {
            toValue: 30,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(translateX, {
            toValue: -30,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      swipeAnimation.start();

      // Auto-dismiss after 3 seconds
      const timer = setTimeout(() => {
        onDismiss?.();
      }, 3000);

      return () => {
        swipeAnimation.stop();
        clearTimeout(timer);
      };
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.hintContainer, { opacity }]}>
      <TouchableOpacity style={styles.hintBox} onPress={onDismiss} activeOpacity={0.9}>
        <Animated.View style={{ transform: [{ translateX }] }}>
          <Ionicons name="hand-left" size={32} color="#4FFFB0" />
        </Animated.View>
        <Text style={styles.hintText}>Swipe left/right to explore contacts</Text>
        <Text style={styles.hintDismiss}>Tap to dismiss</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

/**
 * Pinch gesture hint - shows pinch to zoom instruction
 */
export function PinchHint({ visible, onDismiss }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Fade in
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Pinch animation loop
      const pinchAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.3,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      pinchAnimation.start();

      // Auto-dismiss after 3 seconds
      const timer = setTimeout(() => {
        onDismiss?.();
      }, 3000);

      return () => {
        pinchAnimation.stop();
        clearTimeout(timer);
      };
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.hintContainer, { opacity }]}>
      <TouchableOpacity style={styles.hintBox} onPress={onDismiss} activeOpacity={0.9}>
        <Animated.View style={[styles.pinchHands, { transform: [{ scale }] }]}>
          <Ionicons name="finger-print" size={28} color="#4FFFB0" />
        </Animated.View>
        <Text style={styles.hintText}>Pinch to zoom the visualization</Text>
        <Text style={styles.hintDismiss}>Tap to dismiss</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

/**
 * Tap hint - shows tap to interact instruction
 */
export function TapHint({ visible, onDismiss, message = 'Tap a contact to view details' }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Fade in
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Pulse animation
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      // Auto-dismiss after 3 seconds
      const timer = setTimeout(() => {
        onDismiss?.();
      }, 3000);

      return () => {
        pulseAnimation.stop();
        clearTimeout(timer);
      };
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.hintContainerBottom, { opacity }]}>
      <TouchableOpacity style={styles.hintBoxSmall} onPress={onDismiss} activeOpacity={0.9}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Ionicons name="finger-print" size={24} color="#4FFFB0" />
        </Animated.View>
        <Text style={styles.hintTextSmall}>{message}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

/**
 * Hook to manage first-time gesture hints
 * Returns { shouldShowHint, markHintSeen }
 */
export function useGestureHint(hintKey) {
  const [shouldShow, setShouldShow] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkHintSeen = async () => {
      try {
        const seen = await AsyncStorage.getItem(`${HINT_STORAGE_KEY}_${hintKey}`);
        setShouldShow(seen !== 'true');
      } catch (e) {
        setShouldShow(true); // Show hint if we can't check storage
      }
      setLoading(false);
    };
    checkHintSeen();
  }, [hintKey]);

  const markSeen = async () => {
    try {
      await AsyncStorage.setItem(`${HINT_STORAGE_KEY}_${hintKey}`, 'true');
      setShouldShow(false);
    } catch (e) {
      setShouldShow(false);
    }
  };

  return { shouldShowHint: !loading && shouldShow, markHintSeen: markSeen };
}

const styles = StyleSheet.create({
  hintContainer: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 200,
  },
  hintContainerBottom: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 200,
  },
  hintBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(79, 255, 176, 0.5)',
    padding: 20,
    alignItems: 'center',
    maxWidth: 280,
    shadowColor: '#4FFFB0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  hintBoxSmall: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(79, 255, 176, 0.5)',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    maxWidth: 280,
  },
  hintText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 12,
  },
  hintTextSmall: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '500',
  },
  hintDismiss: {
    color: '#888',
    fontSize: 11,
    marginTop: 8,
  },
  pinchHands: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});

export default { SwipeHint, PinchHint, TapHint, useGestureHint };
