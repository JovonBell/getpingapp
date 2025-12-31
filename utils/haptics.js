/**
 * Centralized haptic feedback patterns for Ping
 * Makes the universe feel tactile and alive
 */
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Only trigger haptics on iOS (Android support varies)
const isHapticsSupported = Platform.OS === 'ios';

/**
 * Heavy impact - for tapping planets (feels solid, has weight)
 */
export const planetTap = () => {
  if (isHapticsSupported) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }
};

/**
 * Medium impact - for crossing health thresholds, important interactions
 */
export const mediumImpact = () => {
  if (isHapticsSupported) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
};

/**
 * Light impact - for drag/swipe feedback, subtle interactions
 */
export const lightTick = () => {
  if (isHapticsSupported) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
};

/**
 * Selection feedback - for UI selections, toggles
 */
export const selection = () => {
  if (isHapticsSupported) {
    Haptics.selectionAsync();
  }
};

/**
 * Success notification - for "Just Talked", completed actions
 */
export const success = () => {
  if (isHapticsSupported) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
};

/**
 * Warning notification - for reminders, attention needed
 */
export const warning = () => {
  if (isHapticsSupported) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }
};

/**
 * Error notification - for failures, alerts
 */
export const error = () => {
  if (isHapticsSupported) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }
};

/**
 * Double tap pattern - for special attention (reminders due)
 */
export const doubleTap = async () => {
  if (isHapticsSupported) {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, 100);
  }
};

/**
 * Soft rumble - for zoom/pinch gestures
 */
export const softRumble = () => {
  if (isHapticsSupported) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
  }
};

/**
 * Rigid impact - for firm button presses
 */
export const rigidPress = () => {
  if (isHapticsSupported) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
  }
};

/**
 * Nucleus tap - deep thud for tapping the center of the universe
 */
export const nucleusTap = () => {
  if (isHapticsSupported) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }
};

/**
 * Ring cross - subtle tick when finger crosses an orbit ring
 */
export const ringCross = () => {
  if (isHapticsSupported) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
};

/**
 * Shooting star - magical twinkle haptic
 */
export const shootingStar = () => {
  if (isHapticsSupported) {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
};

/**
 * Comet impact - when a new contact lands in orbit
 */
export const cometImpact = () => {
  if (isHapticsSupported) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
};

// Export all as named object for convenience
export const Haptic = {
  planetTap,
  mediumImpact,
  lightTick,
  selection,
  success,
  warning,
  error,
  doubleTap,
  softRumble,
  rigidPress,
  nucleusTap,
  ringCross,
  shootingStar,
  cometImpact,
};

export default Haptic;
