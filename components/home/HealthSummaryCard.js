import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HealthSummaryBar } from './HealthIndicator';

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
        <Ionicons name="alert-circle" size={20} color="#FF8C42" />
        <Text style={styles.healthSummaryText}>
          {healthStats.needsAttention} contact{healthStats.needsAttention > 1 ? 's' : ''} need{healthStats.needsAttention === 1 ? 's' : ''} attention
        </Text>
        <Ionicons name="chevron-forward" size={16} color="#666" />
      </View>
      <HealthSummaryBar stats={healthStats} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  healthSummaryCard: {
    marginHorizontal: 20,
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(255, 140, 66, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 140, 66, 0.3)',
  },
  healthSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  healthSummaryText: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
});
