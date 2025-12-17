import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';
import {
  getAchievements,
  getTotalPoints,
  getAchievementsByCategory,
  ACHIEVEMENTS,
  ACHIEVEMENT_CATEGORIES,
} from '../utils/achievementsStorage';
import AchievementCard, {
  AchievementCategory,
  PointsDisplay,
} from '../components/AchievementCard';

export default function AchievementsScreen({ navigation }) {
  const [achievements, setAchievements] = useState([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [viewMode, setViewMode] = useState('categories'); // 'categories' or 'all'

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [achievementsResult, pointsResult] = await Promise.all([
        getAchievements(user.id),
        getTotalPoints(user.id),
      ]);

      if (achievementsResult.success) {
        setAchievements(achievementsResult.achievements);
      }
      if (pointsResult.success) {
        setTotalPoints(pointsResult.points);
      }
    } catch (err) {
      console.error('[AchievementsScreen] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAchievements();
    setRefreshing(false);
  }, []);

  const totalPossiblePoints = Object.values(ACHIEVEMENTS).reduce(
    (sum, a) => sum + a.points,
    0
  );

  const unlockedCount = achievements.filter((a) => a.isUnlocked).length;
  const totalCount = achievements.length;

  const achievementsByCategory = getAchievementsByCategory(achievements);

  const handleAchievementPress = (achievement) => {
    setSelectedAchievement(achievement);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#1a1a2e', '#0a0a15']} style={styles.gradient}>
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Achievements</Text>
            <View style={styles.headerRight}>
              <Text style={styles.unlockCount}>
                {unlockedCount}/{totalCount}
              </Text>
            </View>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#4FFFB0"
              />
            }
          >
            {/* Points Display */}
            <PointsDisplay points={totalPoints} totalPossible={totalPossiblePoints} />

            {/* View Mode Toggle */}
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  viewMode === 'categories' && styles.toggleButtonActive,
                ]}
                onPress={() => setViewMode('categories')}
              >
                <Text
                  style={[
                    styles.toggleText,
                    viewMode === 'categories' && styles.toggleTextActive,
                  ]}
                >
                  By Category
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  viewMode === 'all' && styles.toggleButtonActive,
                ]}
                onPress={() => setViewMode('all')}
              >
                <Text
                  style={[
                    styles.toggleText,
                    viewMode === 'all' && styles.toggleTextActive,
                  ]}
                >
                  All
                </Text>
              </TouchableOpacity>
            </View>

            {viewMode === 'categories' ? (
              // Category View
              Object.entries(achievementsByCategory).map(([category, categoryAchievements]) => (
                <AchievementCategory
                  key={category}
                  category={category}
                  achievements={categoryAchievements}
                  onAchievementPress={handleAchievementPress}
                />
              ))
            ) : (
              // All View
              <View style={styles.allAchievements}>
                {/* Unlocked First */}
                {achievements
                  .sort((a, b) => {
                    if (a.isUnlocked && !b.isUnlocked) return -1;
                    if (!a.isUnlocked && b.isUnlocked) return 1;
                    if (a.isUnlocked && b.isUnlocked) {
                      return new Date(b.unlockedAt) - new Date(a.unlockedAt);
                    }
                    return b.progress - a.progress;
                  })
                  .map((achievement) => (
                    <AchievementCard
                      key={achievement.id}
                      achievement={achievement}
                      onPress={() => handleAchievementPress(achievement)}
                    />
                  ))}
              </View>
            )}

            <View style={styles.bottomPadding} />
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>

      {/* Achievement Detail Modal */}
      <Modal
        visible={!!selectedAchievement}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedAchievement(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedAchievement(null)}
        >
          <View style={styles.modalContent}>
            {selectedAchievement && (
              <>
                <Text
                  style={[
                    styles.modalEmoji,
                    !selectedAchievement.isUnlocked && styles.modalEmojiLocked,
                  ]}
                >
                  {selectedAchievement.emoji}
                </Text>
                <Text style={styles.modalName}>{selectedAchievement.name}</Text>
                <Text style={styles.modalDescription}>
                  {selectedAchievement.description}
                </Text>

                <View style={styles.modalStats}>
                  <View style={styles.modalStat}>
                    <Text style={styles.modalStatValue}>
                      {selectedAchievement.points}
                    </Text>
                    <Text style={styles.modalStatLabel}>Points</Text>
                  </View>
                  <View style={styles.modalStat}>
                    <Text style={styles.modalStatValue}>
                      {selectedAchievement.currentValue}/{selectedAchievement.targetValue}
                    </Text>
                    <Text style={styles.modalStatLabel}>Progress</Text>
                  </View>
                </View>

                {!selectedAchievement.isUnlocked && (
                  <View style={styles.modalProgressSection}>
                    <View style={styles.modalProgressBar}>
                      <View
                        style={[
                          styles.modalProgressFill,
                          { width: `${selectedAchievement.progress}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.modalProgressText}>
                      {selectedAchievement.progress}% complete
                    </Text>
                  </View>
                )}

                {selectedAchievement.isUnlocked && (
                  <View style={styles.unlockedBadge}>
                    <Text style={styles.unlockedBadgeText}>
                      ✓ Unlocked {formatDate(selectedAchievement.unlockedAt)}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setSelectedAchievement(null)}
                >
                  <Text style={styles.modalCloseBtnText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a15',
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    padding: 8,
  },
  backText: {
    fontSize: 16,
    color: '#4FFFB0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  headerRight: {
    minWidth: 60,
    alignItems: 'flex-end',
  },
  unlockCount: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  toggleButtonActive: {
    backgroundColor: 'rgba(79, 255, 176, 0.2)',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.5)',
  },
  toggleTextActive: {
    color: '#4FFFB0',
  },
  allAchievements: {
    paddingBottom: 20,
  },
  bottomPadding: {
    height: 40,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(79, 255, 176, 0.2)',
  },
  modalEmoji: {
    fontSize: 72,
    marginBottom: 16,
  },
  modalEmojiLocked: {
    opacity: 0.4,
  },
  modalName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginTop: 8,
  },
  modalStats: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 40,
  },
  modalStat: {
    alignItems: 'center',
  },
  modalStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFD93D',
  },
  modalStatLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
  modalProgressSection: {
    width: '100%',
    marginTop: 24,
  },
  modalProgressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  modalProgressFill: {
    height: '100%',
    backgroundColor: '#4FFFB0',
    borderRadius: 4,
  },
  modalProgressText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginTop: 8,
  },
  unlockedBadge: {
    backgroundColor: 'rgba(79, 255, 176, 0.15)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 24,
  },
  unlockedBadgeText: {
    fontSize: 14,
    color: '#4FFFB0',
    fontWeight: '500',
  },
  modalCloseBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 12,
    marginTop: 24,
  },
  modalCloseBtnText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
});
