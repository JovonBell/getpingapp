import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Base skeleton element with shimmer animation
 */
export function SkeletonElement({ width, height, borderRadius = 4, style }) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
  });

  return (
    <View
      style={[
        styles.skeletonBase,
        {
          width,
          height,
          borderRadius,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <LinearGradient
          colors={[
            'rgba(255,255,255,0)',
            'rgba(255,255,255,0.05)',
            'rgba(255,255,255,0)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.shimmerGradient}
        />
      </Animated.View>
    </View>
  );
}

/**
 * Skeleton for a contact card
 */
export function ContactCardSkeleton() {
  return (
    <View style={styles.contactCard}>
      <SkeletonElement width={50} height={50} borderRadius={25} />
      <View style={styles.contactCardContent}>
        <SkeletonElement width={120} height={16} />
        <SkeletonElement width={80} height={12} style={{ marginTop: 8 }} />
      </View>
      <SkeletonElement width={40} height={40} borderRadius={20} />
    </View>
  );
}

/**
 * Skeleton for a list of contacts
 */
export function ContactListSkeleton({ count = 5 }) {
  return (
    <View style={styles.contactList}>
      {Array.from({ length: count }).map((_, i) => (
        <ContactCardSkeleton key={i} />
      ))}
    </View>
  );
}

/**
 * Skeleton for the dashboard health score
 */
export function HealthScoreSkeleton() {
  return (
    <View style={styles.healthScoreCard}>
      <SkeletonElement width={120} height={120} borderRadius={60} />
      <View style={styles.healthScoreContent}>
        <SkeletonElement width={100} height={16} style={{ marginTop: 16 }} />
        <SkeletonElement width={150} height={12} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
}

/**
 * Skeleton for a chart/stats card
 */
export function StatsCardSkeleton() {
  return (
    <View style={styles.statsCard}>
      <SkeletonElement width={80} height={14} />
      <View style={styles.statsRow}>
        <SkeletonElement width={'100%'} height={8} borderRadius={4} style={{ marginTop: 12 }} />
      </View>
      <View style={styles.statsLabels}>
        <SkeletonElement width={40} height={10} />
        <SkeletonElement width={40} height={10} />
        <SkeletonElement width={40} height={10} />
        <SkeletonElement width={40} height={10} />
      </View>
    </View>
  );
}

/**
 * Skeleton for streak card
 */
export function StreakCardSkeleton() {
  return (
    <View style={styles.streakCard}>
      <View style={styles.streakHeader}>
        <SkeletonElement width={40} height={40} borderRadius={20} />
        <View style={styles.streakContent}>
          <SkeletonElement width={100} height={16} />
          <SkeletonElement width={150} height={12} style={{ marginTop: 6 }} />
        </View>
      </View>
      <View style={styles.streakStats}>
        <SkeletonElement width={60} height={40} borderRadius={8} />
        <SkeletonElement width={60} height={40} borderRadius={8} />
        <SkeletonElement width={60} height={40} borderRadius={8} />
      </View>
    </View>
  );
}

/**
 * Skeleton for achievement card
 */
export function AchievementCardSkeleton() {
  return (
    <View style={styles.achievementCard}>
      <SkeletonElement width={50} height={50} borderRadius={12} />
      <View style={styles.achievementContent}>
        <SkeletonElement width={100} height={14} />
        <SkeletonElement width={140} height={10} style={{ marginTop: 6 }} />
        <SkeletonElement width={'80%'} height={6} borderRadius={3} style={{ marginTop: 10 }} />
      </View>
      <SkeletonElement width={40} height={30} borderRadius={6} />
    </View>
  );
}

/**
 * Skeleton for reminder card
 */
export function ReminderCardSkeleton() {
  return (
    <View style={styles.reminderCard}>
      <SkeletonElement width={40} height={40} borderRadius={20} />
      <View style={styles.reminderContent}>
        <SkeletonElement width={120} height={14} />
        <SkeletonElement width={80} height={10} style={{ marginTop: 6 }} />
      </View>
      <SkeletonElement width={60} height={28} borderRadius={14} />
    </View>
  );
}

/**
 * Full dashboard skeleton
 */
export function DashboardSkeleton() {
  return (
    <View style={styles.dashboardContainer}>
      <HealthScoreSkeleton />
      <StatsCardSkeleton />
      <StreakCardSkeleton />
      <View style={styles.sectionHeader}>
        <SkeletonElement width={140} height={18} />
      </View>
      <ContactCardSkeleton />
      <ContactCardSkeleton />
      <ContactCardSkeleton />
    </View>
  );
}

/**
 * Skeleton for alerts screen
 */
export function AlertsSkeleton() {
  return (
    <View style={styles.alertsContainer}>
      <ReminderCardSkeleton />
      <ReminderCardSkeleton />
      <View style={styles.sectionHeader}>
        <SkeletonElement width={120} height={16} />
      </View>
      <ContactCardSkeleton />
      <ContactCardSkeleton />
      <ContactCardSkeleton />
    </View>
  );
}

/**
 * Skeleton for profile/settings
 */
export function ProfileSkeleton() {
  return (
    <View style={styles.profileContainer}>
      <View style={styles.profileHeader}>
        <SkeletonElement width={80} height={80} borderRadius={40} />
        <SkeletonElement width={150} height={20} style={{ marginTop: 16 }} />
        <SkeletonElement width={200} height={14} style={{ marginTop: 8 }} />
      </View>
      <View style={styles.profileStats}>
        <SkeletonElement width={80} height={60} borderRadius={12} />
        <SkeletonElement width={80} height={60} borderRadius={12} />
        <SkeletonElement width={80} height={60} borderRadius={12} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeletonBase: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  shimmer: {
    width: '100%',
    height: '100%',
  },
  shimmerGradient: {
    width: '100%',
    height: '100%',
  },

  // Contact card skeleton
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    marginBottom: 12,
  },
  contactCardContent: {
    flex: 1,
    marginLeft: 14,
  },
  contactList: {
    padding: 16,
  },

  // Health score skeleton
  healthScoreCard: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  healthScoreContent: {
    alignItems: 'center',
  },

  // Stats card skeleton
  statsCard: {
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  statsRow: {
    marginVertical: 8,
  },
  statsLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },

  // Streak card skeleton
  streakCard: {
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  streakContent: {
    marginLeft: 12,
  },
  streakStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },

  // Achievement card skeleton
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  achievementContent: {
    flex: 1,
    marginLeft: 14,
  },

  // Reminder card skeleton
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  reminderContent: {
    flex: 1,
    marginLeft: 14,
  },

  // Dashboard skeleton
  dashboardContainer: {
    paddingTop: 16,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
  },

  // Alerts skeleton
  alertsContainer: {
    paddingTop: 16,
  },

  // Profile skeleton
  profileContainer: {
    paddingTop: 24,
  },
  profileHeader: {
    alignItems: 'center',
    paddingBottom: 24,
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 32,
    marginTop: 16,
  },
});
