import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View, Vibration, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Quick action menu for long-press on contacts
 * Shows a floating menu with quick actions
 */
export function QuickActionMenu({
  visible,
  contact,
  position = { x: 0, y: 0 },
  onMessage,
  onJustTalked,
  onSetReminder,
  onViewDetails,
  onClose,
}) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Haptic feedback on show
      if (Platform.OS === 'ios') {
        Vibration.vibrate(10);
      }

      // Animate in
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  const actions = [
    {
      icon: 'chatbubble',
      label: 'Message',
      color: '#4FFFB0',
      onPress: () => {
        onClose?.();
        onMessage?.(contact);
      },
    },
    {
      icon: 'checkmark-circle',
      label: 'Just Talked',
      color: '#4FFFB0',
      onPress: () => {
        onClose?.();
        onJustTalked?.(contact);
      },
    },
    {
      icon: 'alarm',
      label: 'Reminder',
      color: '#FFD93D',
      onPress: () => {
        onClose?.();
        onSetReminder?.(contact);
      },
    },
    {
      icon: 'person',
      label: 'Details',
      color: '#ffffff',
      onPress: () => {
        onClose?.();
        onViewDetails?.(contact);
      },
    },
  ];

  // Calculate menu position (center above the touch point)
  const menuStyle = {
    position: 'absolute',
    left: Math.max(20, Math.min(position.x - 100, 200)), // Keep within screen bounds
    top: Math.max(100, position.y - 180), // Position above the touch point
  };

  return (
    <>
      {/* Backdrop */}
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      />

      {/* Menu */}
      <Animated.View
        style={[
          styles.menuContainer,
          menuStyle,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        {/* Contact name header */}
        <View style={styles.menuHeader}>
          <Text style={styles.menuTitle} numberOfLines={1}>
            {contact?.name || 'Contact'}
          </Text>
        </View>

        {/* Action buttons */}
        <View style={styles.actionsGrid}>
          {actions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.actionButton}
              onPress={action.onPress}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: action.color + '20' }]}>
                <Ionicons name={action.icon} size={22} color={action.color} />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 500,
  },
  menuContainer: {
    backgroundColor: 'rgba(26, 42, 26, 0.98)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(79, 255, 176, 0.5)',
    padding: 12,
    minWidth: 200,
    zIndex: 600,
    shadowColor: '#4FFFB0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 15,
  },
  menuHeader: {
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(79, 255, 176, 0.2)',
    marginBottom: 10,
  },
  menuTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionButton: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  actionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  actionLabel: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '500',
  },
});

export default QuickActionMenu;
