import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Dimensions, Animated, Platform } from 'react-native';
import { DeviceMotion } from 'expo-sensors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Particle themes for different screens
const PARTICLE_THEMES = {
  welcome: {
    count: 30,
    colors: ['rgba(79, 255, 176, 0.4)', 'rgba(168, 230, 207, 0.3)', 'rgba(100, 200, 255, 0.3)'],
    sizeRange: [3, 8],
    speedRange: [0.3, 0.8],
  },
  contacts: {
    count: 25,
    colors: ['rgba(79, 255, 176, 0.5)', 'rgba(255, 255, 255, 0.3)'],
    sizeRange: [2, 6],
    speedRange: [0.2, 0.5],
  },
  goals: {
    count: 35,
    colors: ['rgba(255, 215, 0, 0.4)', 'rgba(255, 165, 0, 0.3)', 'rgba(79, 255, 176, 0.3)'],
    sizeRange: [2, 5],
    speedRange: [0.5, 1.0],
  },
  complete: {
    count: 50,
    colors: ['rgba(79, 255, 176, 0.6)', 'rgba(168, 230, 207, 0.5)', 'rgba(255, 255, 255, 0.4)'],
    sizeRange: [3, 10],
    speedRange: [0.8, 1.5],
  },
};

const createParticle = (theme, index) => {
  const { colors, sizeRange, speedRange } = theme;
  return {
    id: index,
    x: Math.random() * SCREEN_WIDTH,
    y: Math.random() * SCREEN_HEIGHT,
    size: sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]),
    color: colors[Math.floor(Math.random() * colors.length)],
    speedX: (Math.random() - 0.5) * 2 * speedRange[1],
    speedY: (Math.random() - 0.5) * 2 * speedRange[1],
    opacity: 0.3 + Math.random() * 0.5,
    pulseSpeed: 1 + Math.random() * 2,
    pulseOffset: Math.random() * Math.PI * 2,
  };
};

export default function ParticleBackground({
  theme = 'welcome',
  enableMotion = true,
  enablePulse = true,
  style,
}) {
  const [particles, setParticles] = useState([]);
  const animatedValues = useRef({});
  const motionOffset = useRef({ x: 0, y: 0 });
  const frameRef = useRef(null);
  const lastTimeRef = useRef(Date.now());

  // Initialize particles
  useEffect(() => {
    const particleTheme = PARTICLE_THEMES[theme] || PARTICLE_THEMES.welcome;
    const newParticles = [];

    for (let i = 0; i < particleTheme.count; i++) {
      const particle = createParticle(particleTheme, i);
      newParticles.push(particle);

      // Create animated values for each particle
      animatedValues.current[i] = {
        position: new Animated.ValueXY({ x: particle.x, y: particle.y }),
        opacity: new Animated.Value(particle.opacity),
        scale: new Animated.Value(1),
      };
    }

    setParticles(newParticles);

    // Start pulse animation for each particle
    if (enablePulse) {
      newParticles.forEach((particle, i) => {
        const pulseAnimation = Animated.loop(
          Animated.sequence([
            Animated.timing(animatedValues.current[i].scale, {
              toValue: 1.3,
              duration: 1000 + particle.pulseSpeed * 500,
              useNativeDriver: true,
            }),
            Animated.timing(animatedValues.current[i].scale, {
              toValue: 1,
              duration: 1000 + particle.pulseSpeed * 500,
              useNativeDriver: true,
            }),
          ])
        );
        pulseAnimation.start();
      });
    }

    // Start movement animation
    const animate = () => {
      const now = Date.now();
      const delta = (now - lastTimeRef.current) / 16.67; // Normalize to 60fps
      lastTimeRef.current = now;

      newParticles.forEach((particle, i) => {
        // Update position
        particle.x += particle.speedX * delta + motionOffset.current.x * 0.5;
        particle.y += particle.speedY * delta + motionOffset.current.y * 0.5;

        // Wrap around screen edges
        if (particle.x < -particle.size) particle.x = SCREEN_WIDTH + particle.size;
        if (particle.x > SCREEN_WIDTH + particle.size) particle.x = -particle.size;
        if (particle.y < -particle.size) particle.y = SCREEN_HEIGHT + particle.size;
        if (particle.y > SCREEN_HEIGHT + particle.size) particle.y = -particle.size;

        // Update animated value
        if (animatedValues.current[i]) {
          animatedValues.current[i].position.setValue({ x: particle.x, y: particle.y });
        }
      });

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [theme, enablePulse]);

  // Device motion for parallax effect
  useEffect(() => {
    if (!enableMotion || Platform.OS === 'web') return;

    let subscription;

    const subscribe = async () => {
      const isAvailable = await DeviceMotion.isAvailableAsync();
      if (!isAvailable) return;

      DeviceMotion.setUpdateInterval(50);
      subscription = DeviceMotion.addListener(({ rotation }) => {
        if (rotation) {
          motionOffset.current = {
            x: rotation.gamma * 10, // Tilt left/right
            y: rotation.beta * 10,  // Tilt forward/backward
          };
        }
      });
    };

    subscribe().catch(console.warn);

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [enableMotion]);

  return (
    <View style={[styles.container, style]} pointerEvents="none">
      {particles.map((particle, i) => {
        const animValue = animatedValues.current[i];
        if (!animValue) return null;

        return (
          <Animated.View
            key={particle.id}
            style={[
              styles.particle,
              {
                width: particle.size,
                height: particle.size,
                borderRadius: particle.size / 2,
                backgroundColor: particle.color,
                transform: [
                  { translateX: animValue.position.x },
                  { translateY: animValue.position.y },
                  { scale: animValue.scale },
                ],
                opacity: animValue.opacity,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
  },
});
