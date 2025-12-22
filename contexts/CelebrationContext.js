import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import {
  AchievementCelebration,
  StreakCelebration,
  WeeklyGoalCelebration,
} from '../components/modals/CelebrationModal';
import { sendAchievementNotification } from '../utils/notifications/pushNotifications';

const CelebrationContext = createContext(null);

// Streak milestones that trigger celebrations
const STREAK_MILESTONES = [7, 14, 30, 50, 100];

export function CelebrationProvider({ children }) {
  // Achievement celebration state
  const [achievementVisible, setAchievementVisible] = useState(false);
  const [currentAchievement, setCurrentAchievement] = useState(null);

  // Streak celebration state
  const [streakVisible, setStreakVisible] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);

  // Weekly goal celebration state
  const [goalVisible, setGoalVisible] = useState(false);
  const [currentGoal, setCurrentGoal] = useState(0);

  // Queue for multiple celebrations
  const [celebrationQueue, setCelebrationQueue] = useState([]);

  // CRITICAL: Track timeout IDs to prevent memory leaks and ghost celebrations
  const timeoutIdsRef = useRef([]);

  // Cleanup all pending timeouts on unmount
  useEffect(() => {
    return () => {
      console.log('[CelebrationContext] Cleaning up', timeoutIdsRef.current.length, 'pending timeouts');
      timeoutIdsRef.current.forEach(id => clearTimeout(id));
      timeoutIdsRef.current = [];
    };
  }, []);

  /**
   * Show achievement celebration
   */
  const celebrateAchievement = useCallback((achievement) => {
    if (!achievement) return;

    // Add to queue if another celebration is showing
    if (achievementVisible || streakVisible || goalVisible) {
      setCelebrationQueue((prev) => [...prev, { type: 'achievement', data: achievement }]);
      return;
    }

    setCurrentAchievement(achievement);
    setAchievementVisible(true);

    // Also send push notification
    sendAchievementNotification(achievement).catch(() => {});
  }, [achievementVisible, streakVisible, goalVisible]);

  /**
   * Show streak milestone celebration
   */
  const celebrateStreak = useCallback((streakCount) => {
    // Only celebrate milestones
    if (!STREAK_MILESTONES.includes(streakCount)) return;

    // Add to queue if another celebration is showing
    if (achievementVisible || streakVisible || goalVisible) {
      setCelebrationQueue((prev) => [...prev, { type: 'streak', data: streakCount }]);
      return;
    }

    setCurrentStreak(streakCount);
    setStreakVisible(true);
  }, [achievementVisible, streakVisible, goalVisible]);

  /**
   * Show weekly goal completion celebration
   */
  const celebrateWeeklyGoal = useCallback((goal) => {
    // Add to queue if another celebration is showing
    if (achievementVisible || streakVisible || goalVisible) {
      setCelebrationQueue((prev) => [...prev, { type: 'goal', data: goal }]);
      return;
    }

    setCurrentGoal(goal);
    setGoalVisible(true);
  }, [achievementVisible, streakVisible, goalVisible]);

  /**
   * Process next celebration in queue
   */
  const processQueue = useCallback(() => {
    if (celebrationQueue.length === 0) return;

    const [next, ...rest] = celebrationQueue;
    setCelebrationQueue(rest);

    // Small delay before showing next celebration - track the timeout
    const timeoutId = setTimeout(() => {
      // Remove this timeout from tracking
      timeoutIdsRef.current = timeoutIdsRef.current.filter(id => id !== timeoutId);
      
      switch (next.type) {
        case 'achievement':
          setCurrentAchievement(next.data);
          setAchievementVisible(true);
          break;
        case 'streak':
          setCurrentStreak(next.data);
          setStreakVisible(true);
          break;
        case 'goal':
          setCurrentGoal(next.data);
          setGoalVisible(true);
          break;
      }
    }, 500);
    
    // Track this timeout for cleanup
    timeoutIdsRef.current.push(timeoutId);
  }, [celebrationQueue]);

  /**
   * Dismiss achievement celebration
   */
  const dismissAchievement = useCallback(() => {
    setAchievementVisible(false);
    setCurrentAchievement(null);
    processQueue();
  }, [processQueue]);

  /**
   * Dismiss streak celebration
   */
  const dismissStreak = useCallback(() => {
    setStreakVisible(false);
    setCurrentStreak(0);
    processQueue();
  }, [processQueue]);

  /**
   * Dismiss weekly goal celebration
   */
  const dismissGoal = useCallback(() => {
    setGoalVisible(false);
    setCurrentGoal(0);
    processQueue();
  }, [processQueue]);

  /**
   * Check and celebrate multiple achievements at once
   */
  const celebrateNewAchievements = useCallback((achievements) => {
    if (!achievements || achievements.length === 0) return;

    achievements.forEach((achievement, index) => {
      // Stagger celebrations - track the timeout for cleanup
      const timeoutId = setTimeout(() => {
        // Remove this timeout from tracking
        timeoutIdsRef.current = timeoutIdsRef.current.filter(id => id !== timeoutId);
        celebrateAchievement(achievement);
      }, index * 3500); // 3.5 seconds between each
      
      // Track this timeout for cleanup
      timeoutIdsRef.current.push(timeoutId);
    });
  }, [celebrateAchievement]);

  const value = {
    celebrateAchievement,
    celebrateStreak,
    celebrateWeeklyGoal,
    celebrateNewAchievements,
  };

  return (
    <CelebrationContext.Provider value={value}>
      {children}

      {/* Achievement Celebration Modal */}
      <AchievementCelebration
        visible={achievementVisible}
        achievement={currentAchievement}
        onDismiss={dismissAchievement}
      />

      {/* Streak Celebration Modal */}
      <StreakCelebration
        visible={streakVisible}
        streakCount={currentStreak}
        onDismiss={dismissStreak}
      />

      {/* Weekly Goal Celebration Modal */}
      <WeeklyGoalCelebration
        visible={goalVisible}
        goal={currentGoal}
        onDismiss={dismissGoal}
      />
    </CelebrationContext.Provider>
  );
}

export function useCelebration() {
  const context = useContext(CelebrationContext);
  if (!context) {
    throw new Error('useCelebration must be used within a CelebrationProvider');
  }
  return context;
}

export default CelebrationContext;
