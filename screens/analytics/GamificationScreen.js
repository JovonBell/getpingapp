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
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import { getStreak, updateWeeklyGoal, getStreakStatus } from '../../utils/streaksStorage';
import {
  getAchievements,
  getTotalPoints,
  checkAndUnlockAchievements,
  ACHIEVEMENTS,
} from '../../utils/achievementsStorage';
import StreakCard from '../../components/StreakCard';
import { RecentAchievements } from '../../components/AchievementCard';

export default function GamificationScreen({ navigation }) {
  const [streak, setStreak] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(5);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load all data in parallel
      const [streakResult, achievementsResult, pointsResult] = await Promise.all([
        getStreak(user.id),
        getAchievements(user.id),
        getTotalPoints(user.id),
      ]);

      if (streakResult.success) {
        setStreak(streakResult.streak);
        setSelectedGoal(streakResult.streak.weeklyGoal || 5);
      }
      if (achievementsResult.success) {
        setAchievements(achievementsResult.achievements);
      }
      if (pointsResult.success) {
        setTotalPoints(pointsResult.points);
      }

      // Check for new achievements
      const unlockResult = await checkAndUnlockAchievements(user.id);
      if (unlockResult.success && unlockResult.newlyUnlocked.length > 0) {
        // Reload achievements to show newly unlocked
        const refreshed = await getAchievements(user.id);
        if (refreshed.success) {
          setAchievements(refreshed.achievements);
        }
        const newPoints = await getTotalPoints(user.id);
        if (newPoints.success) {
          setTotalPoints(newPoints.points);
        }
      }
    } catch (err) {
      console.error('[GamificationScreen] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const handleUpdateGoal = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const result = await updateWeeklyGoal(user.id, selectedGoal);
      if (result.success) {
        setStreak((prev) => ({ ...prev, weeklyGoal: selectedGoal }));
        setShowGoalModal(false);
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const unlockedCount = achievements.filter((a) => a.isUnlocked).length;
  const totalCount = Object.keys(ACHIEVEMENTS).length;
  const totalPossiblePoints = Object.values(ACHIEVEMENTS).reduce(
    (sum, a) => sum + a.points,
    0
  );
  const streakStatus = getStreakStatus(streak);

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
            <Text style={styles.headerTitle}>Progress</Text>
            <View style={styles.headerRight}>
              <Text style={styles.pointsBadge}>{totalPoints} pts</Text>
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
            {/* Streak Card */}
            <StreakCard streak={streak} onPress={() => setShowGoalModal(true)} />

            {/* Quick Stats */}
            <View style={styles.quickStats}>
              <View style={styles.statCard}>
                <Text style={styles.statEmoji}>{streakStatus.emoji}</Text>
                <Text style={styles.statValue}>{streak?.currentStreak || 0}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statEmoji}>🏆</Text>
                <Text style={styles.statValue}>
                  {unlockedCount}/{totalCount}
                </Text>
                <Text style={styles.statLabel}>Achievements</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statEmoji}>⭐</Text>
                <Text style={styles.statValue}>{totalPoints}</Text>
                <Text style={styles.statLabel}>Points</Text>
              </View>
            </View>

            {/* Recent Achievements */}
            <RecentAchievements
              achievements={achievements}
              onViewAll={() => navigation.navigate('Achievements')}
            />

            {/* Progress Summary */}
            <View style={styles.progressSection}>
              <Text style={styles.sectionTitle}>Your Journey</Text>

              <View style={styles.journeyCard}>
                <View style={styles.journeyRow}>
                  <Text style={styles.journeyLabel}>Total Days Active</Text>
                  <Text style={styles.journeyValue}>{streak?.totalDaysActive || 0}</Text>
                </View>
                <View style={styles.journeyRow}>
                  <Text style={styles.journeyLabel}>Longest Streak</Text>
                  <Text style={styles.journeyValue}>{streak?.longestStreak || 0} days</Text>
                </View>
                <View style={styles.journeyRow}>
                  <Text style={styles.journeyLabel}>Achievements Unlocked</Text>
                  <Text style={styles.journeyValue}>
                    {Math.round((unlockedCount / totalCount) * 100)}%
                  </Text>
                </View>
                <View style={styles.journeyRow}>
                  <Text style={styles.journeyLabel}>Points Earned</Text>
                  <Text style={styles.journeyValue}>
                    {Math.round((totalPoints / totalPossiblePoints) * 100)}%
                  </Text>
                </View>
              </View>
            </View>

            {/* View All Achievements Button */}
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => navigation.navigate('Achievements')}
            >
              <Text style={styles.viewAllButtonText}>View All Achievements</Text>
              <Text style={styles.viewAllArrow}>→</Text>
            </TouchableOpacity>

            <View style={styles.bottomPadding} />
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>

      {/* Weekly Goal Modal */}
      <Modal
        visible={showGoalModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGoalModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowGoalModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Weekly Goal</Text>
            <Text style={styles.modalSubtitle}>
              How many days per week do you want to reach out to contacts?
            </Text>

            <View style={styles.goalOptions}>
              {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.goalOption,
                    selectedGoal === num && styles.goalOptionSelected,
                  ]}
                  onPress={() => setSelectedGoal(num)}
                >
                  <Text
                    style={[
                      styles.goalOptionText,
                      selectedGoal === num && styles.goalOptionTextSelected,
                    ]}
                  >
                    {num}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.goalDescription}>
              {selectedGoal === 7
                ? 'Every day - The ultimate relationship builder!'
                : selectedGoal >= 5
                ? 'Great goal! Stay connected most days.'
                : selectedGoal >= 3
                ? 'A balanced approach to staying in touch.'
                : 'Start small and build the habit!'}
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowGoalModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleUpdateGoal}
              >
                <Text style={styles.saveButtonText}>Save Goal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
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
  pointsBadge: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD93D',
    backgroundColor: 'rgba(255, 215, 61, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },
  quickStats: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4,
  },
  progressSection: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  journeyCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  journeyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  journeyLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  journeyValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4FFFB0',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(79, 255, 176, 0.1)',
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(79, 255, 176, 0.3)',
  },
  viewAllButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4FFFB0',
  },
  viewAllArrow: {
    fontSize: 18,
    color: '#4FFFB0',
    marginLeft: 8,
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
    borderWidth: 1,
    borderColor: 'rgba(79, 255, 176, 0.2)',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  goalOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  goalOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  goalOptionSelected: {
    backgroundColor: 'rgba(79, 255, 176, 0.2)',
    borderColor: '#4FFFB0',
  },
  goalOptionText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  goalOptionTextSelected: {
    color: '#4FFFB0',
  },
  goalDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.6)',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#4FFFB0',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
});
