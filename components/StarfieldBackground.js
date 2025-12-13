import React, { useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Star configuration
const STAR_COUNT = 30;
const DEPTH_LAYERS = 3; // foreground, mid, far

// Animation parameters
const DRIFT_SPEED_BASE = 8000; // Base duration in ms (slower = more subtle)
const TWINKLE_DURATION_MIN = 3000;
const TWINKLE_DURATION_MAX = 6000;
const RADIAL_FLOAT_DISTANCE = 2; // Max pixels to float
const RADIAL_DURATION_MIN = 12000;
const RADIAL_DURATION_MAX = 20000;

/**
 * StarfieldBackground - Animated star background with parallax, twinkle, and subtle movement
 * 
 * Features:
 * - Parallax drift: Stars move at different speeds based on depth layer
 * - Twinkle effect: Opacity pulses create depth perception
 * - Radial float: Subtle circular movement prevents static feel
 * - Performance: Memoized, uses native driver, pointerEvents="none"
 */
export default function StarfieldBackground({ containerHeight = 400 }) {
  // Generate stars with depth layers and random properties
  const stars = useMemo(() => {
    return [...Array(STAR_COUNT)].map((_, i) => {
      const layer = i % DEPTH_LAYERS; // Distribute stars across layers
      const depthFactor = layer === 0 ? 1.0 : layer === 1 ? 0.6 : 0.3; // Foreground fastest, far slowest
      
      return {
        id: i,
        // Initial position
        x: Math.random() * SCREEN_WIDTH,
        y: Math.random() * containerHeight,
        // Depth layer (0 = foreground, 1 = mid, 2 = far)
        layer,
        depthFactor,
        // Animation phase offsets (randomized to avoid synchronization)
        driftPhase: Math.random() * Math.PI * 2,
        twinklePhase: Math.random() * Math.PI * 2,
        radialPhase: Math.random() * Math.PI * 2,
        // Animation durations (varied per star)
        driftDuration: DRIFT_SPEED_BASE + (Math.random() * 4000 - 2000) * depthFactor,
        twinkleDuration: TWINKLE_DURATION_MIN + Math.random() * (TWINKLE_DURATION_MAX - TWINKLE_DURATION_MIN),
        radialDuration: RADIAL_DURATION_MIN + Math.random() * (RADIAL_DURATION_MAX - RADIAL_DURATION_MIN),
        // Size varies slightly by depth (foreground slightly larger)
        size: layer === 0 ? 2.5 : layer === 1 ? 2 : 1.5,
        // Base opacity varies by depth
        baseOpacity: layer === 0 ? 0.6 : layer === 1 ? 0.4 : 0.3,
      };
    });
  }, [containerHeight]);

  // Animation values - one per star for each animation type
  const driftAnims = useRef(stars.map(() => new Animated.Value(0))).current;
  const twinkleAnims = useRef(stars.map(() => new Animated.Value(0))).current;
  const radialXAnims = useRef(stars.map(() => new Animated.Value(0))).current;
  const radialYAnims = useRef(stars.map(() => new Animated.Value(0))).current;

  // Start all animations
  useEffect(() => {
    const animations = [];

    stars.forEach((star, i) => {
      // Parallax drift - horizontal movement at different speeds
      const driftAnim = Animated.loop(
        Animated.timing(driftAnims[i], {
          toValue: 1,
          duration: star.driftDuration,
          useNativeDriver: true,
        })
      );
      animations.push(driftAnim);

      // Twinkle - opacity pulse
      const twinkleAnim = Animated.loop(
        Animated.sequence([
          Animated.timing(twinkleAnims[i], {
            toValue: 1,
            duration: star.twinkleDuration / 2,
            useNativeDriver: true,
          }),
          Animated.timing(twinkleAnims[i], {
            toValue: 0,
            duration: star.twinkleDuration / 2,
            useNativeDriver: true,
          }),
        ])
      );
      animations.push(twinkleAnim);

      // Radial float - subtle independent X/Y oscillation (creates organic movement)
      // X and Y oscillate independently to create subtle circular-like motion
      const radialAnimX = Animated.loop(
        Animated.sequence([
          Animated.timing(radialXAnims[i], {
            toValue: 1,
            duration: star.radialDuration / 2,
            useNativeDriver: true,
          }),
          Animated.timing(radialXAnims[i], {
            toValue: 0,
            duration: star.radialDuration / 2,
            useNativeDriver: true,
          }),
        ])
      );
      animations.push(radialAnimX);

      // Y oscillates with phase offset using delay in sequence
      const radialAnimY = Animated.loop(
        Animated.sequence([
          Animated.delay(star.radialDuration / 4), // Phase offset for circular motion
          Animated.timing(radialYAnims[i], {
            toValue: 1,
            duration: star.radialDuration / 2,
            useNativeDriver: true,
          }),
          Animated.timing(radialYAnims[i], {
            toValue: 0,
            duration: star.radialDuration / 2,
            useNativeDriver: true,
          }),
        ])
      );
      animations.push(radialAnimY);
    });

    // Start all animations
    animations.forEach(anim => anim.start());

    // Cleanup
    return () => {
      animations.forEach(anim => anim.stop());
    };
  }, []); // Empty deps - stars are memoized, animations only start once

  return (
    <View style={styles.container} pointerEvents="none">
      {stars.map((star, i) => {
        // Parallax drift interpolation (horizontal movement) - as translateX offset
        const driftX = driftAnims[i].interpolate({
          inputRange: [0, 1],
          outputRange: [
            0,
            20 * star.depthFactor, // Foreground moves more
          ],
        });

        // Twinkle interpolation (opacity pulse)
        const opacity = twinkleAnims[i].interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [
            star.baseOpacity * 0.5,
            star.baseOpacity * 1.2, // Peak brightness
            star.baseOpacity * 0.5,
          ],
        });

        // Radial float interpolation (subtle circular-like movement)
        // X and Y oscillate independently with phase offset to create organic motion
        const radialX = radialXAnims[i].interpolate({
          inputRange: [0, 1],
          outputRange: [
            Math.cos(star.radialPhase) * RADIAL_FLOAT_DISTANCE * star.depthFactor * -1,
            Math.cos(star.radialPhase) * RADIAL_FLOAT_DISTANCE * star.depthFactor,
          ],
        });

        const radialY = radialYAnims[i].interpolate({
          inputRange: [0, 1],
          outputRange: [
            Math.sin(star.radialPhase) * RADIAL_FLOAT_DISTANCE * star.depthFactor * -1,
            Math.sin(star.radialPhase) * RADIAL_FLOAT_DISTANCE * star.depthFactor,
          ],
        });

        // Combine all movement via transforms (native driver compatible)
        const translateX = Animated.add(driftX, radialX);
        const translateY = radialY;

        return (
          <Animated.View
            key={star.id}
            style={[
              styles.star,
              {
                left: star.x, // Static base position
                top: star.y,  // Static base position
                width: star.size,
                height: star.size,
                borderRadius: star.size / 2,
                opacity,
                transform: [
                  { translateX },
                  { translateY },
                ],
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
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  star: {
    position: 'absolute',
    backgroundColor: '#ffffff',
  },
});
