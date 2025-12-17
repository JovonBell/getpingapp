import { supabase } from '../lib/supabase';

/**
 * Get or create user's streak data
 * @param {string} userId - The user ID
 * @returns {object} - { success, streak, error }
 */
export async function getStreak(userId) {
  try {
    if (!userId) {
      return { success: false, error: 'No user ID provided' };
    }

    const { data, error } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // No streak record exists, create one
      return await createStreak(userId);
    }

    if (error) {
      // Check if table doesn't exist (42P01 is PostgreSQL error for relation does not exist)
      if (error.code === '42P01' || (error.message && error.message.includes('does not exist'))) {
        console.warn('[streaksStorage] user_streaks table does not exist. Please run the gamification migration.');
        return {
          success: false,
          error: 'Streaks feature not available. Please run database migrations.',
          streak: {
            currentStreak: 0,
            longestStreak: 0,
            lastActivityDate: null,
            totalDaysActive: 0,
            weeklyGoal: 5,
            weeklyProgress: 0,
            weekStartDate: null,
          },
        };
      }
      console.warn('[streaksStorage] Error fetching streak (this is expected if migrations have not run):', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      streak: {
        currentStreak: data.current_streak || 0,
        longestStreak: data.longest_streak || 0,
        lastActivityDate: data.last_activity_date,
        totalDaysActive: data.total_days_active || 0,
        weeklyGoal: data.weekly_goal || 5,
        weeklyProgress: data.weekly_progress || 0,
        weekStartDate: data.week_start_date,
      },
    };
  } catch (err) {
    console.error('[streaksStorage] Exception:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Create initial streak record for user
 * @param {string} userId - The user ID
 * @returns {object} - { success, streak, error }
 */
async function createStreak(userId) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const weekStart = getWeekStartDate();

    const { data, error } = await supabase
      .from('user_streaks')
      .insert({
        user_id: userId,
        current_streak: 0,
        longest_streak: 0,
        last_activity_date: null,
        total_days_active: 0,
        weekly_goal: 5,
        weekly_progress: 0,
        week_start_date: weekStart,
      })
      .select()
      .single();

    if (error) {
      // Check if table doesn't exist
      if (error.code === '42P01' || (error.message && error.message.includes('does not exist'))) {
        console.warn('[streaksStorage] user_streaks table does not exist. Please run the gamification migration.');
        return {
          success: false,
          error: 'Streaks feature not available. Please run database migrations.',
          streak: {
            currentStreak: 0,
            longestStreak: 0,
            lastActivityDate: null,
            totalDaysActive: 0,
            weeklyGoal: 5,
            weeklyProgress: 0,
            weekStartDate: getWeekStartDate(),
          },
        };
      }
      console.error('[streaksStorage] Error creating streak:', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      streak: {
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
        totalDaysActive: 0,
        weeklyGoal: 5,
        weeklyProgress: 0,
        weekStartDate: weekStart,
      },
    };
  } catch (err) {
    console.error('[streaksStorage] Exception:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Record a daily activity (reaching out to a contact)
 * @param {string} userId - The user ID
 * @returns {object} - { success, streak, isNewDay, error }
 */
export async function recordActivity(userId) {
  try {
    if (!userId) {
      return { success: false, error: 'No user ID provided' };
    }

    const today = new Date().toISOString().split('T')[0];
    const currentWeekStart = getWeekStartDate();

    // Get current streak data
    const { data: current, error: fetchError } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code === 'PGRST116') {
      // No record exists, create one with today's activity
      const { data, error } = await supabase
        .from('user_streaks')
        .insert({
          user_id: userId,
          current_streak: 1,
          longest_streak: 1,
          last_activity_date: today,
          total_days_active: 1,
          weekly_goal: 5,
          weekly_progress: 1,
          week_start_date: currentWeekStart,
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        isNewDay: true,
        streak: {
          currentStreak: 1,
          longestStreak: 1,
          lastActivityDate: today,
          totalDaysActive: 1,
          weeklyGoal: 5,
          weeklyProgress: 1,
          weekStartDate: currentWeekStart,
        },
      };
    }

    if (fetchError) {
      return { success: false, error: fetchError.message };
    }

    const lastActivityDate = current.last_activity_date;
    let newCurrentStreak = current.current_streak || 0;
    let newLongestStreak = current.longest_streak || 0;
    let newTotalDays = current.total_days_active || 0;
    let newWeeklyProgress = current.weekly_progress || 0;
    let isNewDay = false;

    // Check if this is a new day
    if (lastActivityDate !== today) {
      isNewDay = true;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastActivityDate === yesterdayStr) {
        // Continuing streak
        newCurrentStreak += 1;
      } else if (!lastActivityDate) {
        // First ever activity
        newCurrentStreak = 1;
      } else {
        // Streak broken, start fresh
        newCurrentStreak = 1;
      }

      // Update longest streak if needed
      if (newCurrentStreak > newLongestStreak) {
        newLongestStreak = newCurrentStreak;
      }

      // Increment total days active
      newTotalDays += 1;

      // Check if we need to reset weekly progress (new week)
      const storedWeekStart = current.week_start_date;
      if (storedWeekStart !== currentWeekStart) {
        newWeeklyProgress = 1;
      } else {
        newWeeklyProgress += 1;
      }
    }

    // Update the streak record
    const { data, error: updateError } = await supabase
      .from('user_streaks')
      .update({
        current_streak: newCurrentStreak,
        longest_streak: newLongestStreak,
        last_activity_date: today,
        total_days_active: newTotalDays,
        weekly_progress: newWeeklyProgress,
        week_start_date: currentWeekStart,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return {
      success: true,
      isNewDay,
      streak: {
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
        lastActivityDate: today,
        totalDaysActive: newTotalDays,
        weeklyGoal: current.weekly_goal || 5,
        weeklyProgress: newWeeklyProgress,
        weekStartDate: currentWeekStart,
      },
    };
  } catch (err) {
    console.error('[streaksStorage] Exception:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Update weekly goal
 * @param {string} userId - The user ID
 * @param {number} goal - New weekly goal (1-7)
 * @returns {object} - { success, error }
 */
export async function updateWeeklyGoal(userId, goal) {
  try {
    if (!userId) {
      return { success: false, error: 'No user ID provided' };
    }

    const clampedGoal = Math.max(1, Math.min(7, goal));

    const { error } = await supabase
      .from('user_streaks')
      .update({
        weekly_goal: clampedGoal,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('[streaksStorage] Exception:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Check if streak is still active (not broken)
 * @param {string} lastActivityDate - Last activity date string
 * @returns {boolean}
 */
export function isStreakActive(lastActivityDate) {
  if (!lastActivityDate) return false;

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  return lastActivityDate === today || lastActivityDate === yesterdayStr;
}

/**
 * Get the start of the current week (Monday)
 * @returns {string} - Date string YYYY-MM-DD
 */
function getWeekStartDate() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split('T')[0];
}

/**
 * Get streak status and message
 * @param {object} streak - Streak data
 * @returns {object} - { status, message, emoji }
 */
export function getStreakStatus(streak) {
  if (!streak) {
    return { status: 'none', message: 'Start your streak today!', emoji: '🌱' };
  }

  const { currentStreak, lastActivityDate } = streak;
  const today = new Date().toISOString().split('T')[0];

  if (lastActivityDate === today) {
    // Already active today
    if (currentStreak >= 30) {
      return { status: 'legendary', message: `${currentStreak} day streak! Legendary!`, emoji: '👑' };
    } else if (currentStreak >= 14) {
      return { status: 'amazing', message: `${currentStreak} day streak! Amazing!`, emoji: '🔥' };
    } else if (currentStreak >= 7) {
      return { status: 'great', message: `${currentStreak} day streak! Keep it up!`, emoji: '⭐' };
    } else if (currentStreak >= 3) {
      return { status: 'good', message: `${currentStreak} day streak! Nice work!`, emoji: '✨' };
    } else {
      return { status: 'started', message: `${currentStreak} day streak started!`, emoji: '🌟' };
    }
  }

  // Check if streak is at risk (needs activity today)
  if (isStreakActive(lastActivityDate)) {
    return {
      status: 'at_risk',
      message: `${currentStreak} day streak - reach out today to keep it!`,
      emoji: '⚠️',
    };
  }

  // Streak broken
  return {
    status: 'broken',
    message: 'Streak ended. Start a new one today!',
    emoji: '💔',
  };
}

/**
 * Get weekly progress status
 * @param {object} streak - Streak data
 * @returns {object} - { progress, goal, percentage, message }
 */
export function getWeeklyProgress(streak) {
  if (!streak) {
    return { progress: 0, goal: 5, percentage: 0, message: 'Set your weekly goal!' };
  }

  const { weeklyProgress, weeklyGoal } = streak;
  const percentage = Math.min(100, Math.round((weeklyProgress / weeklyGoal) * 100));

  if (weeklyProgress >= weeklyGoal) {
    return {
      progress: weeklyProgress,
      goal: weeklyGoal,
      percentage: 100,
      message: 'Weekly goal achieved! Great job!',
    };
  }

  const remaining = weeklyGoal - weeklyProgress;
  return {
    progress: weeklyProgress,
    goal: weeklyGoal,
    percentage,
    message: `${remaining} more ${remaining === 1 ? 'day' : 'days'} to reach your goal`,
  };
}
