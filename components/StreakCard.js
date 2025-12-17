import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getStreakStatus, getWeeklyProgress, isStreakActive } from '../utils/streaksStorage';

/**
 * Main streak card showing current streak and weekly progress
 */
export default function StreakCard({ streak, onPress, compact = false }) {
  const streakStatus = getStreakStatus(streak);
  const weeklyStatus = getWeeklyProgress(streak);

  if (compact) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <View style={styles.compactCard}>
          <Text style={styles.compactEmoji}>{streakStatus.emoji}</Text>
          <View style={styles.compactInfo}>
            <Text style={styles.compactStreak}>
              {streak?.currentStreak || 0} day streak
            </Text>
            <Text style={styles.compactGoal}>
              {weeklyStatus.progress}/{weeklyStatus.goal} this week
            </Text>
          </View>
          {streak?.currentStreak > 0 && (
            <View style={styles.flameBadge}>
              <Text style={styles.flameText}>🔥</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <LinearGradient
        colors={getGradientColors(streakStatus.status)}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.header}>
          <Text style={styles.headerEmoji}>{streakStatus.emoji}</Text>
          <View style={styles.headerText}>
            <Text style={styles.title}>Daily Streak</Text>
            <Text style={styles.subtitle}>{streakStatus.message}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBlock}>
            <Text style={styles.statNumber}>{streak?.currentStreak || 0}</Text>
            <Text style={styles.statLabel}>Current</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statBlock}>
            <Text style={styles.statNumber}>{streak?.longestStreak || 0}</Text>
            <Text style={styles.statLabel}>Longest</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statBlock}>
            <Text style={styles.statNumber}>{streak?.totalDaysActive || 0}</Text>
            <Text style={styles.statLabel}>Total Days</Text>
          </View>
        </View>

        <View style={styles.weeklySection}>
          <View style={styles.weeklyHeader}>
            <Text style={styles.weeklyTitle}>Weekly Goal</Text>
            <Text style={styles.weeklyCount}>
              {weeklyStatus.progress}/{weeklyStatus.goal}
            </Text>
          </View>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${weeklyStatus.percentage}%` },
              ]}
            />
          </View>
          <Text style={styles.weeklyMessage}>{weeklyStatus.message}</Text>
        </View>

        {streakStatus.status === 'at_risk' && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>
              ⚡ Reach out to a contact today to maintain your streak!
            </Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

/**
 * Mini streak indicator for header/nav
 */
export function StreakBadge({ streak, onPress }) {
  const isActive = streak?.currentStreak > 0 && isStreakActive(streak?.lastActivityDate);

  return (
    <TouchableOpacity onPress={onPress} style={styles.badge}>
      <Text style={styles.badgeEmoji}>{isActive ? '🔥' : '⚪'}</Text>
      <Text style={[styles.badgeNumber, !isActive && styles.badgeInactive]}>
        {streak?.currentStreak || 0}
      </Text>
    </TouchableOpacity>
  );
}

/**
 * Streak celebration modal content
 */
export function StreakCelebration({ streak, milestone }) {
  const getMilestoneContent = () => {
    switch (milestone) {
      case 7:
        return { emoji: '🌟', title: '1 Week Streak!', message: "You've maintained connections for a whole week!" };
      case 14:
        return { emoji: '⭐', title: '2 Week Streak!', message: "Two weeks of nurturing relationships!" };
      case 30:
        return { emoji: '🏆', title: '30 Day Streak!', message: "A month of consistent connection! You're amazing!" };
      case 50:
        return { emoji: '💎', title: '50 Day Streak!', message: "Half a hundred days! Relationship master!" };
      case 100:
        return { emoji: '👑', title: '100 Day Streak!', message: "LEGENDARY! 100 days of staying connected!" };
      default:
        return { emoji: '🔥', title: `${streak?.currentStreak} Day Streak!`, message: "Keep the momentum going!" };
    }
  };

  const content = getMilestoneContent();

  return (
    <View style={styles.celebration}>
      <Text style={styles.celebrationEmoji}>{content.emoji}</Text>
      <Text style={styles.celebrationTitle}>{content.title}</Text>
      <Text style={styles.celebrationMessage}>{content.message}</Text>
      <View style={styles.celebrationStats}>
        <View style={styles.celebrationStat}>
          <Text style={styles.celebrationStatNumber}>{streak?.currentStreak || 0}</Text>
          <Text style={styles.celebrationStatLabel}>Days</Text>
        </View>
        <View style={styles.celebrationStat}>
          <Text style={styles.celebrationStatNumber}>{streak?.totalDaysActive || 0}</Text>
          <Text style={styles.celebrationStatLabel}>Total Active</Text>
        </View>
      </View>
    </View>
  );
}

function getGradientColors(status) {
  switch (status) {
    case 'legendary':
      return ['#FFD700', '#FFA500', '#FF8C00'];
    case 'amazing':
      return ['#FF6B6B', '#FF8E53', '#FFB347'];
    case 'great':
      return ['#4FFFB0', '#00D4AA', '#00B894'];
    case 'good':
      return ['#00D4AA', '#00B894', '#009B77'];
    case 'started':
      return ['#667eea', '#764ba2', '#6B8DD6'];
    case 'at_risk':
      return ['#FFD93D', '#FF9F43', '#FF6B6B'];
    case 'broken':
    case 'none':
    default:
      return ['#3a3a4a', '#2a2a3a', '#1a1a2a'];
  }
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerEmoji: {
    fontSize: 40,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statBlock: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  weeklySection: {
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 12,
    padding: 14,
  },
  weeklyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  weeklyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  weeklyCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 4,
  },
  weeklyMessage: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 8,
    textAlign: 'center',
  },
  warningBanner: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  warningText: {
    fontSize: 13,
    color: '#fff',
    textAlign: 'center',
    fontWeight: '500',
  },

  // Compact card styles
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(79, 255, 176, 0.3)',
  },
  compactEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  compactInfo: {
    flex: 1,
  },
  compactStreak: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  compactGoal: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  flameBadge: {
    backgroundColor: 'rgba(255,107,107,0.2)',
    borderRadius: 20,
    padding: 8,
  },
  flameText: {
    fontSize: 20,
  },

  // Badge styles
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeEmoji: {
    fontSize: 16,
    marginRight: 4,
  },
  badgeNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF6B6B',
  },
  badgeInactive: {
    color: 'rgba(255,255,255,0.5)',
  },

  // Celebration styles
  celebration: {
    alignItems: 'center',
    padding: 24,
  },
  celebrationEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  celebrationTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  celebrationMessage: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  celebrationStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
  },
  celebrationStat: {
    alignItems: 'center',
  },
  celebrationStatNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#4FFFB0',
  },
  celebrationStatLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
});
