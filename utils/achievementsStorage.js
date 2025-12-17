import { supabase } from '../lib/supabase';

/**
 * Achievement definitions with requirements
 */
export const ACHIEVEMENTS = {
  // Network Building
  first_contact: {
    id: 'first_contact',
    name: 'First Contact',
    description: 'Add your first contact',
    emoji: '👋',
    category: 'network',
    requirement: { type: 'contacts_added', count: 1 },
    points: 10,
  },
  network_starter: {
    id: 'network_starter',
    name: 'Network Starter',
    description: 'Add 10 contacts to your network',
    emoji: '🌱',
    category: 'network',
    requirement: { type: 'contacts_added', count: 10 },
    points: 25,
  },
  network_builder: {
    id: 'network_builder',
    name: 'Network Builder',
    description: 'Add 50 contacts to your network',
    emoji: '🏗️',
    category: 'network',
    requirement: { type: 'contacts_added', count: 50 },
    points: 50,
  },
  network_master: {
    id: 'network_master',
    name: 'Network Master',
    description: 'Add 100 contacts to your network',
    emoji: '🌐',
    category: 'network',
    requirement: { type: 'contacts_added', count: 100 },
    points: 100,
  },

  // Circle Organization
  circle_creator: {
    id: 'circle_creator',
    name: 'Circle Creator',
    description: 'Create your first circle',
    emoji: '⭕',
    category: 'organization',
    requirement: { type: 'circles_created', count: 1 },
    points: 15,
  },
  circle_organizer: {
    id: 'circle_organizer',
    name: 'Circle Organizer',
    description: 'Create 3 circles',
    emoji: '🎯',
    category: 'organization',
    requirement: { type: 'circles_created', count: 3 },
    points: 30,
  },
  circle_master: {
    id: 'circle_master',
    name: 'Circle Master',
    description: 'Create all 5 circles',
    emoji: '🎪',
    category: 'organization',
    requirement: { type: 'circles_created', count: 5 },
    points: 50,
  },

  // Streaks
  streak_starter: {
    id: 'streak_starter',
    name: 'Streak Starter',
    description: 'Achieve a 3-day streak',
    emoji: '🔥',
    category: 'streak',
    requirement: { type: 'streak_days', count: 3 },
    points: 20,
  },
  week_warrior: {
    id: 'week_warrior',
    name: 'Week Warrior',
    description: 'Achieve a 7-day streak',
    emoji: '⚡',
    category: 'streak',
    requirement: { type: 'streak_days', count: 7 },
    points: 40,
  },
  fortnight_fighter: {
    id: 'fortnight_fighter',
    name: 'Fortnight Fighter',
    description: 'Achieve a 14-day streak',
    emoji: '💪',
    category: 'streak',
    requirement: { type: 'streak_days', count: 14 },
    points: 60,
  },
  streak_legend: {
    id: 'streak_legend',
    name: 'Streak Legend',
    description: 'Achieve a 30-day streak',
    emoji: '🏆',
    category: 'streak',
    requirement: { type: 'streak_days', count: 30 },
    points: 100,
  },
  streak_master: {
    id: 'streak_master',
    name: 'Streak Master',
    description: 'Achieve a 100-day streak',
    emoji: '👑',
    category: 'streak',
    requirement: { type: 'streak_days', count: 100 },
    points: 200,
  },

  // Engagement
  first_message: {
    id: 'first_message',
    name: 'First Reach Out',
    description: 'Send your first message to a contact',
    emoji: '💬',
    category: 'engagement',
    requirement: { type: 'messages_sent', count: 1 },
    points: 10,
  },
  social_butterfly: {
    id: 'social_butterfly',
    name: 'Social Butterfly',
    description: 'Reach out to 10 contacts in a week',
    emoji: '🦋',
    category: 'engagement',
    requirement: { type: 'weekly_contacts', count: 10 },
    points: 50,
  },
  connector: {
    id: 'connector',
    name: 'Connector',
    description: 'Reach out to 50 contacts total',
    emoji: '🔗',
    category: 'engagement',
    requirement: { type: 'messages_sent', count: 50 },
    points: 75,
  },

  // Health
  health_guardian: {
    id: 'health_guardian',
    name: 'Health Guardian',
    description: 'Keep all inner circle contacts healthy for 7 days',
    emoji: '💚',
    category: 'health',
    requirement: { type: 'healthy_inner_circle_days', count: 7 },
    points: 60,
  },
  relationship_master: {
    id: 'relationship_master',
    name: 'Relationship Master',
    description: 'Keep all contacts healthy for 14 days',
    emoji: '🌟',
    category: 'health',
    requirement: { type: 'all_healthy_days', count: 14 },
    points: 100,
  },
  comeback_king: {
    id: 'comeback_king',
    name: 'Comeback King',
    description: 'Restore 5 cold relationships to healthy',
    emoji: '🔄',
    category: 'health',
    requirement: { type: 'relationships_restored', count: 5 },
    points: 50,
  },

  // Profile Completion
  detail_oriented: {
    id: 'detail_oriented',
    name: 'Detail Oriented',
    description: 'Add notes to 10 contacts',
    emoji: '📝',
    category: 'profile',
    requirement: { type: 'contacts_with_notes', count: 10 },
    points: 30,
  },
  memory_keeper: {
    id: 'memory_keeper',
    name: 'Memory Keeper',
    description: 'Add "how we met" to 10 contacts',
    emoji: '🎞️',
    category: 'profile',
    requirement: { type: 'contacts_with_how_met', count: 10 },
    points: 30,
  },
  tag_master: {
    id: 'tag_master',
    name: 'Tag Master',
    description: 'Use 5 different tags',
    emoji: '🏷️',
    category: 'profile',
    requirement: { type: 'unique_tags', count: 5 },
    points: 25,
  },

  // Reminders
  reminder_set: {
    id: 'reminder_set',
    name: 'Never Forget',
    description: 'Set your first reminder',
    emoji: '⏰',
    category: 'reminders',
    requirement: { type: 'reminders_created', count: 1 },
    points: 10,
  },
  birthday_tracker: {
    id: 'birthday_tracker',
    name: 'Birthday Tracker',
    description: 'Add birthdays for 5 contacts',
    emoji: '🎂',
    category: 'reminders',
    requirement: { type: 'birthdays_added', count: 5 },
    points: 25,
  },
  reminder_master: {
    id: 'reminder_master',
    name: 'Reminder Master',
    description: 'Complete 10 reminders',
    emoji: '✅',
    category: 'reminders',
    requirement: { type: 'reminders_completed', count: 10 },
    points: 40,
  },

  // Weekly Goals
  goal_getter: {
    id: 'goal_getter',
    name: 'Goal Getter',
    description: 'Complete your weekly goal',
    emoji: '🎯',
    category: 'goals',
    requirement: { type: 'weekly_goals_completed', count: 1 },
    points: 25,
  },
  consistent_achiever: {
    id: 'consistent_achiever',
    name: 'Consistent Achiever',
    description: 'Complete weekly goals 4 weeks in a row',
    emoji: '📈',
    category: 'goals',
    requirement: { type: 'consecutive_weekly_goals', count: 4 },
    points: 75,
  },
};

