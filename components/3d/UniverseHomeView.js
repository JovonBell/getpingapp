/**
 * UniverseHomeView - Immersive 3D visualization for the home screen
 *
 * Combines all cosmic visual systems into one breathtaking experience:
 * - Enhanced star field with parallax
 * - Nebula clouds floating in background
 * - Floating particles for atmosphere
 * - Dramatic pulsing nucleus at center
 * - Contacts as glowing spheres orbiting on rings
 * - Entrance animation with contacts bursting from nucleus
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Platform, StyleSheet, Text, View } from 'react-native';
import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';
import { DeviceMotion } from 'expo-sensors';

// Import sub-systems
import { TouchController } from './TouchController';
import { CameraController } from './CameraController';
import { createEnhancedStarField } from './EnhancedStarField';
import { createNebulaSystem } from './NebulaSystem';
import { createFloatingParticles } from './FloatingParticles';
import { createNucleus } from './NucleusGlow';
import { createCelestialSystem } from './CelestialBodies';
import { createContactMaterial, createContactGlow, clearTextureCache } from './ContactTextureHelper';
import { getHealthColor } from '../../utils/scoring/healthScoring';
import Haptic from '../../utils/haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Determine device quality
const isHighQuality = Platform.OS === 'ios' || (Platform.OS === 'android' && Platform.Version >= 28);

// Ring configuration
const RING_CONFIG = {
  baseRadius: 3.5,
  radiusStep: 2.8,
  maxRings: 6,
  maxContactsPerRing: 12,
  contactRadius: 0.45,
  ringOpacity: 0.5, // Boosted visibility
  ringGlowOpacity: 0.25, // Boosted glow
  ghostRingOpacity: 0.2, // Subtle ghost rings
  minVisibleRings: 2, // Always show at least 2 rings
};

// Ring rotation speeds (different for each ring)
const RING_ROTATION_SPEEDS = [0.0004, 0.00035, 0.0003, 0.00025, 0.0002, 0.00015];

// Animation settings
const ORBIT_SPEED = 0.00025;
const CONTACT_FLOAT_SPEED = 0.0015;
const CONTACT_FLOAT_AMOUNT = 0.08;

// Supernova celebration colors
const SUPERNOVA_COLORS = [0xFFD700, 0xFF6B6B, 0x4FFFB0, 0xB04FFF, 0xFF9F4F, 0x4F9FFF];

// Entrance animation settings
const ENTRANCE_DELAY = 300; // ms before animation starts
const ENTRANCE_DURATION = 1200; // ms for full animation
const ENTRANCE_STAGGER = 80; // ms between ring animations

// Easing function for entrance animation (overshoot effect)
const easeOutBack = (t) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

// ============================================
// TIME-OF-DAY THEME SYSTEM
// Universe transforms throughout the day
// ============================================
const TIME_THEMES = {
  dawn: {     // 5am-8am - Warm oranges, new day energy
    background: 0x0a0808,
    nucleus: 0xFFB347,
    rings: 0xFF8E72,
    accent: 0xFF6B35,
    starBrightness: 0.5,   // Visible but fading
    fogDensity: 0.015,
  },
  day: {      // 8am-5pm - Vibrant greens, active energy
    background: 0x020208,
    nucleus: 0x4FFFB0,
    rings: 0x4FFFB0,
    accent: 0x00D4AA,
    starBrightness: 0.6,   // FIXED: Was 0.3, stars now visible!
    fogDensity: 0.012,
  },
  sunset: {   // 5pm-8pm - Purple-pink, winding down
    background: 0x0a0510,
    nucleus: 0xFF9F4F,
    rings: 0xB04FFF,
    accent: 0xFF4F9F,
    starBrightness: 0.7,   // Stars brightening
    fogDensity: 0.01,
  },
  night: {    // 8pm-5am - Deep space, mysterious
    background: 0x020208,
    nucleus: 0x4F9FFF,
    rings: 0x4F9FFF,
    accent: 0xB04FFF,
    starBrightness: 1.0,   // Maximum brightness
    fogDensity: 0.008,
  },
};

/**
 * Get current time theme based on hour of day
 */
const getCurrentTimeTheme = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 8) return TIME_THEMES.dawn;
  if (hour >= 8 && hour < 17) return TIME_THEMES.day;
  if (hour >= 17 && hour < 20) return TIME_THEMES.sunset;
  return TIME_THEMES.night;
};

/**
 * Get theme name for debugging
 */
const getThemeName = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 8) return 'dawn';
  if (hour >= 8 && hour < 17) return 'day';
  if (hour >= 17 && hour < 20) return 'sunset';
  return 'night';
};

