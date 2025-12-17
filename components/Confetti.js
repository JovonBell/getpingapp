import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Dimensions, Easing } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CONFETTI_COLORS = [
  '#4FFFB0', // Brand green
  '#FFD93D', // Gold
  '#FF6B6B', // Red
  '#4F9FFF', // Blue
  '#FF6B9D', // Pink
  '#A855F7', // Purple
  '#FF8C42', // Orange
];

const CONFETTI_COUNT = 50;

/**
 * Individual confetti piece
 */
function ConfettiPiece({ delay, color, startX }) {
  const translateY = useRef(new Animated.Value(-50)).current;
  const translateX = useRef(new Animated.Value(startX)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const duration = 3000 + Math.random() * 2000;
    const horizontalMovement = (Math.random() - 0.5) * 200;

    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        // Fall down
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT + 100,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        // Sway horizontally
        Animated.timing(translateX, {
          toValue: startX + horizontalMovement,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        // Rotate
        Animated.timing(rotate, {
          toValue: Math.random() * 10,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        // Fade out near bottom
        Animated.sequence([
          Animated.delay(duration * 0.7),
          Animated.timing(opacity, {
            toValue: 0,
            duration: duration * 0.3,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
  }, []);

  const rotateInterpolate = rotate.interpolate({
    inputRange: [0, 10],
    outputRange: ['0deg', '3600deg'],
  });

  const size = 8 + Math.random() * 8;
  const isRound = Math.random() > 0.5;

  return (
    <Animated.View
      style={[
        styles.confettiPiece,
        {
          width: size,
          height: isRound ? size : size * 2,
          borderRadius: isRound ? size / 2 : 2,
          backgroundColor: color,
          transform: [
            { translateY },
            { translateX },
            { rotate: rotateInterpolate },
          ],
          opacity,
        },
      ]}
    />
  );
}

/**
 * Confetti explosion component
 * @param {boolean} active - Whether to show confetti
 * @param {function} onComplete - Callback when animation completes
 */
export default function Confetti({ active, onComplete }) {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    if (active) {
      // Generate confetti pieces
      const newPieces = Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
        id: i,
        delay: Math.random() * 500,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        startX: Math.random() * SCREEN_WIDTH,
      }));
      setPieces(newPieces);

      // Call onComplete after animation
      const timeout = setTimeout(() => {
        onComplete?.();
      }, 5000);

      return () => clearTimeout(timeout);
    } else {
      setPieces([]);
    }
  }, [active]);

  if (!active || pieces.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {pieces.map((piece) => (
        <ConfettiPiece
          key={piece.id}
          delay={piece.delay}
          color={piece.color}
          startX={piece.startX}
        />
      ))}
    </View>
  );
}

/**
 * Burst confetti from center
 */
export function ConfettiBurst({ active, onComplete }) {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    if (active) {
      const centerX = SCREEN_WIDTH / 2;
      const centerY = SCREEN_HEIGHT / 3;

      const newPieces = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        startX: centerX,
        startY: centerY,
        angle: (i / 30) * Math.PI * 2,
        velocity: 300 + Math.random() * 200,
      }));
      setPieces(newPieces);

      const timeout = setTimeout(() => {
        onComplete?.();
      }, 3000);

      return () => clearTimeout(timeout);
    } else {
      setPieces([]);
    }
  }, [active]);

  if (!active || pieces.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {pieces.map((piece) => (
        <BurstPiece key={piece.id} {...piece} />
      ))}
    </View>
  );
}

function BurstPiece({ color, startX, startY, angle, velocity }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 2000,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, []);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [startX, startX + Math.cos(angle) * velocity],
  });

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [startY, startY + Math.sin(angle) * velocity + 200], // Add gravity
  });

  const opacity = progress.interpolate({
    inputRange: [0, 0.8, 1],
    outputRange: [1, 1, 0],
  });

  const scale = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 1.2, 0.5],
  });

  const size = 6 + Math.random() * 6;

  return (
    <Animated.View
      style={[
        styles.burstPiece,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          transform: [{ translateX }, { translateY }, { scale }],
          opacity,
        },
      ]}
    />
  );
}

/**
 * Sparkle effect for smaller celebrations
 */
export function Sparkles({ active, onComplete }) {
  const [sparkles, setSparkles] = useState([]);

  useEffect(() => {
    if (active) {
      const newSparkles = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        x: SCREEN_WIDTH / 2 + (Math.random() - 0.5) * 150,
        y: SCREEN_HEIGHT / 3 + (Math.random() - 0.5) * 100,
        delay: i * 100,
      }));
      setSparkles(newSparkles);

      const timeout = setTimeout(() => {
        onComplete?.();
      }, 2000);

      return () => clearTimeout(timeout);
    } else {
      setSparkles([]);
    }
  }, [active]);

  if (!active || sparkles.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {sparkles.map((sparkle) => (
        <Sparkle key={sparkle.id} {...sparkle} />
      ))}
    </View>
  );
}

function Sparkle({ x, y, delay }) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1,
            duration: 300,
            easing: Easing.out(Easing.back(2)),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.delay(300),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.sparkle,
        {
          left: x,
          top: y,
          transform: [{ scale }],
          opacity,
        },
      ]}
    >
      <View style={styles.sparkleHorizontal} />
      <View style={styles.sparkleVertical} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  confettiPiece: {
    position: 'absolute',
    top: 0,
  },
  burstPiece: {
    position: 'absolute',
  },
  sparkle: {
    position: 'absolute',
    width: 20,
    height: 20,
    marginLeft: -10,
    marginTop: -10,
  },
  sparkleHorizontal: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#FFD93D',
    borderRadius: 2,
  },
  sparkleVertical: {
    position: 'absolute',
    left: 8,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#FFD93D',
    borderRadius: 2,
  },
});
