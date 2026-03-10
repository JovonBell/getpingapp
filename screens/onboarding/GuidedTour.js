import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPE } from '../../theme';

const { width: SW, height: SH } = Dimensions.get('window');
const TOUR_KEY = '@ping_onboarding_complete';
const TOUR_STEP_KEY = '@ping_onboarding_step';

// Floating dot with drift + breathing + fading
function WelcomeDot({ x, y, size, delay, duration, driftX, driftY }) {
  const drift = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Staggered fade-in
    Animated.timing(fade, {
      toValue: 1, duration: 1800, delay, useNativeDriver: true,
    }).start();

    // Continuous drifting
    Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(drift, { toValue: 0, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // Pulse breathing (offset by delay)
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay % 1000),
        Animated.timing(pulse, { toValue: 1, duration: 1800 + (delay % 800), easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1800 + (delay % 800), easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const translateX = drift.interpolate({ inputRange: [0, 1], outputRange: [0, driftX] });
  const translateY = drift.interpolate({ inputRange: [0, 1], outputRange: [0, driftY] });
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.5] });
  const opacity = pulse.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.2, 1, 0.2] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: COLORS.primary,
        opacity: Animated.multiply(opacity, fade),
        transform: [{ translateX }, { translateY }, { scale }],
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: size * 2.5,
      }}
    />
  );
}

// 30 dots with random positions and drift vectors
const WELCOME_DOTS = Array.from({ length: 30 }, (_, i) => ({
  x: Math.random() * SW,
  y: Math.random() * SH,
  size: 2 + Math.random() * 12,
  delay: i * 60,
  duration: 4000 + Math.random() * 5000,
  driftX: -25 + Math.random() * 50,
  driftY: -25 + Math.random() * 50,
}));

