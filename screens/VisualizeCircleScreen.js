import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function VisualizeCircleScreen({ navigation, route }) {
  const selectedContacts = route?.params?.contacts || [];

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const ringFloatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const buttonGlowAnim = useRef(new Animated.Value(0)).current;

  // Star positions for background
  const starPositions = useRef(
    [...Array(40)].map(() => ({
      x: Math.random() * SCREEN_WIDTH,
      y: Math.random() * 600,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.5 + 0.3,
    }))
  ).current;

  useEffect(() => {
    // Ring fade in and float animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(ringFloatAnim, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(ringFloatAnim, {
            toValue: 0,
            duration: 3000,
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();

    // Pulse animation for concentric circles
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Button glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(buttonGlowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(buttonGlowAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleVisualize = () => {
    navigation.navigate('Home', { contacts: selectedContacts });
  };

  const floatTranslateY = ringFloatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  const buttonGlowOpacity = buttonGlowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.8],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#000000', '#0a0f0a', '#000000']}
        style={styles.gradient}
      >
        {/* Star background */}
        <View style={styles.stars}>
          {starPositions.map((star, i) => (
            <View
              key={i}
              style={[
                styles.star,
                {
                  left: star.x,
                  top: star.y,
                  width: star.size,
                  height: star.size,
                  opacity: star.opacity,
                },
              ]}
            />
          ))}
        </View>

        {/* Main content */}
        <View style={styles.content}>
          {/* 3D Ring visualization */}
          <Animated.View
            style={[
              styles.ringContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: floatTranslateY }],
              },
            ]}
          >
            {/* 3D Smart Ring - Black glossy ring */}
            <View style={styles.smartRing}>
              {/* Ring outer edge - top highlight */}
              <View style={styles.ringOuterEdge} />

              {/* Ring band - the actual black ring material */}
              <LinearGradient
                colors={['#1a1a1a', '#000000', '#0a0a0a', '#1a1a1a']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.ringBand}
              >
                {/* Inner ring opening with depth */}
                <View style={styles.ringOpening}>
                  {/* Inner shadow for depth */}
                  <View style={styles.ringInnerShadow} />

                  {/* Floating concentric circles inside the ring */}
                  <View style={styles.concentricContainer}>
                    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                      {/* Glow base for circles */}
                      <View style={styles.circleGlowBase} />

                      <Svg height="160" width="160" viewBox="0 0 160 160">
                        {/* Multiple glowing concentric circles */}
                        <Circle cx="80" cy="80" r="15" stroke="#4FFFB0" strokeWidth="2" fill="none" opacity="1" />
                        <Circle cx="80" cy="80" r="15" stroke="#4FFFB0" strokeWidth="4" fill="none" opacity="0.3" blur="4" />

                        <Circle cx="80" cy="80" r="30" stroke="#4FFFB0" strokeWidth="1.5" fill="none" opacity="0.8" />
                        <Circle cx="80" cy="80" r="30" stroke="#4FFFB0" strokeWidth="3" fill="none" opacity="0.2" blur="3" />

                        <Circle cx="80" cy="80" r="45" stroke="#4FFFB0" strokeWidth="1" fill="none" opacity="0.6" />
                        <Circle cx="80" cy="80" r="45" stroke="#4FFFB0" strokeWidth="2" fill="none" opacity="0.15" blur="2" />

                        <Circle cx="80" cy="80" r="60" stroke="#4FFFB0" strokeWidth="0.5" fill="none" opacity="0.4" />
                        <Circle cx="80" cy="80" r="60" stroke="#4FFFB0" strokeWidth="1.5" fill="none" opacity="0.1" blur="1" />

                        {/* Center point glow */}
                        <Circle cx="80" cy="80" r="3" fill="#4FFFB0" opacity="1" />
                        <Circle cx="80" cy="80" r="6" fill="#4FFFB0" opacity="0.5" />
                        <Circle cx="80" cy="80" r="10" fill="#4FFFB0" opacity="0.2" />
                      </Svg>
                    </Animated.View>
                  </View>
                </View>
              </LinearGradient>

              {/* Ring inner edge - bottom shadow */}
              <View style={styles.ringInnerEdge} />
            </View>
          </Animated.View>

          {/* Text content */}
          <Animated.View style={[styles.textContainer, { opacity: fadeAnim }]}>
            <Text style={styles.titleText}>Perfect.</Text>
            <Text style={styles.subtitleText}>
              Now it's time to visualize your network.
            </Text>
            <Text style={styles.captionText}>
              Your connections are shaping your universe...
            </Text>
          </Animated.View>

          {/* CTA Button */}
          <Animated.View style={[styles.buttonContainer, { opacity: fadeAnim }]}>
            <Animated.View
              style={[
                styles.buttonGlow,
                { opacity: buttonGlowOpacity },
              ]}
            />
            <TouchableOpacity
              style={styles.button}
              onPress={handleVisualize}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>visualize my circle</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
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
  stars: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  star: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    borderRadius: 50,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 80,
  },
  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  smartRing: {
    width: 280,
    height: 280,
    borderRadius: 140,
    alignItems: 'center',
    justifyContent: 'center',
    // Deep shadow for levitation effect
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.9,
    shadowRadius: 30,
    elevation: 20,
  },
  ringOuterEdge: {
    position: 'absolute',
    top: 0,
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 3,
    borderColor: '#2a2a2a',
    opacity: 0.6,
  },
  ringBand: {
    width: 280,
    height: 280,
    borderRadius: 140,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0a0a0a',
    // Glossy black material
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
  },
  ringOpening: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    backgroundColor: 'transparent',
  },
  ringInnerShadow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 8,
    borderColor: '#000000',
    opacity: 0.5,
  },
  ringInnerEdge: {
    position: 'absolute',
    bottom: 0,
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 2,
    borderColor: '#000000',
    opacity: 0.8,
  },
  concentricContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 160,
    height: 160,
  },
  circleGlowBase: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#4FFFB0',
    opacity: 0.15,
    shadowColor: '#4FFFB0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  titleText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: 28,
  },
  captionText: {
    fontSize: 16,
    fontWeight: '300',
    fontStyle: 'italic',
    color: '#4FFFB0',
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 40,
    position: 'relative',
  },
  buttonGlow: {
    position: 'absolute',
    width: '100%',
    maxWidth: 280,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4FFFB0',
    shadowColor: '#4FFFB0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
  },
  button: {
    width: '100%',
    maxWidth: 280,
    paddingVertical: 16,
    borderRadius: 28,
    backgroundColor: '#4FFFB0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4FFFB0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    textTransform: 'lowercase',
    letterSpacing: 0.5,
  },
});
