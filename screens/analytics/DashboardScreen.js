import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getCurrentUser } from '../../utils/storage/supabaseStorage';
import { loadCirclesWithMembers } from '../../utils/storage/circlesStorage';
import { getHealthScores } from '../../utils/scoring/healthScoring';
import {
  getNetworkHealthScore,
  getHealthDistribution,
  getContactsNeedingAttention,
  getCircleHealthBreakdown,
  getActivitySummary,
  createHealthSnapshot,
} from '../../utils/scoring/analyticsCalculations';
import { getStreak } from '../../utils/streaksStorage';
import { getAchievements, getTotalPoints, checkAndUnlockAchievements } from '../../utils/achievementsStorage';

import NetworkHealthScore from '../../components/NetworkHealthScore';
import HealthDistributionChart from '../../components/HealthDistributionChart';
import PriorityContactsList from '../../components/PriorityContactsList';
import CircleHealthBreakdown from '../../components/contacts/CircleHealthBreakdown';
import WeeklyActivityCard from '../../components/WeeklyActivityCard';
import StreakCard from '../../components/StreakCard';
import { RecentAchievements } from '../../components/AchievementCard';

export default function DashboardScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState(null);

  // Data states
  const [networkHealth, setNetworkHealth] = useState({ score: 100, status: 'healthy', trend: null });
  const [distribution, setDistribution] = useState({});
  const [priorityContacts, setPriorityContacts] = useState([]);
  const [circleHealth, setCircleHealth] = useState([]);
  const [activitySummary, setActivitySummary] = useState({});
  const [streak, setStreak] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [totalPoints, setTotalPoints] = useState(0);

  const loadDashboardData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);

    try {
      const { success, user } = await getCurrentUser();
      if (!success || !user) {
        console.log('[Dashboard] No user found');
        setLoading(false);
        return;
      }

      setUserId(user.id);

      // Create today's health snapshot
      await createHealthSnapshot(user.id);

      // Load all data in parallel
      const [
        healthScoreResult,
        distributionResult,
        priorityResult,
        activityResult,
        circlesResult,
        healthScoresResult,
        streakResult,
        achievementsResult,
        pointsResult,
      ] = await Promise.all([
        getNetworkHealthScore(user.id),
        getHealthDistribution(user.id),
        getContactsNeedingAttention(user.id, 5),
        getActivitySummary(user.id, 7),
        loadCirclesWithMembers(user.id),
        getHealthScores(user.id),
        getStreak(user.id),
        getAchievements(user.id),
        getTotalPoints(user.id),
      ]);

      // Update states
      if (healthScoreResult.success) {
        setNetworkHealth({
          score: healthScoreResult.score,
          status: healthScoreResult.status,
          trend: healthScoreResult.trend,
        });
      }

      if (distributionResult.success) {
        setDistribution(distributionResult.distribution);
      }

      if (priorityResult.success) {
        setPriorityContacts(priorityResult.contacts);
      }

      if (activityResult.success) {
        setActivitySummary(activityResult.summary);
      }

      // Calculate circle health breakdown
      if (circlesResult.success && healthScoresResult.success) {
        const healthMap = {};
        for (const h of healthScoresResult.healthScores || []) {
          healthMap[h.imported_contact_id] = h;
        }
        const breakdown = getCircleHealthBreakdown(circlesResult.circles, healthMap);
        setCircleHealth(breakdown);
      }

      // Update streak and achievements
      if (streakResult.success) {
        setStreak(streakResult.streak);
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
        const refreshedAchievements = await getAchievements(user.id);
        if (refreshedAchievements.success) {
          setAchievements(refreshedAchievements.achievements);
        }
        const newPoints = await getTotalPoints(user.id);
        if (newPoints.success) {
          setTotalPoints(newPoints.points);
        }
      }

    } catch (error) {
      console.error('[Dashboard] Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();

    // Refresh when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      loadDashboardData(false);
    });

    return unsubscribe;
  }, [navigation, loadDashboardData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDashboardData(false);
  }, [loadDashboardData]);

  const handleContactPress = (contact) => {
    // Open SMS to message the contact
    if (contact.phone) {
      const phoneNumber = contact.phone.replace(/[^0-9]/g, '');
      Linking.openURL(`sms:${phoneNumber}`);
    }
  };

  const handleStatusPress = (status) => {
    // Navigate to filtered contacts list
    navigation.navigate('ContactsTab', { filterStatus: status });
  };

  const handleCirclePress = (circle) => {
    // Navigate to home and focus on circle
    navigation.navigate('HomeTab', { focusCircleId: circle.id });
  };

  const handleViewAllPriority = () => {
    navigation.navigate('AlertsTab');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#0a2e1a', '#05140a', '#000000']}
          style={styles.gradient}
        >
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4FFFB0" />
            <Text style={styles.loadingText}>Loading analytics...</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a2e1a', '#05140a', '#000000']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#4FFFB0"
              colors={['#4FFFB0']}
            />
          }
        >
          {/* Network Health Score */}
          <NetworkHealthScore
            score={networkHealth.score}
            trend={networkHealth.trend}
            status={networkHealth.status}
          />

          {/* Streak & Gamification */}
          <View style={styles.section}>
            <StreakCard
              streak={streak}
              compact
              onPress={() => navigation.navigate('Gamification')}
            />
          </View>

          {/* Weekly Activity */}
          <View style={styles.section}>
            <WeeklyActivityCard summary={activitySummary} />
          </View>

          {/* Achievements */}
          <View style={styles.section}>
            <RecentAchievements
              achievements={achievements}
              onViewAll={() => navigation.navigate('Achievements')}
            />
          </View>

          {/* Priority Contacts */}
          <View style={styles.section}>
            <PriorityContactsList
              contacts={priorityContacts}
              onContactPress={handleContactPress}
              onViewAll={handleViewAllPriority}
              maxItems={5}
            />
          </View>

          {/* Health Distribution */}
          <View style={styles.section}>
            <HealthDistributionChart
              distribution={distribution}
              onStatusPress={handleStatusPress}
            />
          </View>

          {/* Circle Health Breakdown */}
          <View style={styles.section}>
            <CircleHealthBreakdown
              circles={circleHealth}
              onCirclePress={handleCirclePress}
            />
          </View>

          {/* Bottom spacing */}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#ffffff',
    marginTop: 12,
    fontSize: 14,
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(79, 255, 176, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  section: {
    marginTop: 16,
  },
  bottomSpacer: {
    height: 40,
  },
});
