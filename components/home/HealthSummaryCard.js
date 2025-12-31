import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Compact single-line health notification bar
 * Shows only when contacts need attention
 */
export default function HealthSummaryCard({ healthStats, onPress }) {
  if (!healthStats || healthStats.needsAttention <= 0) {
    return null;
  }

  return (
    <TouchableOpacity
      style={styles.healthSummaryCard}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.healthSummaryRow}>
        <View style={styles.alertDot} />
        <Text style={styles.healthSummaryText}>
          {healthStats.needsAttention} need{healthStats.needsAttention === 1 ? 's' : ''} attention
        </Text>
        <Ionicons name="chevron-forward" size={14} color="#666" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Ultra-compact single-line notification bar
  healthSummaryCard: {
    marginHorizontal: 10,
    marginTop: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255, 140, 66, 0.08)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 66, 0.2)',
  },
  healthSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  alertDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF8C42',
  },
  healthSummaryText: {
    flex: 1,
    color: '#FF8C42',
    fontSize: 11,
    fontWeight: '500',
  },
});