/**
 * Get all achievements with user progress
 * @param {string} userId - The user ID
 * @returns {object} - { success, achievements, error }
 */
export async function getAchievements(userId) {
  try {
    if (!userId) {
      return { success: false, error: 'No user ID provided' };
    }

    // Get user's unlocked achievements
    const { data: unlocked, error } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('[achievementsStorage] Error fetching achievements:', error);
      return { success: false, error: error.message };
    }

    const unlockedMap = (unlocked || []).reduce((acc, a) => {
      acc[a.achievement_id] = a;
      return acc;
    }, {});

    // Get user stats for progress calculation
    const stats = await getUserStats(userId);

    // Build achievements list with progress
    const achievements = Object.values(ACHIEVEMENTS).map((achievement) => {
      const isUnlocked = !!unlockedMap[achievement.id];
      const progress = calculateProgress(achievement, stats);

      return {
        ...achievement,
        isUnlocked,
        unlockedAt: unlockedMap[achievement.id]?.unlocked_at || null,
        progress: isUnlocked ? 100 : progress,
        currentValue: getCurrentValue(achievement, stats),
        targetValue: achievement.requirement.count,
      };
    });

    return { success: true, achievements };
  } catch (err) {
    console.error('[achievementsStorage] Exception:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Check and unlock achievements based on current stats
 * @param {string} userId - The user ID
 * @returns {object} - { success, newlyUnlocked, error }
 */
export async function checkAndUnlockAchievements(userId) {
  try {
    if (!userId) {
      return { success: false, error: 'No user ID provided' };
    }

    // Get user's current unlocked achievements
    const { data: unlocked, error: fetchError } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', userId);

    if (fetchError) {
      return { success: false, error: fetchError.message };
    }

    const unlockedIds = new Set((unlocked || []).map((a) => a.achievement_id));

    // Get user stats
    const stats = await getUserStats(userId);

    // Check each achievement
    const newlyUnlocked = [];
    for (const achievement of Object.values(ACHIEVEMENTS)) {
      if (unlockedIds.has(achievement.id)) continue;

      const progress = calculateProgress(achievement, stats);
      if (progress >= 100) {
        // Unlock achievement
        const { error: insertError } = await supabase
          .from('user_achievements')
          .insert({
            user_id: userId,
            achievement_id: achievement.id,
            unlocked_at: new Date().toISOString(),
          });

        if (!insertError) {
          newlyUnlocked.push(achievement);
        }
      }
    }

    return { success: true, newlyUnlocked };
  } catch (err) {
    console.error('[achievementsStorage] Exception:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Get user statistics for achievement calculation
 * @param {string} userId - The user ID
 * @returns {object} - Stats object
 */
async function getUserStats(userId) {
  const stats = {
    contactsAdded: 0,
    circlesCreated: 0,
    currentStreak: 0,
    longestStreak: 0,
    messagesSent: 0,
    remindersCreated: 0,
    remindersCompleted: 0,
    birthdaysAdded: 0,
    contactsWithNotes: 0,
    contactsWithHowMet: 0,
    uniqueTags: 0,
    weeklyGoalsCompleted: 0,
    relationshipsRestored: 0,
  };

  try {
    // Get contacts count
    const { count: contactsCount } = await supabase
      .from('imported_contacts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    stats.contactsAdded = contactsCount || 0;

    // Get circles count
    const { count: circlesCount } = await supabase
      .from('circles')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    stats.circlesCreated = circlesCount || 0;

    // Get streak data
    const { data: streakData } = await supabase
      .from('user_streaks')
      .select('current_streak, longest_streak')
      .eq('user_id', userId)
      .single();
    if (streakData) {
      stats.currentStreak = streakData.current_streak || 0;
      stats.longestStreak = streakData.longest_streak || 0;
    }

    // Get activity count (messages sent)
    const { count: activityCount } = await supabase
      .from('activity_log')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('activity_type', 'message_sent');
    stats.messagesSent = activityCount || 0;

    // Get reminders counts
    const { count: remindersCount } = await supabase
      .from('reminders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    stats.remindersCreated = remindersCount || 0;

    const { count: completedReminders } = await supabase
      .from('reminders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_completed', true);
    stats.remindersCompleted = completedReminders || 0;

    // Get birthdays count
    const { count: birthdaysCount } = await supabase
      .from('contact_dates')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('date_type', 'birthday');
    stats.birthdaysAdded = birthdaysCount || 0;

    // Get contacts with notes
    const { count: notesCount } = await supabase
      .from('imported_contacts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .not('notes', 'is', null)
      .neq('notes', '');
    stats.contactsWithNotes = notesCount || 0;

    // Get contacts with how_we_met
    const { count: howMetCount } = await supabase
      .from('imported_contacts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .not('how_we_met', 'is', null)
      .neq('how_we_met', '');
    stats.contactsWithHowMet = howMetCount || 0;

    // Get unique tags count
    const { data: tagsData } = await supabase
      .from('imported_contacts')
      .select('tags')
      .eq('user_id', userId)
      .not('tags', 'is', null);
    const allTags = new Set();
    (tagsData || []).forEach((c) => {
      if (c.tags && Array.isArray(c.tags)) {
        c.tags.forEach((t) => allTags.add(t));
      }
    });
    stats.uniqueTags = allTags.size;

    // Get weekly goals completed count from activity_log
    const { count: goalsCount } = await supabase
      .from('activity_log')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('activity_type', 'weekly_goal_completed');
    stats.weeklyGoalsCompleted = goalsCount || 0;

    // Get relationships restored count
    const { count: restoredCount } = await supabase
      .from('activity_log')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('activity_type', 'relationship_restored');
    stats.relationshipsRestored = restoredCount || 0;

  } catch (err) {
    console.error('[achievementsStorage] Error fetching stats:', err);
  }

  return stats;
}

/**
 * Calculate progress percentage for an achievement
 */
function calculateProgress(achievement, stats) {
  const currentValue = getCurrentValue(achievement, stats);
  const targetValue = achievement.requirement.count;
  return Math.min(100, Math.round((currentValue / targetValue) * 100));
}

/**
 * Get current value for an achievement requirement
 */
function getCurrentValue(achievement, stats) {
  const { type } = achievement.requirement;

  switch (type) {
    case 'contacts_added':
      return stats.contactsAdded;
    case 'circles_created':
      return stats.circlesCreated;
    case 'streak_days':
      return stats.longestStreak;
    case 'messages_sent':
      return stats.messagesSent;
    case 'reminders_created':
      return stats.remindersCreated;
    case 'reminders_completed':
      return stats.remindersCompleted;
    case 'birthdays_added':
      return stats.birthdaysAdded;
    case 'contacts_with_notes':
      return stats.contactsWithNotes;
    case 'contacts_with_how_met':
      return stats.contactsWithHowMet;
    case 'unique_tags':
      return stats.uniqueTags;
    case 'weekly_goals_completed':
    case 'consecutive_weekly_goals':
      return stats.weeklyGoalsCompleted;
    case 'relationships_restored':
      return stats.relationshipsRestored;
    default:
      return 0;
  }
}

/**
 * Get total points earned by user
 * @param {string} userId - The user ID
 * @returns {object} - { success, points, error }
 */
export async function getTotalPoints(userId) {
  try {
    if (!userId) {
      return { success: false, error: 'No user ID provided', points: 0 };
    }

    const { data: unlocked, error } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', userId);

    if (error) {
      return { success: false, error: error.message, points: 0 };
    }

    let totalPoints = 0;
    (unlocked || []).forEach((a) => {
      const achievement = ACHIEVEMENTS[a.achievement_id];
      if (achievement) {
        totalPoints += achievement.points;
      }
    });

    return { success: true, points: totalPoints };
  } catch (err) {
    console.error('[achievementsStorage] Exception:', err);
    return { success: false, error: err.message, points: 0 };
  }
}

/**
 * Get achievements by category
 */
export function getAchievementsByCategory(achievements) {
  return {
    network: achievements.filter((a) => a.category === 'network'),
    organization: achievements.filter((a) => a.category === 'organization'),
    streak: achievements.filter((a) => a.category === 'streak'),
    engagement: achievements.filter((a) => a.category === 'engagement'),
    health: achievements.filter((a) => a.category === 'health'),
    profile: achievements.filter((a) => a.category === 'profile'),
    reminders: achievements.filter((a) => a.category === 'reminders'),
    goals: achievements.filter((a) => a.category === 'goals'),
  };
}

/**
 * Get category display info
 */
export const ACHIEVEMENT_CATEGORIES = {
  network: { name: 'Network Building', emoji: '🌐' },
  organization: { name: 'Organization', emoji: '🎯' },
  streak: { name: 'Streaks', emoji: '🔥' },
  engagement: { name: 'Engagement', emoji: '💬' },
  health: { name: 'Relationship Health', emoji: '💚' },
  profile: { name: 'Profile Completion', emoji: '📝' },
  reminders: { name: 'Reminders', emoji: '⏰' },
  goals: { name: 'Goals', emoji: '🎯' },
};
