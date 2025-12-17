import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getHealthColor } from '../utils/healthScoring';

/**
 * Shows health breakdown by circle
 * @param {Array} circles - Array of circle health summaries
 * @param {function} onCirclePress - Callback when a circle is pressed
 */
export default function CircleHealthBreakdown({ circles = [], onCirclePress }) {
  if (circles.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>BY CIRCLE</Text>
        <Text style={styles.emptyText}>Create circles to see health breakdown</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>BY CIRCLE</Text>

      {circles.map((circle) => {
        const color = getHealthColor(circle.status);
        const barWidth = circle.averageHealth;

        return (
          <TouchableOpacity
            key={circle.id}
            style={styles.row}
            onPress={() => onCirclePress?.(circle)}
            activeOpacity={0.7}
          >
            <View style={styles.circleInfo}>
              <View style={[styles.tierBadge, { borderColor: color }]}>
                <Text style={[styles.tierText, { color }]}>{circle.tier}</Text>
              </View>
              <View style={styles.nameContainer}>
                <Text style={styles.circleName} numberOfLines={1}>{circle.name}</Text>
                <Text style={styles.contactCount}>{circle.contactCount} contacts</Text>
              </View>
            </View>

            <View style={styles.barContainer}>
              <View
                style={[
                  styles.bar,
                  {
                    width: `${barWidth}%`,
                    backgroundColor: color,
                  },
                ]}
              />
              <View style={styles.barBackground} />
            </View>

            <Text style={[styles.percentage, { color }]}>
              {circle.averageHealth}%
            </Text>
          </TouchableOpacity>
        );
      })}
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
    paddingVertical: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  circleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 120,
  },
  tierBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  tierText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  nameContainer: {
    flex: 1,
  },
  circleName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  contactCount: {
    fontSize: 10,
    color: '#666666',
    marginTop: 1,
  },
  barContainer: {
    flex: 1,
    height: 8,
    marginHorizontal: 12,
    position: 'relative',
  },
  barBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
  },
  bar: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 8,
    borderRadius: 4,
    zIndex: 1,
  },
  percentage: {
    width: 40,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
});
