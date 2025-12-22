import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getHealthColor, getStatusFromScore } from '../../utils/scoring/healthScoring';

/**
 * Small colored dot indicator for relationship health
 * @param {object} props
 * @param {number} props.score - Health score 0-100
 * @param {string} props.status - Health status (optional, will be calculated from score)
 * @param {number} props.size - Dot size in pixels (default: 10)
 * @param {boolean} props.showLabel - Show status label next to dot
 * @param {'small' | 'medium' | 'large'} props.variant - Size variant
 */
export function HealthDot({ score, status, size = 10, showLabel = false, variant }) {
  const healthStatus = status || getStatusFromScore(score || 0);
  const color = getHealthColor(healthStatus);

  // Variant sizes
  const variantSize = variant === 'large' ? 14 : variant === 'medium' ? 12 : size;

  return (
    <View style={styles.dotContainer}>
      <View
        style={[
          styles.dot,
          {
            width: variantSize,
            height: variantSize,
            borderRadius: variantSize / 2,
            backgroundColor: color,
          },
        ]}
      />
      {showLabel && (
        <Text style={[styles.label, { color }]}>
          {healthStatus.replace('_', ' ')}
        </Text>
      )}
    </View>
  );
}

/**
 * Health score badge with score number and colored background
 * @param {object} props
 * @param {number} props.score - Health score 0-100
 * @param {string} props.status - Health status (optional)
 */
export function HealthBadge({ score, status }) {
  const healthStatus = status || getStatusFromScore(score || 0);
  const color = getHealthColor(healthStatus);

  return (
    <View style={[styles.badge, { backgroundColor: color + '20', borderColor: color }]}>
      <View style={[styles.badgeDot, { backgroundColor: color }]} />
      <Text style={[styles.badgeScore, { color }]}>{score || 0}</Text>
    </View>
  );
}

/**
 * Full health status card with score, status, and days since contact
 * @param {object} props
 * @param {number} props.score - Health score 0-100
 * @param {string} props.status - Health status
 * @param {number} props.daysSince - Days since last contact
 */
export function HealthCard({ score, status, daysSince }) {
  const healthStatus = status || getStatusFromScore(score || 0);
  const color = getHealthColor(healthStatus);

  const statusLabel = {
    healthy: 'Healthy',
    cooling: 'Cooling',
    at_risk: 'At Risk',
    cold: 'Cold',
  }[healthStatus] || healthStatus;

  const daysLabel = daysSince === 0
    ? 'Today'
    : daysSince === 1
    ? '1 day ago'
    : `${daysSince} days ago`;

  return (
    <View style={[styles.card, { borderColor: color }]}>
      <View style={styles.cardHeader}>
        <View style={[styles.cardDot, { backgroundColor: color }]} />
        <Text style={[styles.cardStatus, { color }]}>{statusLabel}</Text>
      </View>
      <Text style={styles.cardScore}>{score}</Text>
      <Text style={styles.cardDays}>Last contact: {daysLabel}</Text>
    </View>
  );
}

/**
 * Compact health indicator for list items
 * Shows dot + days since contact
 * @param {object} props
 * @param {number} props.score - Health score 0-100
 * @param {number} props.daysSince - Days since last contact
 */
export function HealthCompact({ score, daysSince }) {
  const status = getStatusFromScore(score || 0);
  const color = getHealthColor(status);

  const daysText = daysSince === 0
    ? 'today'
    : daysSince === 1
    ? '1d'
    : `${daysSince}d`;

  return (
    <View style={styles.compact}>
      <View style={[styles.compactDot, { backgroundColor: color }]} />
      <Text style={styles.compactDays}>{daysText}</Text>
    </View>
  );
}

/**
 * Health summary bar showing distribution of health statuses
 * @param {object} props
 * @param {object} props.stats - Stats object with healthy, cooling, at_risk, cold counts
 */
export function HealthSummaryBar({ stats }) {
  const total = stats?.total || 0;
  if (total === 0) return null;

  const getWidth = (count) => `${((count || 0) / total) * 100}%`;

  return (
    <View style={styles.summaryBar}>
      <View style={[styles.summarySegment, { width: getWidth(stats.healthy), backgroundColor: getHealthColor('healthy') }]} />
      <View style={[styles.summarySegment, { width: getWidth(stats.cooling), backgroundColor: getHealthColor('cooling') }]} />
      <View style={[styles.summarySegment, { width: getWidth(stats.at_risk), backgroundColor: getHealthColor('at_risk') }]} />
      <View style={[styles.summarySegment, { width: getWidth(stats.cold), backgroundColor: getHealthColor('cold') }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  // Dot styles
  dotContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },

  // Badge styles
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeScore: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Card styles
  card: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    minWidth: 100,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  cardDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cardStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardScore: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginVertical: 4,
  },
  cardDays: {
    fontSize: 11,
    color: '#999999',
  },

  // Compact styles
  compact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  compactDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  compactDays: {
    fontSize: 11,
    color: '#999999',
  },

  // Summary bar styles
  summaryBar: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: '#333333',
  },
  summarySegment: {
    height: '100%',
  },
});

export default HealthDot;
