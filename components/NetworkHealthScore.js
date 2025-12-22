import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { getHealthColor } from '../utils/scoring/healthScoring';
import { getNetworkStatusLabel } from '../utils/scoring/analyticsCalculations';

/**
 * Circular gauge showing overall network health score
 * @param {number} score - Health score 0-100
 * @param {number|null} trend - Change from last period (positive = improved)
 * @param {string} status - Health status (healthy, cooling, at_risk, cold)
 */
export default function NetworkHealthScore({ score = 100, trend = null, status = 'healthy' }) {
  const size = 160;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const center = size / 2;

  const color = getHealthColor(status);
  const statusLabel = getNetworkStatusLabel(score);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>YOUR NETWORK HEALTH</Text>

      <View style={styles.gaugeContainer}>
        <Svg width={size} height={size}>
          {/* Background circle */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress circle */}
          <G rotation="-90" origin={`${center}, ${center}`}>
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke={color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${progress} ${circumference}`}
              strokeLinecap="round"
              fill="none"
            />
          </G>
        </Svg>

        {/* Score in center */}
        <View style={styles.scoreContainer}>
          <Text style={[styles.scoreNumber, { color }]}>{score}</Text>
          <Text style={styles.scoreLabel}>{statusLabel}</Text>
        </View>
      </View>

      {/* Trend indicator */}
      {trend !== null && trend !== 0 && (
        <View style={styles.trendContainer}>
          <Ionicons
            name={trend > 0 ? 'trending-up' : 'trending-down'}
            size={16}
            color={trend > 0 ? '#4FFFB0' : '#FF6B6B'}
          />
          <Text style={[styles.trendText, { color: trend > 0 ? '#4FFFB0' : '#FF6B6B' }]}>
            {trend > 0 ? '+' : ''}{trend} points from last week
          </Text>
        </View>
      )}

      {trend === null && (
        <Text style={styles.noTrendText}>Keep tracking to see trends</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
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
  gaugeContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginTop: 4,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 6,
  },
  trendText: {
    fontSize: 13,
    fontWeight: '500',
  },
  noTrendText: {
    fontSize: 12,
    color: '#666666',
    marginTop: 16,
  },
});
