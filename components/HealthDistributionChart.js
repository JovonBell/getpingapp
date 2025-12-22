import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { getHealthColor } from '../utils/scoring/healthScoring';

/**
 * Horizontal bar chart showing distribution of contact health statuses
 * @param {object} distribution - {total, healthy, cooling, at_risk, cold}
 * @param {function} onStatusPress - Callback when a status row is pressed
 */
export default function HealthDistributionChart({ distribution = {}, onStatusPress }) {
  const { total = 0, healthy = 0, cooling = 0, at_risk = 0, cold = 0 } = distribution;

  const statuses = [
    { key: 'healthy', label: 'Healthy', count: healthy, color: getHealthColor('healthy') },
    { key: 'cooling', label: 'Cooling', count: cooling, color: getHealthColor('cooling') },
    { key: 'at_risk', label: 'At Risk', count: at_risk, color: getHealthColor('at_risk') },
    { key: 'cold', label: 'Cold', count: cold, color: getHealthColor('cold') },
  ];

  const maxCount = Math.max(healthy, cooling, at_risk, cold, 1);

  if (total === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>RELATIONSHIP STATUS</Text>
        <Text style={styles.emptyText}>No contacts in circles yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>RELATIONSHIP STATUS</Text>

      {statuses.map((status) => {
        const percentage = total > 0 ? (status.count / total) * 100 : 0;
        const barWidth = maxCount > 0 ? (status.count / maxCount) * 100 : 0;

        return (
          <TouchableOpacity
            key={status.key}
            style={styles.row}
            onPress={() => onStatusPress?.(status.key)}
            activeOpacity={0.7}
            disabled={status.count === 0}
          >
            <View style={styles.labelContainer}>
              <View style={[styles.dot, { backgroundColor: status.color }]} />
              <Text style={styles.label}>{status.label}</Text>
            </View>

            <View style={styles.barContainer}>
              <View
                style={[
                  styles.bar,
                  {
                    width: `${barWidth}%`,
                    backgroundColor: status.color,
                    opacity: status.count > 0 ? 1 : 0.3,
                  },
                ]}
              />
            </View>

            <Text style={[styles.count, { color: status.color }]}>
              {status.count}
            </Text>
          </TouchableOpacity>
        );
      })}

      {/* Stacked bar summary */}
      <View style={styles.stackedBarContainer}>
        <View style={styles.stackedBar}>
          {statuses.map((status) => {
            const width = total > 0 ? (status.count / total) * 100 : 0;
            if (width === 0) return null;
            return (
              <View
                key={status.key}
                style={[
                  styles.stackedSegment,
                  {
                    width: `${width}%`,
                    backgroundColor: status.color,
                  },
                ]}
              />
            );
          })}
        </View>
        <Text style={styles.totalText}>{total} total contacts</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: 'rgba(79, 255, 176, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(79, 255, 176, 0.2)',
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888888',
    letterSpacing: 1,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    paddingVertical: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  label: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '500',
  },
  barContainer: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 4,
  },
  count: {
    width: 30,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  stackedBarContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  stackedBar: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  stackedSegment: {
    height: '100%',
  },
  totalText: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    marginTop: 8,
  },
});
