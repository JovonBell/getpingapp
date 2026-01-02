import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Animated,
  StyleSheet,
  Platform,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { playTap } from '../../utils/soundManager';

// Haptic feedback types
export const HapticType = {
  LIGHT: 'light',
  MEDIUM: 'medium',
  HEAVY: 'heavy',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
};

export default function HapticButton({
  onPress,
  hapticType = HapticType.LIGHT,
  playSound = true,
  enableRipple = true,
  scaleOnPress = true,
  children,
  style,
  disabled,
  ...props
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;
  const rippleOpacity = useRef(new Animated.Value(0)).current;

  const triggerHaptic = async () => {
    if (Platform.OS !== 'ios') return;

    try {
      switch (hapticType) {
        case HapticType.LIGHT:
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case HapticType.MEDIUM:
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case HapticType.HEAVY:
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case HapticType.SUCCESS:
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case HapticType.WARNING:
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case HapticType.ERROR:
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
        default:
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (err) {
      console.warn('[HapticButton] Haptic feedback failed:', err);
    }
  };

  const handlePressIn = () => {
    if (disabled) return;

    // Scale animation
    if (scaleOnPress) {
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
        speed: 50,
        bounciness: 10,
      }).start();
    }

    // Ripple animation
    if (enableRipple) {
      rippleAnim.setValue(0);
      rippleOpacity.setValue(0.3);
      Animated.parallel([
        Animated.timing(rippleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(rippleOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const handlePressOut = () => {
    if (scaleOnPress) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        speed: 50,
        bounciness: 10,
      }).start();
    }
  };

  const handlePress = async () => {
    if (disabled) return;

    // Trigger haptic feedback
    triggerHaptic();

    // Play sound
    if (playSound) {
      playTap();
    }

    // Call the original onPress
    if (onPress) {
      onPress();
    }
  };

  const rippleScale = rippleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 2],
  });

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[style, disabled && styles.disabled]}
        {...props}
      >
        {/* Ripple effect */}
        {enableRipple && (
          <Animated.View
            style={[
              styles.ripple,
              {
                transform: [{ scale: rippleScale }],
                opacity: rippleOpacity,
              },
            ]}
            pointerEvents="none"
          />
        )}
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

// Convenience wrapper for primary action buttons
export function PrimaryButton({ children, style, ...props }) {
  return (
    <HapticButton
      hapticType={HapticType.MEDIUM}
      style={[styles.primaryButton, style]}
      {...props}
    >
      {children}
    </HapticButton>
  );
}

// Convenience wrapper for secondary action buttons
export function SecondaryButton({ children, style, ...props }) {
  return (
    <HapticButton
      hapticType={HapticType.LIGHT}
      style={[styles.secondaryButton, style]}
      {...props}
    >
      {children}
    </HapticButton>
  );
}

// Convenience wrapper for success actions
export function SuccessButton({ children, style, ...props }) {
  return (
    <HapticButton
      hapticType={HapticType.SUCCESS}
      style={[styles.successButton, style]}
      {...props}
    >
      {children}
    </HapticButton>
  );
}

const styles = StyleSheet.create({
  disabled: {
    opacity: 0.5,
  },
  ripple: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 100,
    height: 100,
    marginLeft: -50,
    marginTop: -50,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  primaryButton: {
    backgroundColor: '#a8e6cf',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#a8e6cf',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  successButton: {
    backgroundColor: '#4FFFB0',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