export default function UniverseHomeView({
  circles = [],
  healthMap = {},
  onContactTap,
  onContactDoubleTap,
  onContactLongPress,
  onRingTap,
  onNucleusTap,
  onBackgroundTap,
  onSupernovaReady,  // Callback to receive all cosmic effect functions
  primaryColor = 0x4fffb0,
  style,
}) {
  const [labelPositions, setLabelPositions] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [isEntranceComplete, setIsEntranceComplete] = useState(false);
  const [flashOpacity, setFlashOpacity] = useState(0);

  // Refs for 3D scene
  const stateRef = useRef({
    raf: null,
    cleanup: null,
    time: 0,
    orbitAngles: [],
    entranceStartTime: null,
    entranceProgress: {},
  });

  const isMountedRef = useRef(true);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const glRef = useRef(null);
  const touchControllerRef = useRef(null);
  const cameraControllerRef = useRef(null);
  const instancedMeshRef = useRef(null);

  // Background systems refs
  const starFieldRef = useRef(null);
  const nebulaRef = useRef(null);
  const particlesRef = useRef(null);
  const nucleusRef = useRef(null);
  const celestialRef = useRef(null);  // Sun, moon, aurora, horizon

  // Contact data for raycasting
  const contactDataRef = useRef([]);

  // Long press detection
  const longPressTimerRef = useRef(null);
  const longPressContactRef = useRef(null);

  // Device motion for parallax effect
  const deviceMotionRef = useRef({ beta: 0, gamma: 0 });

  // Gravity well tracking - where is the user's finger in 3D space?
  const gravityWellRef = useRef({
    active: false,
    position: new THREE.Vector3(0, 0, 0),
    lastHapticTime: 0,
  });

  // Supernova celebration system
  const supernovaRef = useRef({
    active: false,
    particles: [],
    flashOpacity: 0,
    cameraShake: { x: 0, y: 0 },
    startTime: 0,
  });

  // Black hole warning for neglected contacts (90+ days)
  const blackHoleRef = useRef({
    active: false,
    vortex: null,
    neglectedContacts: [],
    rotationSpeed: 0.02,
  });

  // Universe birth animation for first-time users
  const universeBirthRef = useRef({
    active: false,
    phase: 0, // 0=dark, 1=nucleus, 2=rings, 3=stars, 4=complete
    startTime: 0,
  });

  // Constellation lines between contacts in same circle
  const constellationRef = useRef({
    lines: [],
    enabled: false,
  });

  // Flatten circles into contact array with positions
  // Deduplicate contacts by ID to prevent issues
  const flattenedContacts = useMemo(() => {
    const contacts = [];
    const seenIds = new Set();
    let instanceIndex = 0;

    circles.forEach((circle, ringIndex) => {
      if (ringIndex >= RING_CONFIG.maxRings) return;

      const radius = RING_CONFIG.baseRadius + ringIndex * RING_CONFIG.radiusStep;
      // Deduplicate contacts within each circle
      const uniqueContacts = (circle.contacts || []).filter(c => {
        if (!c.id || seenIds.has(c.id)) return false;
        seenIds.add(c.id);
        return true;
      });
      const visibleContacts = uniqueContacts.slice(0, RING_CONFIG.maxContactsPerRing);
      const totalContacts = uniqueContacts.length;
      const overflow = totalContacts - visibleContacts.length;

      visibleContacts.forEach((contact, i) => {
        const angle = (i / Math.max(visibleContacts.length, 1)) * Math.PI * 2;
        contacts.push({
          ...contact,
          instanceIndex,
          ringIndex,
          circleId: circle.id,
          circleName: circle.name,
          circleColor: circle.color || '#4FFFB0',
          baseAngle: angle,
          radius,
          health: healthMap[contact.importedContactId] || healthMap[contact.id],
        });
        instanceIndex++;
      });

      // Add overflow indicator if needed
      if (overflow > 0) {
        contacts.push({
          id: `overflow-${circle.id}`,
          name: `+${overflow} more`,
          isOverflow: true,
          instanceIndex,
          ringIndex,
          circleId: circle.id,
          baseAngle: Math.PI * 1.5,
          radius,
        });
        instanceIndex++;
      }
    });

    return contacts;
  }, [circles, healthMap]);

  // Initialize touch controller
  useEffect(() => {
    touchControllerRef.current = new TouchController({
      onTap: (pos) => {
        clearLongPressTimer();
        const hit = performRaycast(pos.x, pos.y);

        if (hit.type === 'contact') {
          Haptic.planetTap();
          const contact = contactDataRef.current[hit.index];
          if (contact?.isOverflow) {
            onRingTap?.(contact.circleId, contact.ringIndex);
          } else {
            setSelectedContact(contact);
            onContactTap?.(contact);
          }
        } else if (hit.type === 'nucleus') {
          Haptic.planetTap();
          onNucleusTap?.();
        } else if (hit.type === 'ring') {
          Haptic.lightTick();
          const circle = circles[hit.index];
          if (circle) {
            onRingTap?.(circle.id, hit.index);
          }
        } else {
          Haptic.lightTick();
          setSelectedContact(null);
          onBackgroundTap?.();
        }
      },
      onDoubleTap: (pos) => {
        const hit = performRaycast(pos.x, pos.y);
        if (hit.type === 'contact') {
          const contact = contactDataRef.current[hit.index];
          if (!contact?.isOverflow) {
            onContactDoubleTap?.(contact);
          }
        }
      },
      onDragStart: (pos) => {
        clearLongPressTimer();
        // Activate gravity well at drag position
        gravityWellRef.current.active = true;
        updateGravityWellPosition(pos?.x || 0, pos?.y || 0);
      },
      onDrag: ({ dx, dy, x, y }) => {
        if (cameraControllerRef.current) {
          cameraControllerRef.current.updateRotation(
            { dx, dy },
            cameraControllerRef.current.getDistance()
          );
        }
        // Update gravity well position as finger moves
        if (x !== undefined && y !== undefined) {
          updateGravityWellPosition(x, y);
        }
      },
      onDragEnd: () => {
        // Deactivate gravity well when finger lifts
        gravityWellRef.current.active = false;
      },
      onPinch: ({ scale }) => {
        if (cameraControllerRef.current) {
          const currentDistance = cameraControllerRef.current.getDistance();
          cameraControllerRef.current.updateDistance(currentDistance / scale, { min: 10, max: 45 });
        }
      },
      onLongPress: (pos) => {
        const hit = performRaycast(pos.x, pos.y);
        if (hit.type === 'contact') {
          const contact = contactDataRef.current[hit.index];
          if (contact && !contact.isOverflow) {
            Haptic.impact();
            onContactLongPress?.(contact, { x: pos.x, y: pos.y });
          }
        }
      },
    });

    return () => {
      touchControllerRef.current?.reset();
      clearLongPressTimer();
    };
  }, [circles, onContactTap, onContactDoubleTap, onContactLongPress, onRingTap, onNucleusTap, onBackgroundTap]);

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  /**
   * Trigger a supernova celebration effect!
   * Call this for achievements, streaks, milestones, etc.
   */
  const triggerSupernova = useCallback(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;
    const supernova = supernovaRef.current;

    // Already active? Don't double-trigger
    if (supernova.active) return;

    console.log('[UniverseHomeView] SUPERNOVA! 🌟');
    supernova.active = true;
    supernova.startTime = Date.now();
    supernova.flashOpacity = 1;

    // Create explosion particles
    const particleCount = 150;
    for (let i = 0; i < particleCount; i++) {
      // Random color from supernova palette
      const color = SUPERNOVA_COLORS[Math.floor(Math.random() * SUPERNOVA_COLORS.length)];

      // Random direction (sphere burst)
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = 0.15 + Math.random() * 0.2;

      const vx = Math.sin(phi) * Math.cos(theta) * speed;
      const vy = Math.sin(phi) * Math.sin(theta) * speed;
      const vz = Math.cos(phi) * speed;

      // Create particle
      const size = 0.08 + Math.random() * 0.12;
      const geo = new THREE.SphereGeometry(size, 8, 8);
      const mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 1,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(0, 0, 0); // Start at nucleus
      scene.add(mesh);

      supernova.particles.push({
        mesh,
        geo,
        mat,
        vx, vy, vz,
        life: 1.0,
        decay: 0.01 + Math.random() * 0.015,
      });
    }

    // Haptic explosion
    Haptic.success();
    setTimeout(() => Haptic.rigidPress(), 100);
    setTimeout(() => Haptic.mediumImpact(), 200);
  }, []);

  /**
   * Create/update black hole warning for critically neglected contacts
   * Contacts not interacted with in 90+ days drift toward a dark vortex
   */
  const updateBlackHoleWarning = useCallback((neglectedContacts) => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;
    const blackHole = blackHoleRef.current;

    // Need at least 3 neglected contacts to show warning
    if (neglectedContacts.length < 3) {
      // Remove existing vortex if any
      if (blackHole.vortex) {
        scene.remove(blackHole.vortex);
        blackHole.vortex.geometry.dispose();
        blackHole.vortex.material.dispose();
        blackHole.vortex = null;
        blackHole.active = false;
      }
      return;
    }

    blackHole.neglectedContacts = neglectedContacts;
    blackHole.active = true;

    // Create vortex if not exists
    if (!blackHole.vortex) {
      const vortexGeo = new THREE.TorusGeometry(0.4, 0.15, 16, 48);
      const vortexMat = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
      });
      blackHole.vortex = new THREE.Mesh(vortexGeo, vortexMat);
      blackHole.vortex.position.set(0, -0.5, 0); // Below nucleus
      blackHole.vortex.rotation.x = Math.PI / 2;
      scene.add(blackHole.vortex);

      // Inner dark core
      const coreGeo = new THREE.SphereGeometry(0.25, 16, 16);
      const coreMat = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.9,
      });
      const core = new THREE.Mesh(coreGeo, coreMat);
      blackHole.vortex.add(core);
      core.position.set(0, 0, 0);

      console.log('[UniverseHomeView] Black hole warning activated!', neglectedContacts.length, 'neglected contacts');
      Haptic.warning();
    }
  }, []);

  /**
   * Play the universe birth animation for first-time users
   */
  const playUniverseBirth = useCallback(() => {
    if (!sceneRef.current || universeBirthRef.current.active) return;

    console.log('[UniverseHomeView] Playing universe birth animation 🌟');
    universeBirthRef.current.active = true;
    universeBirthRef.current.phase = 0;
    universeBirthRef.current.startTime = Date.now();

    // Initially hide everything
    if (nucleusRef.current?.group) {
      nucleusRef.current.group.scale.setScalar(0.01);
      nucleusRef.current.group.visible = true;
    }
    if (starFieldRef.current?.layers) {
      starFieldRef.current.layers.forEach(layer => {
        layer.material.opacity = 0;
      });
    }

    // Haptic heartbeat to accompany birth
    Haptic.softPress();
  }, []);

  /**
   * Toggle constellation lines between contacts in the same circle
   */
  const toggleConstellations = useCallback((enabled) => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;
    const constellation = constellationRef.current;

    // Remove existing lines
    constellation.lines.forEach(line => {
      scene.remove(line.mesh);
      line.geo.dispose();
      line.mat.dispose();
    });
    constellation.lines = [];

    if (!enabled) {
      constellation.enabled = false;
      return;
    }

    constellation.enabled = true;

    // Create lines connecting contacts within each ring
    circles.forEach((circle, ringIndex) => {
      if (!circle.contacts || circle.contacts.length < 2) return;

      const radius = RING_CONFIG.baseRadius + ringIndex * RING_CONFIG.radiusStep;
      const contacts = circle.contacts.slice(0, RING_CONFIG.maxContactsPerRing);

      // Connect each contact to the next (creating a polygon)
      for (let i = 0; i < contacts.length; i++) {
        const nextI = (i + 1) % contacts.length;

        const angle1 = (i / contacts.length) * Math.PI * 2;
        const angle2 = (nextI / contacts.length) * Math.PI * 2;

        const x1 = Math.cos(angle1) * radius;
        const z1 = Math.sin(angle1) * radius;
        const x2 = Math.cos(angle2) * radius;
        const z2 = Math.sin(angle2) * radius;

        const points = [
          new THREE.Vector3(x1, 0, z1),
          new THREE.Vector3(x2, 0, z2),
        ];

        const geo = new THREE.BufferGeometry().setFromPoints(points);
        const mat = new THREE.LineBasicMaterial({
          color: circle.color || 0x4FFFB0,
          transparent: true,
          opacity: 0.3,
        });
        const line = new THREE.Line(geo, mat);
        scene.add(line);

        constellation.lines.push({ mesh: line, geo, mat, ringIndex });
      }
    });

    console.log('[UniverseHomeView] Constellation lines:', constellation.lines.length);
  }, [circles]);

  // Convert screen touch to 3D position on the orbital plane (y=0)
  const updateGravityWellPosition = useCallback((touchX, touchY) => {
    if (!cameraRef.current) return;

    const camera = cameraRef.current;
    const x = (touchX / SCREEN_WIDTH) * 2 - 1;
    const y = -((touchY / SCREEN_HEIGHT) * 2 - 1);

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

    // Calculate intersection with y=0 plane (where contacts orbit)
    const rayOrigin = raycaster.ray.origin;
    const rayDir = raycaster.ray.direction;

    if (rayDir.y !== 0) {
      const t = -rayOrigin.y / rayDir.y;
      if (t > 0) {
        gravityWellRef.current.position.set(
          rayOrigin.x + rayDir.x * t,
          0,
          rayOrigin.z + rayDir.z * t
        );
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      if (stateRef.current.raf) {
        cancelAnimationFrame(stateRef.current.raf);
      }
      stateRef.current.cleanup?.();
    };
  }, []);

  // Device motion for parallax depth effect
  useEffect(() => {
    let subscription = null;

    const startDeviceMotion = async () => {
      try {
        // Set update interval (60fps = ~16ms, we use 50ms for battery efficiency)
        await DeviceMotion.setUpdateInterval(50);

        subscription = DeviceMotion.addListener((data) => {
          if (data.rotation) {
            // Smooth the motion data to prevent jitter
            const smoothing = 0.15;
            deviceMotionRef.current.beta =
              deviceMotionRef.current.beta * (1 - smoothing) +
              (data.rotation.beta || 0) * smoothing;
            deviceMotionRef.current.gamma =
              deviceMotionRef.current.gamma * (1 - smoothing) +
              (data.rotation.gamma || 0) * smoothing;
          }
        });
      } catch (error) {
        console.log('[UniverseHomeView] DeviceMotion not available:', error.message);
      }
    };

    startDeviceMotion();

    return () => {
      subscription?.remove();
    };
  }, []);

  // Track if we need entrance animation (set flag, but don't set time until GL is ready)
  useEffect(() => {
    if (circles.length > 0) {
      stateRef.current.needsEntranceAnimation = true;
      stateRef.current.entranceProgress = {};
      setIsEntranceComplete(false);
    }
  }, [circles]);

  // Expose cosmic effect functions to parent component
  useEffect(() => {
    onSupernovaReady?.({
      triggerSupernova,
      updateBlackHoleWarning,
      playUniverseBirth,
      toggleConstellations,
    });
  }, [onSupernovaReady, triggerSupernova, updateBlackHoleWarning, playUniverseBirth, toggleConstellations]);

  const onContextCreate = async (gl) => {
    console.log('[UniverseHomeView] GL Context created');
    glRef.current = gl;

    const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;

    // Get current time-of-day theme
    const timeTheme = getCurrentTimeTheme();
    const themeName = getThemeName();
    console.log('[UniverseHomeView] Time theme:', themeName);

    // Renderer with theme-based background
    const renderer = new Renderer({ gl });
    renderer.setSize(width, height);
    renderer.setClearColor(timeTheme.background, 1);
    rendererRef.current = renderer;

    // Scene with theme-based fog
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(timeTheme.background, timeTheme.fogDensity);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 500);
    camera.position.set(0, 14, 24);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Camera controller
    cameraControllerRef.current = new CameraController(camera);

    // === BACKGROUND SYSTEMS ===

    // 1. Enhanced star field (far background) - brightness from time theme
    starFieldRef.current = createEnhancedStarField(scene, isHighQuality);
    starFieldRef.current.setBrightness(timeTheme.starBrightness);

    // 2. Nebula clouds (mid-far background)
    nebulaRef.current = createNebulaSystem(scene, isHighQuality);

    // 3. Floating particles (mid-ground atmosphere)
    particlesRef.current = createFloatingParticles(scene, isHighQuality);

    // === LIGHTING ===
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));

    const keyLight = new THREE.DirectionalLight(0xffffff, 0.9);
    keyLight.position.set(5, 10, 5);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(primaryColor, 0.4);
    rimLight.position.set(-5, -5, -5);
    scene.add(rimLight);

    // === NUCLEUS (Center) - Uses time theme color ===
    nucleusRef.current = createNucleus(scene, { primaryColor: timeTheme.nucleus }, isHighQuality);

    // === CELESTIAL BODIES (Sun, Moon, Aurora, Horizon) ===
    celestialRef.current = createCelestialSystem(scene);
    // Initial update with current theme
    celestialRef.current.update(themeName, 0);

    // === ORBIT RINGS (Including ghost rings for always-visible effect) ===
    const ringMeshes = [];
    const ringGlows = [];
    const ghostRings = []; // Track which rings are ghost rings

    // Always show at least minVisibleRings, even if no circles
    const numRingsToShow = Math.max(circles.length, RING_CONFIG.minVisibleRings);

    for (let i = 0; i < numRingsToShow && i < RING_CONFIG.maxRings; i++) {
      const hasCircle = i < circles.length;
      const circle = hasCircle ? circles[i] : null;

      const radius = RING_CONFIG.baseRadius + i * RING_CONFIG.radiusStep;
      const isGhost = !hasCircle;

      // Main ring - uses time theme for default color
      const ringColor = hasCircle ? (circle.color || timeTheme.rings) : timeTheme.accent;
      const ghostTint = 0x1a4a3a; // Subtle tint for ghost rings

      const ringGeo = new THREE.TorusGeometry(radius, 0.025, 8, 96);
      const ringMat = new THREE.MeshBasicMaterial({
        color: hasCircle ? ringColor : ghostTint,
        transparent: true,
        opacity: hasCircle ? RING_CONFIG.ringOpacity : RING_CONFIG.ghostRingOpacity,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.userData = { isGhost, baseOpacity: ringMat.opacity };
      scene.add(ring);
      ringMeshes.push({ geo: ringGeo, mat: ringMat, mesh: ring, radius, isGhost });

      if (isGhost) {
        ghostRings.push(ring);
      }

      // Ring glow (subtle outer glow) - uses time theme
      const glowGeo = new THREE.TorusGeometry(radius, 0.08, 8, 64);
      const glowMat = new THREE.MeshBasicMaterial({
        color: hasCircle ? ringColor : ghostTint,
        transparent: true,
        opacity: hasCircle ? RING_CONFIG.ringGlowOpacity : RING_CONFIG.ghostRingOpacity * 0.5,
        side: THREE.DoubleSide,
      });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      glow.rotation.x = Math.PI / 2;
      glow.userData = { isGhost, baseOpacity: glowMat.opacity };
      scene.add(glow);
      ringGlows.push({ geo: glowGeo, mat: glowMat, mesh: glow, isGhost });
    }

    // === SHOOTING STAR SYSTEM ===
    const shootingStars = [];
    let nextShootingStarTime = Date.now() + 3000 + Math.random() * 5000; // First star in 3-8 seconds

    const createShootingStar = () => {
      // Random start position on edge of visible area
      const angle = Math.random() * Math.PI * 2;
      const startDist = 25 + Math.random() * 10;
      const startX = Math.cos(angle) * startDist;
      const startY = 5 + Math.random() * 15;
      const startZ = Math.sin(angle) * startDist;

      // Direction toward center with offset
      const targetX = (Math.random() - 0.5) * 10;
      const targetY = (Math.random() - 0.5) * 5;
      const targetZ = (Math.random() - 0.5) * 10;

      // Create star
      const starGeo = new THREE.SphereGeometry(0.08, 8, 8);
      const starMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
      });
      const star = new THREE.Mesh(starGeo, starMat);
      star.position.set(startX, startY, startZ);
      scene.add(star);

      // Create trail
      const trailPositions = [];
      const trailCount = 15;
      for (let i = 0; i < trailCount; i++) {
        trailPositions.push(startX, startY, startZ);
      }

      const trailGeo = new THREE.BufferGeometry();
      trailGeo.setAttribute('position', new THREE.Float32BufferAttribute(trailPositions, 3));
      const trailMat = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
      });
      const trail = new THREE.Line(trailGeo, trailMat);
      scene.add(trail);

      shootingStars.push({
        star,
        trail,
        trailGeo,
        startX, startY, startZ,
        targetX, targetY, targetZ,
        startTime: Date.now(),
        duration: 800 + Math.random() * 400, // 0.8-1.2 seconds
        starGeo,
        starMat,
        trailMat,
      });

      // Haptic feedback for shooting star - magical twinkle
      Haptic.shootingStar();
    };

    const updateShootingStars = (now) => {
      // Check if it's time for a new shooting star
      if (now >= nextShootingStarTime) {
        createShootingStar();
        nextShootingStarTime = now + 5000 + Math.random() * 10000; // 5-15 seconds
      }

      // Update existing shooting stars
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        const elapsed = now - ss.startTime;
        const progress = elapsed / ss.duration;

        if (progress >= 1) {
          // Remove completed shooting star
          scene.remove(ss.star);
          scene.remove(ss.trail);
          ss.starGeo.dispose();
          ss.starMat.dispose();
          ss.trailGeo.dispose();
          ss.trailMat.dispose();
          shootingStars.splice(i, 1);
          continue;
        }

        // Fade in/out effect
        const fadeIn = Math.min(progress * 5, 1);
        const fadeOut = 1 - Math.max((progress - 0.7) / 0.3, 0);
        const opacity = fadeIn * fadeOut;

        ss.starMat.opacity = opacity;
        ss.trailMat.opacity = opacity * 0.6;

        // Move star
        const x = ss.startX + (ss.targetX - ss.startX) * progress;
        const y = ss.startY + (ss.targetY - ss.startY) * progress;
        const z = ss.startZ + (ss.targetZ - ss.startZ) * progress;
        ss.star.position.set(x, y, z);

        // Update trail - shift positions
        const positions = ss.trailGeo.attributes.position.array;
        for (let j = positions.length - 3; j >= 3; j -= 3) {
          positions[j] = positions[j - 3];
          positions[j + 1] = positions[j - 2];
          positions[j + 2] = positions[j - 1];
        }
        positions[0] = x;
        positions[1] = y;
        positions[2] = z;
        ss.trailGeo.attributes.position.needsUpdate = true;
      }
    };

    // Initialize orbit angles
    stateRef.current.orbitAngles = circles.map(() => 0);

    // === CONTACTS (Individual Meshes for Photo Support) ===
    const totalContacts = flattenedContacts.length;
    const contactMeshes = [];
    const contactGlows = [];
    const sharedGeo = new THREE.SphereGeometry(RING_CONFIG.contactRadius, 20, 20);

    if (totalContacts > 0) {
      // Store contact data for raycasting
      contactDataRef.current = flattenedContacts;

      // Create individual meshes for each contact (supports unique textures)
      flattenedContacts.forEach((contact, i) => {
        const healthStatus = contact.health?.status || 'unknown';
        const healthColor = contact.isOverflow ? '#888888' : getHealthColor(healthStatus);

        // Create material with potential photo texture
        const material = createContactMaterial(contact, healthColor, !contact.isOverflow);

        // Create the contact sphere
        const mesh = new THREE.Mesh(sharedGeo, material);
        mesh.userData = { contactIndex: i, contact };
        scene.add(mesh);
        contactMeshes.push(mesh);

        // Create glow ring around contact
        const glow = createContactGlow(RING_CONFIG.contactRadius, healthColor);
        scene.add(glow);
        contactGlows.push(glow);
      });

      // Store meshes for raycasting
      instancedMeshRef.current = { meshes: contactMeshes };
    }

    // === ANIMATION LOOP ===
    const tick = () => {
      if (!isMountedRef.current) return;

      const s = stateRef.current;
      s.time += 0.016;

      // Apply momentum from touch controller
      const momentum = touchControllerRef.current?.update();
      if (momentum && cameraControllerRef.current) {
        cameraControllerRef.current.updateRotation(
          { dx: momentum.x, dy: momentum.y },
          cameraControllerRef.current.getDistance()
        );
      }

      // Update background systems
      starFieldRef.current?.update(s.time, camera.position);
      nebulaRef.current?.update(s.time);
      particlesRef.current?.update(s.time);
      nucleusRef.current?.update(s.time);
      celestialRef.current?.update(themeName, s.time);

      // === PARALLAX DEPTH EFFECT ===
      // Different layers move at different speeds based on device tilt
      const { beta, gamma } = deviceMotionRef.current;
      const tiltX = gamma * 0.8; // Left/right tilt
      const tiltY = beta * 0.5;  // Forward/back tilt

      // Star field moves slowest (far background)
      if (starFieldRef.current?.layers) {
        starFieldRef.current.layers.forEach((layer, i) => {
          const parallaxMultiplier = 0.3 + i * 0.15; // Closer layers move more
          layer.position.x = tiltX * parallaxMultiplier;
          layer.position.y = tiltY * parallaxMultiplier;
        });
      }

      // Nebula moves medium speed
      if (nebulaRef.current?.group) {
        nebulaRef.current.group.position.x = tiltX * 0.4;
        nebulaRef.current.group.position.y = tiltY * 0.4;
      }

      // Floating particles move slightly faster
      if (particlesRef.current?.group) {
        particlesRef.current.group.position.x = tiltX * 0.5;
        particlesRef.current.group.position.y = tiltY * 0.5;
      }

      // Nucleus stays mostly centered (moves least) - creates depth illusion
      if (nucleusRef.current?.group) {
        nucleusRef.current.group.position.x = tiltX * 0.05;
        nucleusRef.current.group.position.y = tiltY * 0.05;
      }

      // Update contact positions with entrance animation
      if (contactMeshes.length > 0 && contactDataRef.current.length > 0) {
        const now = Date.now();

        // Initialize entrance start time on first frame (ensures GL is ready)
        if (s.needsEntranceAnimation && !s.entranceStartTime) {
          s.entranceStartTime = now + ENTRANCE_DELAY;
          s.needsEntranceAnimation = false;
        }

        const entranceStart = s.entranceStartTime || now;
        const entranceElapsed = now - entranceStart;

        contactDataRef.current.forEach((contact, i) => {
          const mesh = contactMeshes[i];
          const glow = contactGlows[i];
          if (!mesh) return;

          const ringAngle = s.orbitAngles[contact.ringIndex] || 0;
          const totalAngle = contact.baseAngle + ringAngle;

          // Calculate final position
          const finalX = Math.cos(totalAngle) * contact.radius;
          const finalZ = Math.sin(totalAngle) * contact.radius;
          const floatY = Math.sin(s.time * CONTACT_FLOAT_SPEED + i) * CONTACT_FLOAT_AMOUNT;

          // Entrance animation: burst from nucleus
          const ringDelay = contact.ringIndex * ENTRANCE_STAGGER;
          const contactElapsed = entranceElapsed - ringDelay;
          let progress = Math.min(Math.max(contactElapsed / ENTRANCE_DURATION, 0), 1);
          progress = easeOutBack(progress);

          // During entrance, interpolate from origin
          let x = finalX * progress;
          let z = finalZ * progress;
          let y = floatY * progress;

          // === GRAVITY WELL EFFECT ===
          // When finger is nearby, gently pull contacts toward it
          if (gravityWellRef.current.active && progress >= 1) {
            const wellPos = gravityWellRef.current.position;
            const dx = wellPos.x - x;
            const dz = wellPos.z - z;
            const distance = Math.sqrt(dx * dx + dz * dz);

            // Gravity strength decreases with distance
            const gravityRadius = 4.0; // How far gravity reaches
            if (distance < gravityRadius && distance > 0.5) {
              // Pull strength (stronger when closer, but not too close)
              const pullStrength = (1 - distance / gravityRadius) * 0.25;
              x += dx * pullStrength;
              z += dz * pullStrength;

              // Subtle haptic when contact is pulled close
              if (distance < 2.0) {
                const now = Date.now();
                if (now - gravityWellRef.current.lastHapticTime > 200) {
                  Haptic.selection();
                  gravityWellRef.current.lastHapticTime = now;
                }
              }
            }
          }

          // Scale starts small and grows
          const scale = contact.isOverflow ? 0.6 : 0.3 + 0.7 * progress;

          // Update mesh position and scale
          mesh.position.set(x, y, z);
          mesh.scale.setScalar(scale);

          // Update glow position to match
          if (glow) {
            glow.position.set(x, y, z);
            glow.scale.setScalar(scale);
          }

          // Track entrance completion
          if (progress >= 1 && !s.entranceProgress[i]) {
            s.entranceProgress[i] = true;
          }
        });

        // Check if entrance is complete
        if (!isEntranceComplete && entranceElapsed > ENTRANCE_DURATION + circles.length * ENTRANCE_STAGGER) {
          setIsEntranceComplete(true);
        }
      }

      // Slow orbit rotation
      s.orbitAngles = s.orbitAngles.map((angle, i) => angle + ORBIT_SPEED * (1 + i * 0.3));

      // Ring rotation at different speeds (makes the universe feel alive)
      ringMeshes.forEach((r, i) => {
        const speed = RING_ROTATION_SPEEDS[i] || 0.0002;
        r.mesh.rotation.z += speed;
      });
      ringGlows.forEach((g, i) => {
        const speed = RING_ROTATION_SPEEDS[i] || 0.0002;
        g.mesh.rotation.z += speed;
      });

      // Ghost ring pulsing (invites user to tap)
      ghostRings.forEach((ring, i) => {
        const pulse = Math.sin(s.time * 1.5 + i * 0.5) * 0.1 + ring.userData.baseOpacity;
        ring.material.opacity = Math.max(0.1, pulse);
      });

      // Update shooting stars
      updateShootingStars(Date.now());

      // === SUPERNOVA CELEBRATION EFFECT ===
      const supernova = supernovaRef.current;
      if (supernova.active) {
        const elapsed = Date.now() - supernova.startTime;

        // Camera shake (decays over time)
        const shakeIntensity = Math.max(0, 1 - elapsed / 500) * 0.5;
        supernova.cameraShake.x = (Math.random() - 0.5) * shakeIntensity;
        supernova.cameraShake.y = (Math.random() - 0.5) * shakeIntensity;

        // Flash fade out
        supernova.flashOpacity = Math.max(0, 1 - elapsed / 300);
        if (Math.floor(elapsed / 50) !== Math.floor((elapsed - 16) / 50)) {
          setFlashOpacity(supernova.flashOpacity);
        }

        // Update particles
        for (let i = supernova.particles.length - 1; i >= 0; i--) {
          const p = supernova.particles[i];
          p.life -= p.decay;

          if (p.life <= 0) {
            // Remove dead particle
            scene.remove(p.mesh);
            p.geo.dispose();
            p.mat.dispose();
            supernova.particles.splice(i, 1);
            continue;
          }

          // Move particle outward
          p.mesh.position.x += p.vx;
          p.mesh.position.y += p.vy;
          p.mesh.position.z += p.vz;

          // Slow down (drag)
          p.vx *= 0.98;
          p.vy *= 0.98;
          p.vz *= 0.98;

          // Fade out
          p.mat.opacity = p.life;

          // Slight gravity pull back toward center
          p.vy -= 0.002;
        }

        // Check if supernova is complete
        if (supernova.particles.length === 0 && elapsed > 2000) {
          supernova.active = false;
          supernova.flashOpacity = 0;
          supernova.cameraShake = { x: 0, y: 0 };
          setFlashOpacity(0);
        }
      }

      // === BLACK HOLE WARNING ANIMATION ===
      const blackHole = blackHoleRef.current;
      if (blackHole.active && blackHole.vortex) {
        // Rotate the vortex ominously
        blackHole.vortex.rotation.z += blackHole.rotationSpeed;

        // Pulse the opacity
        const pulse = Math.sin(s.time * 2) * 0.15 + 0.6;
        blackHole.vortex.material.opacity = pulse;

        // Scale pulse (breathing effect)
        const scalePulse = 1 + Math.sin(s.time * 1.5) * 0.1;
        blackHole.vortex.scale.setScalar(scalePulse);
      }

      // === UNIVERSE BIRTH ANIMATION ===
      const birth = universeBirthRef.current;
      if (birth.active) {
        const elapsed = Date.now() - birth.startTime;

        // Phase 0: Darkness (0-500ms)
        if (birth.phase === 0 && elapsed > 500) {
          birth.phase = 1;
          Haptic.softPress();
        }

        // Phase 1: Nucleus appears and expands (500-2500ms)
        if (birth.phase === 1) {
          const progress = Math.min(1, (elapsed - 500) / 2000);
          const scale = easeOutBack(progress);
          if (nucleusRef.current?.group) {
            nucleusRef.current.group.scale.setScalar(scale);
          }
          if (progress >= 1) {
            birth.phase = 2;
            Haptic.mediumImpact();
          }
        }

        // Phase 2: Rings ripple outward (2500-4000ms)
        if (birth.phase === 2) {
          const progress = Math.min(1, (elapsed - 2500) / 1500);
          ringMeshes.forEach((ring, i) => {
            const ringProgress = Math.max(0, Math.min(1, (progress - i * 0.15) / 0.5));
            const scale = easeOutBack(ringProgress);
            ring.mesh.scale.setScalar(scale);
          });
          if (progress >= 1) {
            birth.phase = 3;
          }
        }

        // Phase 3: Stars fade in (4000-6000ms)
        if (birth.phase === 3) {
          const progress = Math.min(1, (elapsed - 4000) / 2000);
          if (starFieldRef.current?.layers) {
            starFieldRef.current.layers.forEach(layer => {
              layer.material.opacity = layer.userData.baseOpacity * progress;
            });
          }
          if (progress >= 1) {
            birth.phase = 4;
            birth.active = false;
            console.log('[UniverseHomeView] Universe birth complete! ✨');
            Haptic.success();
          }
        }
      }

      // Update ring glow based on camera distance
      const camDist = camera.position.length();
      ringGlows.forEach((g, i) => {
        if (g.isGhost) return; // Ghost rings have their own opacity logic
        const intensity = 1 - Math.min(camDist / 40, 1);
        g.mat.opacity = RING_CONFIG.ringGlowOpacity * (1 + intensity * 0.5);
      });

      // Project contact positions to 2D for labels (throttled)
      if (Math.floor(s.time * 10) % 2 === 0) {
        updateLabelPositions(camera, gl);
      }

      // Apply camera shake from supernova
      const originalCamX = camera.position.x;
      const originalCamY = camera.position.y;
      if (supernovaRef.current.active) {
        camera.position.x += supernovaRef.current.cameraShake.x;
        camera.position.y += supernovaRef.current.cameraShake.y;
      }

      renderer.render(scene, camera);

      // Restore camera position after render
      if (supernovaRef.current.active) {
        camera.position.x = originalCamX;
        camera.position.y = originalCamY;
      }

      gl.endFrameEXP();

      s.raf = requestAnimationFrame(tick);
    };

    tick();

    // Cleanup
    stateRef.current.cleanup = () => {
      console.log('[UniverseHomeView] Cleaning up');
      if (stateRef.current.raf) cancelAnimationFrame(stateRef.current.raf);

      // Dispose background systems
      starFieldRef.current?.dispose();
      nebulaRef.current?.dispose();
      particlesRef.current?.dispose();
      nucleusRef.current?.dispose();
      celestialRef.current?.dispose();

      // Dispose shooting stars
      shootingStars.forEach(ss => {
        scene.remove(ss.star);
        scene.remove(ss.trail);
        ss.starGeo.dispose();
        ss.starMat.dispose();
        ss.trailGeo.dispose();
        ss.trailMat.dispose();
      });
      shootingStars.length = 0;

      // Dispose rings
      ringMeshes.forEach(r => {
        r.geo.dispose();
        r.mat.dispose();
        scene.remove(r.mesh);
      });
      ringGlows.forEach(g => {
        g.geo.dispose();
        g.mat.dispose();
        scene.remove(g.mesh);
      });

      // Dispose contacts
      contactMeshes.forEach(mesh => {
        mesh.material.dispose();
        scene.remove(mesh);
      });
      contactGlows.forEach(glow => {
        glow.geometry.dispose();
        glow.material.dispose();
        scene.remove(glow);
      });
      sharedGeo.dispose();

      // Clear texture cache
      clearTextureCache();

      // Dispose black hole
      if (blackHoleRef.current.vortex) {
        scene.remove(blackHoleRef.current.vortex);
        blackHoleRef.current.vortex.geometry.dispose();
        blackHoleRef.current.vortex.material.dispose();
        blackHoleRef.current.vortex = null;
      }

      // Dispose constellation lines
      constellationRef.current.lines.forEach(line => {
        scene.remove(line.mesh);
        line.geo.dispose();
        line.mat.dispose();
      });
      constellationRef.current.lines = [];

      // Dispose supernova particles
      supernovaRef.current.particles.forEach(p => {
        scene.remove(p.mesh);
        p.geo.dispose();
        p.mat.dispose();
      });
      supernovaRef.current.particles = [];

      renderer.dispose?.();
    };
  };

  const performRaycast = useCallback(
    (touchX, touchY) => {
      if (!cameraRef.current || !glRef.current) return { type: 'background' };

      const camera = cameraRef.current;
      const x = (touchX / SCREEN_WIDTH) * 2 - 1;
      const y = -((touchY / SCREEN_HEIGHT) * 2 - 1);

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

      // Check contacts first (priority)
      if (instancedMeshRef.current?.meshes) {
        const contactHits = raycaster.intersectObjects(instancedMeshRef.current.meshes);
        if (contactHits.length > 0) {
          const hitMesh = contactHits[0].object;
          const contactIndex = hitMesh.userData?.contactIndex;
          if (contactIndex !== undefined) {
            return { type: 'contact', index: contactIndex };
          }
        }
      }

      // Check nucleus
      if (nucleusRef.current) {
        const nucleusSphere = nucleusRef.current.getBoundingSphere();
        const nucleusHit = raycaster.ray.intersectSphere(nucleusSphere, new THREE.Vector3());
        if (nucleusHit) {
          return { type: 'nucleus' };
        }
      }

      // Check rings (by distance from ring plane at y=0)
      const rayOrigin = raycaster.ray.origin;
      const rayDir = raycaster.ray.direction;
      if (rayDir.y !== 0) {
        const t = -rayOrigin.y / rayDir.y;
        if (t > 0) {
          const hitPoint = new THREE.Vector3().copy(rayDir).multiplyScalar(t).add(rayOrigin);
          const distFromCenter = Math.sqrt(hitPoint.x * hitPoint.x + hitPoint.z * hitPoint.z);

          // Check each ring (tolerance 0.8 for better tap detection)
          for (let i = 0; i < circles.length && i < RING_CONFIG.maxRings; i++) {
            const ringRadius = RING_CONFIG.baseRadius + i * RING_CONFIG.radiusStep;
            if (Math.abs(distFromCenter - ringRadius) < 0.8) {
              return { type: 'ring', index: i };
            }
          }
        }
      }

      return { type: 'background' };
    },
    [circles]
  );

  const updateLabelPositions = useCallback(
    (camera, gl) => {
      if (!contactDataRef.current.length || !instancedMeshRef.current?.meshes) return;

      const positions = [];
      const meshes = instancedMeshRef.current.meshes;

      contactDataRef.current.forEach((contact, i) => {
        if (!meshes[i]) return;

        // Get position directly from mesh
        const meshPosition = meshes[i].position.clone();
        const vector = meshPosition.clone();
        vector.project(camera);

        const screenX = (vector.x * 0.5 + 0.5) * SCREEN_WIDTH;
        const screenY = (-vector.y * 0.5 + 0.5) * SCREEN_HEIGHT;
        const isBehindCamera = vector.z > 1;

        // Calculate distance for opacity fade
        const dist = meshPosition.length();
        const opacity = Math.max(0.4, 1 - dist / 25);

        positions.push({
          x: screenX,
          y: screenY,
          visible:
            !isBehindCamera &&
            screenX > 10 &&
            screenX < SCREEN_WIDTH - 10 &&
            screenY > 10 &&
            screenY < SCREEN_HEIGHT - 10,
          name: contact.name,
          isOverflow: contact.isOverflow,
          isSelected: selectedContact?.id === contact.id,
          opacity,
          health: contact.health,
        });
      });

      if (isMountedRef.current) {
        setLabelPositions(positions);
      }
    },
    [selectedContact]
  );

  // Touch handlers
  const handleTouchStart = e => {
    touchControllerRef.current?.handleTouchStart(e.nativeEvent.touches);
  };

  const handleTouchMove = e => {
    touchControllerRef.current?.handleTouchMove(e.nativeEvent.touches);
  };

  const handleTouchEnd = e => {
    touchControllerRef.current?.handleTouchEnd(e.nativeEvent.touches);
  };

  const handleTouchCancel = () => {
    touchControllerRef.current?.handleTouchCancel();
  };

  return (
    <View style={[styles.container, style]}>
      <GLView
        style={styles.glView}
        onContextCreate={onContextCreate}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
      />

      {/* Contact labels overlay */}
      {labelPositions.map((pos, i) =>
        pos.visible && !pos.isOverflow ? (
          <View
            key={i}
            style={[
              styles.label,
              {
                left: pos.x - 45,
                top: pos.y + 22,
                opacity: pos.opacity,
              },
              pos.isSelected && styles.labelSelected,
            ]}
            pointerEvents="none"
          >
            <Text style={[styles.labelText, pos.isSelected && styles.labelTextSelected]} numberOfLines={1}>
              {pos.name?.split(' ')[0] || 'Unknown'}
            </Text>
          </View>
        ) : null
      )}

      {/* Supernova flash overlay */}
      {flashOpacity > 0 && (
        <View
          style={[styles.supernovaFlash, { opacity: flashOpacity * 0.7 }]}
          pointerEvents="none"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020208',
  },
  glView: {
    flex: 1,
  },
  label: {
    position: 'absolute',
    width: 90,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  labelSelected: {
    backgroundColor: 'rgba(79, 255, 176, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(79, 255, 176, 0.4)',
  },
  labelText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  labelTextSelected: {
    color: '#4FFFB0',
    fontWeight: '600',
  },
  supernovaFlash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ffffff',
  },
});
