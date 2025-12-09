import React, { useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function BuildUniverseScreen({ navigation }) {
  const ring1Opacity = useRef(new Animated.Value(0.3)).current;
  const ring2Opacity = useRef(new Animated.Value(0.25)).current;
  const ring3Opacity = useRef(new Animated.Value(0.2)).current;
  const starAnimations = useRef([...Array(30)].map(() => new Animated.Value(0))).current;

  // Fixed star positions
  const starPositions = useRef(
    [...Array(30)].map(() => ({
      x: Math.random() * SCREEN_WIDTH,
      y: Math.random() * SCREEN_HEIGHT,
      delay: Math.random() * 2000,
    }))
  ).current;

  useEffect(() => {
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

    return () => animations.forEach(anim => anim.stop());
  }, []);

  const handleGetStarted = () => {
    navigation.navigate('ImportContacts');
  };

  return (
    <View style={styles.container}>
      {/* Background with stars */}
      <View style={styles.background}>
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
      </View>

      {/* Concentric circles - most visible */}
      <View style={styles.circlesContainer}>
        <Animated.View style={[styles.ring, styles.ring1, { opacity: ring1Opacity }]} />
        <Animated.View style={[styles.ring, styles.ring2, { opacity: ring2Opacity }]} />
        <Animated.View style={[styles.ring, styles.ring3, { opacity: ring3Opacity }]} />
        <View style={styles.centerGlow} />
      </View>

      {/* Content card */}
      <View style={styles.contentCard}>
        <Text style={styles.title}>Let's build your{'\n'}universe.</Text>
        <Text style={styles.description}>
          We'll import your contacts and help you visualize your entire network. A clearer, smarter way to stay connected starts now.
        </Text>
        <TouchableOpacity style={styles.button} onPress={handleGetStarted}>
          <Text style={styles.buttonText}>Let's Get Started</Text>
        </TouchableOpacity>
      </View>
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
    backgroundColor: '#0a0f1a',
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
    borderWidth: 2,
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
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#4FFFB0',
    opacity: 0.25,
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
