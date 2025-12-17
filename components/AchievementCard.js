import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ACHIEVEMENT_CATEGORIES } from '../utils/achievementsStorage';

/**
 * Single achievement card
 */
export default function AchievementCard({ achievement, onPress, compact = false }) {
  const { isUnlocked, progress, currentValue, targetValue } = achievement;

  if (compact) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={[styles.compactCard, isUnlocked && styles.compactCardUnlocked]}
      >
        <Text style={[styles.compactEmoji, !isUnlocked && styles.locked]}>
          {achievement.emoji}
        </Text>
        <Text style={[styles.compactName, !isUnlocked && styles.lockedText]} numberOfLines={1}>
          {achievement.name}
        </Text>
        {!isUnlocked && (
          <View style={styles.compactProgress}>
            <View style={[styles.compactProgressFill, { width: `${progress}%` }]} />
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <View style={[styles.card, isUnlocked && styles.cardUnlocked]}>
        <View style={styles.emojiContainer}>
          <Text style={[styles.emoji, !isUnlocked && styles.locked]}>
            {achievement.emoji}
          </Text>
          {isUnlocked && (
            <View style={styles.checkBadge}>
              <Text style={styles.checkText}>✓</Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          <Text style={[styles.name, !isUnlocked && styles.lockedText]}>
            {achievement.name}
          </Text>
          <Text style={[styles.description, !isUnlocked && styles.lockedText]}>
            {achievement.description}
          </Text>

          {!isUnlocked && (
            <View style={styles.progressSection}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
              <Text style={styles.progressText}>
                {currentValue}/{targetValue}
              </Text>
            </View>
          )}

          {isUnlocked && (
            <Text style={styles.unlockedDate}>
              Unlocked {formatDate(achievement.unlockedAt)}
            </Text>
          )}
        </View>

        <View style={styles.pointsBadge}>
          <Text style={styles.pointsText}>{achievement.points}</Text>
          <Text style={styles.pointsLabel}>pts</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

/**
 * Achievement unlock celebration
 */
export function AchievementUnlocked({ achievement, onDismiss }) {
  return (
    <View style={styles.celebrationOverlay}>
      <LinearGradient
        colors={['#4FFFB0', '#00D4AA', '#009B77']}
        style={styles.celebrationCard}
      >
        <Text style={styles.celebrationTitle}>Achievement Unlocked!</Text>
        <Text style={styles.celebrationEmoji}>{achievement.emoji}</Text>
        <Text style={styles.celebrationName}>{achievement.name}</Text>
        <Text style={styles.celebrationDescription}>{achievement.description}</Text>
        <View style={styles.celebrationPoints}>
          <Text style={styles.celebrationPointsText}>+{achievement.points} points</Text>
        </View>
        <TouchableOpacity style={styles.celebrationButton} onPress={onDismiss}>
          <Text style={styles.celebrationButtonText}>Awesome!</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

/**
 * Achievement category section
 */
export function AchievementCategory({ category, achievements, onAchievementPress }) {
  const categoryInfo = ACHIEVEMENT_CATEGORIES[category];
  const unlockedCount = achievements.filter((a) => a.isUnlocked).length;

  return (
    <View style={styles.categorySection}>
      <View style={styles.categoryHeader}>
        <Text style={styles.categoryEmoji}>{categoryInfo.emoji}</Text>
        <Text style={styles.categoryName}>{categoryInfo.name}</Text>
        <Text style={styles.categoryCount}>
          {unlockedCount}/{achievements.length}
        </Text>
      </View>
      <FlatList
        data={achievements}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AchievementCard
            achievement={item}
            compact
            onPress={() => onAchievementPress?.(item)}
          />
        )}
        contentContainerStyle={styles.categoryList}
      />
    </View>
  );
}

/**
 * Total points display
 */
export function PointsDisplay({ points, totalPossible }) {
  const percentage = totalPossible > 0 ? Math.round((points / totalPossible) * 100) : 0;

  return (
    <View style={styles.pointsDisplay}>
      <Text style={styles.pointsDisplayLabel}>Total Points</Text>
      <Text style={styles.pointsDisplayValue}>{points}</Text>
      <Text style={styles.pointsDisplayTotal}>/ {totalPossible} possible</Text>
      <View style={styles.pointsProgressBar}>
        <View style={[styles.pointsProgressFill, { width: `${percentage}%` }]} />
      </View>
    </View>
  );
}

/**
 * Recent achievements row for dashboard
 */
export function RecentAchievements({ achievements, onViewAll }) {
  const recentUnlocked = achievements
    .filter((a) => a.isUnlocked)
    .sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt))
    .slice(0, 5);

  if (recentUnlocked.length === 0) {
    return (
      <View style={styles.recentSection}>
        <Text style={styles.recentTitle}>Achievements</Text>
        <Text style={styles.noAchievements}>
          No achievements yet. Keep using ping! to unlock them!
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.recentSection}>
      <View style={styles.recentHeader}>
        <Text style={styles.recentTitle}>Recent Achievements</Text>
        <TouchableOpacity onPress={onViewAll}>
          <Text style={styles.viewAllText}>View All →</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.recentRow}>
        {recentUnlocked.map((achievement) => (
          <View key={achievement.id} style={styles.recentBadge}>
            <Text style={styles.recentEmoji}>{achievement.emoji}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

const styles = StyleSheet.create({
  // Full card styles
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardUnlocked: {
    backgroundColor: 'rgba(79, 255, 176, 0.1)',
    borderColor: 'rgba(79, 255, 176, 0.3)',
  },
  emojiContainer: {
    position: 'relative',
    marginRight: 14,
  },
  emoji: {
    fontSize: 40,
  },
  locked: {
    opacity: 0.4,
  },
  checkBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#4FFFB0',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  lockedText: {
    color: 'rgba(255,255,255,0.5)',
  },
  description: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    marginRight: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4FFFB0',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    minWidth: 45,
    textAlign: 'right',
  },
  unlockedDate: {
    fontSize: 12,
    color: '#4FFFB0',
    marginTop: 6,
  },
  pointsBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginLeft: 12,
  },
  pointsText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFD93D',
  },
  pointsLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
  },

  // Compact card styles
  compactCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    marginRight: 10,
    width: 90,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  compactCardUnlocked: {
    backgroundColor: 'rgba(79, 255, 176, 0.1)',
    borderColor: 'rgba(79, 255, 176, 0.3)',
  },
  compactEmoji: {
    fontSize: 32,
    marginBottom: 6,
  },
  compactName: {
    fontSize: 11,
    fontWeight: '500',
    color: '#fff',
    textAlign: 'center',
  },
  compactProgress: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  compactProgressFill: {
    height: '100%',
    backgroundColor: '#4FFFB0',
    borderRadius: 2,
  },

  // Celebration styles
  celebrationOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  celebrationCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  celebrationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(0,0,0,0.6)',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  celebrationEmoji: {
    fontSize: 72,
    marginBottom: 16,
  },
  celebrationName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
  },
  celebrationDescription: {
    fontSize: 16,
    color: 'rgba(0,0,0,0.7)',
    textAlign: 'center',
    marginTop: 8,
  },
  celebrationPoints: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginTop: 20,
  },
  celebrationPointsText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  celebrationButton: {
    backgroundColor: '#000',
    borderRadius: 25,
    paddingHorizontal: 40,
    paddingVertical: 14,
    marginTop: 24,
  },
  celebrationButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },

  // Category section styles
  categorySection: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  categoryEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  categoryCount: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  categoryList: {
    paddingHorizontal: 16,
  },

  // Points display styles
  pointsDisplay: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,215,61,0.3)',
  },
  pointsDisplayLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  pointsDisplayValue: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFD93D',
    marginVertical: 4,
  },
  pointsDisplayTotal: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },
  pointsProgressBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    marginTop: 16,
    overflow: 'hidden',
  },
  pointsProgressFill: {
    height: '100%',
    backgroundColor: '#FFD93D',
    borderRadius: 3,
  },

  // Recent achievements styles
  recentSection: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  viewAllText: {
    fontSize: 14,
    color: '#4FFFB0',
  },
  recentRow: {
    flexDirection: 'row',
    gap: 12,
  },
  recentBadge: {
    backgroundColor: 'rgba(79, 255, 176, 0.15)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(79, 255, 176, 0.3)',
  },
  recentEmoji: {
    fontSize: 28,
  },
  noAchievements: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    paddingVertical: 12,
  },
});
