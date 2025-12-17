import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Confetti, { ConfettiBurst, Sparkles } from './Confetti';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Achievement unlocked celebration modal
 */
export function AchievementCelebration({ visible, achievement, onDismiss }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const emojiScale = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset animations
      scaleAnim.setValue(0);
      emojiScale.setValue(0);
      opacityAnim.setValue(0);

      // Sequence: fade in bg, scale card, bounce emoji
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(emojiScale, {
          toValue: 1,
          friction: 4,
          tension: 50,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!achievement) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onDismiss}
    >
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        <ConfettiBurst active={visible} />

        <Animated.View
          style={[
            styles.celebrationCard,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <LinearGradient
            colors={['#1a1a2e', '#0f0f1a']}
            style={styles.cardGradient}
          >
            {/* Glow effect */}
            <View style={styles.glowCircle} />

            {/* Header */}
            <Text style={styles.unlockText}>ACHIEVEMENT UNLOCKED</Text>

            {/* Emoji */}
            <Animated.Text
              style={[
                styles.emoji,
                { transform: [{ scale: emojiScale }] },
              ]}
            >
              {achievement.emoji}
            </Animated.Text>

            {/* Name & Description */}
            <Text style={styles.achievementName}>{achievement.name}</Text>
            <Text style={styles.achievementDescription}>
              {achievement.description}
            </Text>

            {/* Points */}
            <View style={styles.pointsBadge}>
              <Text style={styles.pointsText}>+{achievement.points} points</Text>
            </View>

            {/* Dismiss Button */}
            <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
              <Text style={styles.dismissText}>Awesome!</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

/**
 * Streak milestone celebration modal
 */
export function StreakCelebration({ visible, streakCount, onDismiss }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fireScale = useRef(new Animated.Value(0)).current;
  const numberAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0);
      fireScale.setValue(0);
      numberAnim.setValue(0);

      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.spring(fireScale, {
            toValue: 1,
            friction: 4,
            tension: 50,
            useNativeDriver: true,
          }),
          Animated.timing(numberAnim, {
            toValue: streakCount,
            duration: 1000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: false,
          }),
        ]),
      ]).start();
    }
  }, [visible, streakCount]);

  const getMilestoneContent = () => {
    if (streakCount >= 100) {
      return { title: 'LEGENDARY!', subtitle: '100 Day Streak', color: '#FFD700' };
    } else if (streakCount >= 50) {
      return { title: 'INCREDIBLE!', subtitle: '50 Day Streak', color: '#A855F7' };
    } else if (streakCount >= 30) {
      return { title: 'AMAZING!', subtitle: '30 Day Streak', color: '#FF6B6B' };
    } else if (streakCount >= 14) {
      return { title: 'FANTASTIC!', subtitle: '2 Week Streak', color: '#FF8C42' };
    } else if (streakCount >= 7) {
      return { title: 'GREAT JOB!', subtitle: '1 Week Streak', color: '#4FFFB0' };
    }
    return { title: 'NICE!', subtitle: 'Streak Milestone', color: '#4FFFB0' };
  };

  const content = getMilestoneContent();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <Confetti active={visible} />

        <Animated.View
          style={[
            styles.streakCard,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <LinearGradient
            colors={[content.color + '40', '#0a0a15']}
            style={styles.streakGradient}
          >
            {/* Fire emoji */}
            <Animated.Text
              style={[
                styles.fireEmoji,
                { transform: [{ scale: fireScale }] },
              ]}
            >
              🔥
            </Animated.Text>

            {/* Title */}
            <Text style={[styles.milestoneTitle, { color: content.color }]}>
              {content.title}
            </Text>

            {/* Streak count */}
            <View style={styles.streakNumberContainer}>
              <Text style={styles.streakNumber}>{streakCount}</Text>
              <Text style={styles.streakLabel}>DAY STREAK</Text>
            </View>

            {/* Subtitle */}
            <Text style={styles.milestoneSubtitle}>{content.subtitle}</Text>

            {/* Motivational text */}
            <Text style={styles.motivationalText}>
              {streakCount >= 30
                ? "You're a relationship master! Keep nurturing those connections."
                : streakCount >= 14
                ? "Two weeks of consistency! Your network is thriving."
                : "Great momentum! Keep reaching out to your contacts."}
            </Text>

            {/* Dismiss */}
            <TouchableOpacity
              style={[styles.streakDismissButton, { backgroundColor: content.color }]}
              onPress={onDismiss}
            >
              <Text style={styles.streakDismissText}>Keep Going!</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

/**
 * Weekly goal completed celebration
 */
export function WeeklyGoalCelebration({ visible, goal, onDismiss }) {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      scaleAnim.setValue(0);
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <Sparkles active={visible} />

        <Animated.View
          style={[
            styles.goalCard,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <Text style={styles.goalEmoji}>🎯</Text>
          <Text style={styles.goalTitle}>Weekly Goal Complete!</Text>
          <Text style={styles.goalSubtitle}>
            You reached out to contacts {goal} days this week
          </Text>
          <TouchableOpacity style={styles.goalDismissButton} onPress={onDismiss}>
            <Text style={styles.goalDismissText}>Great!</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

/**
 * First contact added celebration
 */
export function FirstContactCelebration({ visible, onDismiss }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <ConfettiBurst active={visible} />

        <View style={styles.firstContactCard}>
          <Text style={styles.firstContactEmoji}>🌟</Text>
          <Text style={styles.firstContactTitle}>Your Network Begins!</Text>
          <Text style={styles.firstContactSubtitle}>
            You've added your first contact. Keep building meaningful connections!
          </Text>
          <TouchableOpacity style={styles.firstContactButton} onPress={onDismiss}>
            <Text style={styles.firstContactButtonText}>Let's Go!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  // Achievement celebration styles
  celebrationCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#4FFFB0',
  },
  cardGradient: {
    padding: 32,
    alignItems: 'center',
  },
  glowCircle: {
    position: 'absolute',
    top: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#4FFFB0',
    opacity: 0.1,
  },
  unlockText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4FFFB0',
    letterSpacing: 2,
    marginBottom: 20,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  achievementName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  achievementDescription: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 20,
  },
  pointsBadge: {
    backgroundColor: 'rgba(255, 215, 61, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
  },
  pointsText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFD93D',
  },
  dismissButton: {
    backgroundColor: '#4FFFB0',
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 25,
  },
  dismissText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },

  // Streak celebration styles
  streakCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 24,
    overflow: 'hidden',
  },
  streakGradient: {
    padding: 32,
    alignItems: 'center',
  },
  fireEmoji: {
    fontSize: 72,
    marginBottom: 8,
  },
  milestoneTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 16,
  },
  streakNumberContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  streakNumber: {
    fontSize: 72,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 80,
  },
  streakLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 2,
  },
  milestoneSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  motivationalText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  streakDismissButton: {
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 25,
  },
  streakDismissText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },

  // Weekly goal styles
  goalCard: {
    backgroundColor: '#1a1a2e',
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD93D',
  },
  goalEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  goalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  goalSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 24,
  },
  goalDismissButton: {
    backgroundColor: '#FFD93D',
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 25,
  },
  goalDismissText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },

  // First contact styles
  firstContactCard: {
    backgroundColor: '#1a1a2e',
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4FFFB0',
    maxWidth: 320,
  },
  firstContactEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  firstContactTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  firstContactSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 24,
  },
  firstContactButton: {
    backgroundColor: '#4FFFB0',
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 25,
  },
  firstContactButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
});