// Steps: 0 = welcome splash, 1 = create your profile, 2 = code your ring
export default function GuidedTour({ onComplete, onSwitchTab }) {
  const [step, setStep] = useState(null);
  const [visible, setVisible] = useState(false);

  // Welcome animations
  const welcomeFade = useRef(new Animated.Value(0)).current;
  const welcomeScale = useRef(new Animated.Value(0.5)).current;
  const welcomeSubFade = useRef(new Animated.Value(0)).current;
  const welcomeBtnFade = useRef(new Animated.Value(0)).current;
  // Concentric ring breathing for welcome
  const ring1Scale = useRef(new Animated.Value(0.8)).current;
  const ring1Op = useRef(new Animated.Value(0)).current;
  const ring2Scale = useRef(new Animated.Value(0.8)).current;
  const ring2Op = useRef(new Animated.Value(0)).current;
  const ring3Scale = useRef(new Animated.Value(0.8)).current;
  const ring3Op = useRef(new Animated.Value(0)).current;

  // Tooltip animations
  const tooltipFade = useRef(new Animated.Value(0)).current;
  const arrowBounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    checkTourState();
  }, []);

  const checkTourState = async () => {
    try {
      const complete = await AsyncStorage.getItem(TOUR_KEY);
      if (complete === 'true') {
        setVisible(false);
        return;
      }
      const savedStep = await AsyncStorage.getItem(TOUR_STEP_KEY);
      const s = savedStep ? parseInt(savedStep, 10) : 0;
      setStep(s);
      setVisible(true);
    } catch {
      setVisible(false);
    }
  };

  // Welcome splash animations
  useEffect(() => {
    if (step !== 0) return;

    // Entrance sequence
    Animated.sequence([
      Animated.delay(500),
      Animated.parallel([
        Animated.timing(welcomeFade, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.spring(welcomeScale, { toValue: 1, friction: 5, tension: 35, useNativeDriver: true }),
      ]),
      Animated.delay(400),
      Animated.timing(welcomeSubFade, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.delay(300),
      Animated.timing(welcomeBtnFade, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();

    // Concentric rings breathing — loop forever
    const breathe = (scaleAnim, opAnim, minS, maxS, minO, maxO, dur) =>
      Animated.loop(Animated.sequence([
        Animated.parallel([
          Animated.timing(scaleAnim, { toValue: maxS, duration: dur, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(opAnim, { toValue: maxO, duration: dur, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scaleAnim, { toValue: minS, duration: dur, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(opAnim, { toValue: minO, duration: dur, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      ]));

    // Stagger the ring breathing starts
    Animated.sequence([
      Animated.delay(300),
      Animated.timing(ring1Op, { toValue: 0.15, duration: 800, useNativeDriver: true }),
    ]).start(() => breathe(ring1Scale, ring1Op, 0.92, 1.08, 0.1, 0.45, 3500).start());

    Animated.sequence([
      Animated.delay(500),
      Animated.timing(ring2Op, { toValue: 0.2, duration: 800, useNativeDriver: true }),
    ]).start(() => breathe(ring2Scale, ring2Op, 0.94, 1.06, 0.15, 0.55, 2800).start());

    Animated.sequence([
      Animated.delay(700),
      Animated.timing(ring3Op, { toValue: 0.3, duration: 800, useNativeDriver: true }),
    ]).start(() => breathe(ring3Scale, ring3Op, 0.96, 1.04, 0.2, 0.7, 2200).start());
  }, [step]);

  // Tooltip animations for steps 1 and 2
  useEffect(() => {
    if (step !== 1 && step !== 2) return;

    tooltipFade.setValue(0);
    arrowBounce.setValue(0);

    Animated.timing(tooltipFade, {
      toValue: 1, duration: 600, delay: 400, useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(arrowBounce, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(arrowBounce, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, [step]);

  const advanceStep = async (nextStep) => {
    if (nextStep > 2) {
      await AsyncStorage.setItem(TOUR_KEY, 'true');
      await AsyncStorage.removeItem(TOUR_STEP_KEY);
      setVisible(false);
      onComplete?.();
      return;
    }
    await AsyncStorage.setItem(TOUR_STEP_KEY, String(nextStep));
    setStep(nextStep);
  };

  if (!visible || step === null) return null;

  // ─── Step 0: Welcome splash ───────────────────────────────────
  if (step === 0) {
    return (
      <View style={styles.overlay}>
        {WELCOME_DOTS.map((d, i) => <WelcomeDot key={i} {...d} />)}

        <View style={styles.welcomeCenter}>
          {/* Breathing concentric rings behind text */}
          <View style={styles.ringsContainer}>
            <Animated.View style={[styles.welcomeRing, styles.welcomeRing1, { opacity: ring1Op, transform: [{ scale: ring1Scale }] }]} />
            <Animated.View style={[styles.welcomeRing, styles.welcomeRing2, { opacity: ring2Op, transform: [{ scale: ring2Scale }] }]} />
            <Animated.View style={[styles.welcomeRing, styles.welcomeRing3, { opacity: ring3Op, transform: [{ scale: ring3Scale }] }]} />
          </View>

          <Animated.View style={{ opacity: welcomeFade, transform: [{ scale: welcomeScale }] }}>
            <Text style={styles.welcomeTitle}>welcome to</Text>
            <Text style={styles.welcomePing}>ping!</Text>
          </Animated.View>

          <Animated.Text style={[styles.welcomeSub, { opacity: welcomeSubFade }]}>
            let's set up your ring in a few steps.
          </Animated.Text>

          <Animated.View style={{ opacity: welcomeBtnFade }}>
            <TouchableOpacity style={styles.welcomeBtn} onPress={() => advanceStep(1)} activeOpacity={0.8}>
              <Text style={styles.welcomeBtnText}>let's begin</Text>
              <Ionicons name="arrow-forward" size={18} color="#000" />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    );
  }

  // ─── Step 1: Create your profile — arrow pointing to top-right edit icon ──
  if (step === 1) {
    const arrowY = arrowBounce.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -10],
    });

    return (
      <View style={styles.tooltipOverlay} pointerEvents="box-none">
        <Animated.View style={[styles.step1Container, { opacity: tooltipFade }]}>
          {/* Arrow pointing to top-right edit button */}
          <Animated.View style={[styles.step1Arrow, { transform: [{ translateY: arrowY }] }]}>
            <Ionicons name="arrow-up" size={32} color={COLORS.primary} />
          </Animated.View>

          <Text style={styles.floatingTitle}>create your account</Text>
          <Text style={styles.floatingDesc}>
            tap the pencil to set up your profile
          </Text>

          <TouchableOpacity style={styles.floatingBtn} onPress={() => advanceStep(2)} activeOpacity={0.8}>
            <Text style={styles.floatingBtnText}>got it</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  // ─── Step 2: Code your ring — arrow pointing down to ring tab ──
  if (step === 2) {
    const arrowY = arrowBounce.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 10],
    });

    return (
      <View style={styles.tooltipOverlay} pointerEvents="box-none">
        <Animated.View style={[styles.step2Container, { opacity: tooltipFade }]}>
          {/* Glossy black card */}
          <View style={styles.glossyCard}>
            <Text style={styles.floatingTitle}>code your ring!</Text>
            <Text style={styles.floatingDesc}>
              tap the ring tab to program your ping
            </Text>

            <TouchableOpacity
              style={styles.floatingBtn}
              onPress={() => {
                onSwitchTab?.('RingTab');
                advanceStep(3);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.floatingBtnText}>let's code it</Text>
              <Ionicons name="radio-outline" size={16} color="#000" />
            </TouchableOpacity>
          </View>

          {/* Arrow pointing down to tab bar */}
          <Animated.View style={[styles.step2Arrow, { transform: [{ translateY: arrowY }] }]}>
            <Ionicons name="arrow-down" size={32} color={COLORS.primary} />
          </Animated.View>
        </Animated.View>
      </View>
    );
  }

  return null;
}

// Reset tour (for testing)
export async function resetGuidedTour() {
  await AsyncStorage.removeItem(TOUR_KEY);
  await AsyncStorage.removeItem(TOUR_STEP_KEY);
}

const styles = StyleSheet.create({
  // ─── Welcome splash ──────────────────────────────
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    zIndex: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeCenter: {
    alignItems: 'center',
    zIndex: 10,
  },
  ringsContainer: {
    position: 'absolute',
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    top: -50,
  },
  welcomeRing: {
    position: 'absolute',
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
  },
  welcomeRing1: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1.5,
    shadowOpacity: 0.4,
    shadowRadius: 25,
  },
  welcomeRing2: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1.5,
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  welcomeRing3: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    shadowOpacity: 0.6,
    shadowRadius: 16,
  },
  welcomeTitle: {
    fontFamily: TYPE.body.fontFamily,
    fontSize: 18,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: 4,
  },
  welcomePing: {
    fontFamily: TYPE.hero.fontFamily,
    fontSize: 64,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -2,
  },
  welcomeSub: {
    fontFamily: TYPE.body.fontFamily,
    fontSize: 16,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    marginTop: 24,
    letterSpacing: 0.5,
    lineHeight: 24,
  },
  welcomeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 44,
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 36,
    borderRadius: 18,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  welcomeBtnText: {
    fontFamily: TYPE.button.fontFamily,
    fontSize: 17,
    color: '#000',
  },

  // ─── Tooltip overlay ─────────────────────────────
  tooltipOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 998,
  },

  // ─── Step 1: floating text + arrow top-right ─────
  step1Container: {
    position: 'absolute',
    top: 110,
    right: 24,
    alignItems: 'flex-end',
  },
  step1Arrow: {
    marginBottom: 4,
    marginRight: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
  floatingTitle: {
    fontFamily: TYPE.title.fontFamily,
    fontSize: 22,
    color: '#FFFFFF',
    marginBottom: 4,
    textShadowColor: 'rgba(79, 255, 176, 0.25)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  floatingDesc: {
    fontFamily: TYPE.body.fontFamily,
    fontSize: 14,
    color: 'rgba(255,255,255,0.45)',
    marginBottom: 14,
    textAlign: 'right',
  },
  floatingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  floatingBtnText: {
    fontFamily: TYPE.button.fontFamily,
    fontSize: 15,
    color: '#000',
  },

  // ─── Glossy card ────────────────────────────────
  glossyCard: {
    backgroundColor: 'rgba(10, 10, 15, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 20,
    // Glossy highlight
    overflow: 'hidden',
  },

  // ─── Step 2: floating text + arrow bottom ────────
  step2Container: {
    position: 'absolute',
    bottom: 110,
    alignSelf: 'center',
    alignItems: 'center',
  },
  step2Arrow: {
    marginTop: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
});
