import React, { useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function WelcomeIntroScreen({ navigation }) {
  const ring1Opacity = useRef(new Animated.Value(0.1)).current;
  const ring2Opacity = useRef(new Animated.Value(0.05)).current;
  const ring3Opacity = useRef(new Animated.Value(0.03)).current;
  const ring1Scale = useRef(new Animated.Value(1)).current;
  const ring2Scale = useRef(new Animated.Value(1)).current;
  const ring3Scale = useRef(new Animated.Value(1)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const starAnimations = useRef([...Array(30)].map(() => new Animated.Value(0))).current;
  const ringPulseAnimations = useRef([]).current;

  // Fixed star positions
  const starPositions = useRef(
    [...Array(30)].map(() => ({
      x: Math.random() * SCREEN_WIDTH,
      y: Math.random() * SCREEN_HEIGHT,
      delay: Math.random() * 2000,
    }))
  ).current;

  useEffect(() => {
    // Fade in card on mount
    Animated.timing(cardOpacity, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Animate stars twinkling
    const animations = starAnimations.map((anim, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(starPositions[index].delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      )
    );

    animations.forEach(anim => anim.start());

    // Gentle continuous pulsing of the rings while the card is visible
    const pulseAnimations = [
      Animated.loop(
        Animated.sequence([
          Animated.timing(ring1Scale, {
            toValue: 1.05,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(ring1Scale, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(ring2Scale, {
            toValue: 1.06,
            duration: 2200,
            useNativeDriver: true,
          }),
          Animated.timing(ring2Scale, {
            toValue: 1,
            duration: 2200,
            useNativeDriver: true,
          }),
        ])
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(ring3Scale, {
            toValue: 1.07,
            duration: 2400,
            useNativeDriver: true,
          }),
          Animated.timing(ring3Scale, {
            toValue: 1,
            duration: 2400,
            useNativeDriver: true,
          }),
        ])
      ),
    ];

    pulseAnimations.forEach(anim => anim.start());
    ringPulseAnimations.push(...pulseAnimations);

    return () => {
      animations.forEach(anim => anim.stop());
      pulseAnimations.forEach(anim => anim.stop());
    };
  }, []);

  const handleBegin = () => {
    // Stop the gentle loop so the stronger pulse can take over cleanly
    ringPulseAnimations.forEach(anim => anim.stop());

    // Fade out card and pulse circles
    Animated.parallel([
      // Fade out card
      Animated.timing(cardOpacity, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      // Pulse and glow rings
      Animated.timing(ring1Opacity, {
        toValue: 0.4,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(ring2Opacity, {
        toValue: 0.3,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(ring3Opacity, {
        toValue: 0.25,
        duration: 600,
        useNativeDriver: true,
      }),
      // Scale rings for pulse effect
      Animated.timing(ring1Scale, {
        toValue: 1.1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(ring2Scale, {
        toValue: 1.1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(ring3Scale, {
        toValue: 1.1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Briefly show glowing circles alone before the next card appears
      setTimeout(() => {
        navigation.navigate('CirclesExplainer');
      }, 300);
    });
  };

  return (
    <View style={styles.container}>
      {/* Background with stars and iridescent gradient */}
      <LinearGradient
        colors={['#000000', '#0a2e1a', '#000000']}
        style={styles.background}
      >
        {starPositions.map((star, index) => (
          <Animated.View
            key={index}
            style={[
              styles.star,
              {
                left: star.x,
                top: star.y,
                opacity: starAnimations[index],
              },
            ]}
          />
        ))}
      </LinearGradient>

      {/* Concentric circles */}
      <View style={styles.circlesContainer}>
        <Animated.View style={[styles.ring, styles.ring1, { opacity: ring1Opacity, transform: [{ scale: ring1Scale }] }]} />
        <Animated.View style={[styles.ring, styles.ring2, { opacity: ring2Opacity, transform: [{ scale: ring2Scale }] }]} />
        <Animated.View style={[styles.ring, styles.ring3, { opacity: ring3Opacity, transform: [{ scale: ring3Scale }] }]} />
        <View style={styles.centerGlow} />
      </View>

      {/* Content card */}
      <Animated.View style={[styles.contentCard, { opacity: cardOpacity }]}>
        <Text style={styles.title}>Welcome to your{'\n'}connection universe.</Text>
        <Text style={styles.description}>
          Every person you've met forms an orbit around you. Ready to see your relationships in a whole new way?
        </Text>
        <TouchableOpacity style={styles.button} onPress={handleBegin}>
          <Text style={styles.buttonText}>Let's Begin →</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  background: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#000000',
  },
  star: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#ffffff',
  },
  circlesContainer: {
    position: 'absolute',
    width: SCREEN_WIDTH * 1.5,
    height: SCREEN_WIDTH * 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: '#4FFFB0',
    borderRadius: 1000,
  },
  ring1: {
    width: SCREEN_WIDTH * 0.6,
    height: SCREEN_WIDTH * 0.6,
  },
  ring2: {
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_WIDTH * 0.9,
  },
  ring3: {
    width: SCREEN_WIDTH * 1.2,
    height: SCREEN_WIDTH * 1.2,
  },
  centerGlow: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4FFFB0',
    opacity: 0.15,
  },
  contentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 32,
    marginHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 34,
  },
  description: {
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#4FFFB0',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#000000',
    fontSize: 18,
    fontWeight: '700',
  },
});
