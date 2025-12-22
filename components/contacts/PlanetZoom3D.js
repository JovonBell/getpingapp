import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Modal, PanResponder, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';
import { Ionicons } from '@expo/vector-icons';
import { HealthBadge } from './HealthIndicator';
import { getHealthColor } from '../../utils/scoring/healthScoring';
import { SwipeHint, useGestureHint } from '../common/GestureHint';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Define colors outside component to prevent recreation on every render
const CONTACT_COLORS = ['#4FFFB0', '#ffaa00', '#ff6b6b', '#4ecdc4'];

export default function PlanetZoom3D({
  onClose,
  // swipeable items (contacts). If omitted, we fall back to a single planet.
  items = [],
  initialIndex = 0,
  onMoreInfo,
  onMessage,
  onHealthChange, // Callback when health is manually updated: (contact, newScore) => void
  onSetReminder, // Callback when user wants to set a reminder for a contact: (contact) => void
  onEditContact, // Callback when user wants to edit contact details: (contact) => void
  onJustTalked, // Callback when user marks "Just Talked" - resets health to 100%
  circleName, // Name of the circle for breadcrumb context
}) {
  // Note: Parent controls visibility by conditionally rendering this component
  const normalizedItems = useMemo(() => {
    if (items && items.length > 0) return items;
    return [{ id: 'nucleus', name: 'ping!', initials: 'P', color: CONTACT_COLORS[0] }];
  }, [items]);

  const [currentIndex, setCurrentIndex] = useState(Math.max(0, Math.min(initialIndex, normalizedItems.length - 1)));
  const [displayIndex, setDisplayIndex] = useState(Math.max(0, Math.min(initialIndex, normalizedItems.length - 1)));
  const displayIndexRef = useRef(Math.max(0, Math.min(initialIndex, normalizedItems.length - 1)));

  // More info popup state
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  const moreInfoAnim = useRef(new Animated.Value(0)).current;

  // Health slider state - tracks the current slider value for the displayed contact
  const [sliderValue, setSliderValue] = useState(100);
  const [isSliding, setIsSliding] = useState(false);
  const sliderValueRef = useRef(100); // Ref for 3D render loop to access current slider value

  // Gesture hint for first-time users
  const { shouldShowHint: showSwipeHint, markHintSeen: dismissSwipeHint } = useGestureHint('planet_swipe');

  const stateRef = useRef({
    raf: null,
    cleanup: null,
    closeTimer: null,
    currentAngle: 0,
    targetAngle: 0,
    gestureStartAngle: 0,
  });

  // Track if component is mounted - CRITICAL for preventing dead screen
  const isMountedRef = useRef(true);

  // Setup effect - only runs when component mounts
  useEffect(() => {
    isMountedRef.current = true;
    
    const startIndex = Math.max(0, Math.min(initialIndex, normalizedItems.length - 1));
    setCurrentIndex(startIndex);
    setDisplayIndex(startIndex);
    displayIndexRef.current = startIndex;
    
    // Sync angle on open
    const a = (2 * Math.PI * startIndex) / Math.max(1, normalizedItems.length);
    stateRef.current.currentAngle = a;
    stateRef.current.targetAngle = a;

    // Reset more info popup on open
    setShowMoreInfo(false);
    moreInfoAnim.setValue(0);
    
    console.log('[PlanetZoom3D] Mounted with index:', startIndex);
    
    // Cleanup when unmounting - CRITICAL
    return () => {
      console.log('[PlanetZoom3D] Unmounting - setting isMounted to false');
      isMountedRef.current = false;
      if (stateRef.current.raf) {
        cancelAnimationFrame(stateRef.current.raf);
        stateRef.current.raf = null;
      }
      if (stateRef.current.closeTimer) {
        clearTimeout(stateRef.current.closeTimer);
        stateRef.current.closeTimer = null;
      }
      stateRef.current.cleanup?.();
      stateRef.current.cleanup = null;
    };
  }, [initialIndex, normalizedItems.length, moreInfoAnim]);

  useEffect(() => {
    if (!isMountedRef.current) return;
    // When index changes, set a new target angle
    const a = (2 * Math.PI * currentIndex) / Math.max(1, normalizedItems.length);
    stateRef.current.targetAngle = a;
    setDisplayIndex(currentIndex);
    displayIndexRef.current = currentIndex;
  }, [currentIndex, normalizedItems.length]);

  // Sync slider value when displayed contact changes
  useEffect(() => {
    if (!isMountedRef.current) return;
    const item = normalizedItems[displayIndex];
    if (item && item.healthScore !== undefined) {
      setSliderValue(item.healthScore);
      sliderValueRef.current = item.healthScore;
    } else {
      setSliderValue(100); // Default to healthy
      sliderValueRef.current = 100;
    }
  }, [displayIndex, normalizedItems]);

  const onContextCreate = async (gl) => {
    const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;

    const renderer = new Renderer({ gl });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 1);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.06);

    // Slightly wider FOV so it feels iOS-like; we fit by limiting FOV below
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 0.8, 6.5);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.45));
    const key = new THREE.DirectionalLight(0xffffff, 1.25);
    key.position.set(3, 2, 6);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x4fffb0, 0.9);
    rim.position.set(-4, -1, 3);
    scene.add(rim);

    // Stars
    const starCount = 1200;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      starPositions[i3 + 0] = (Math.random() - 0.5) * 60;
      starPositions[i3 + 1] = (Math.random() - 0.5) * 60;
      starPositions[i3 + 2] = -Math.random() * 80;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      size: 0.08,
      color: 0xffffff,
      transparent: true,
      opacity: 0.6,
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // Orbit ring (matches 2D home) - for camera path reference
    const orbitRingMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#4FFFB0'),
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
    });
    const ORBIT_RADIUS = 4.6;
    const orbitRingGeo = new THREE.RingGeometry(ORBIT_RADIUS, ORBIT_RADIUS + 0.012, 256);
    const orbitRing = new THREE.Mesh(orbitRingGeo, orbitRingMat);
    orbitRing.rotation.x = Math.PI / 2;
    orbitRing.position.y = -0.15;
    scene.add(orbitRing);

    // Focus planet (large sphere you fly into) – we reuse a single “hero” planet at origin,
    // and when zooming, we smoothly match it to the selected planet’s look.
    // NOTE: make the focused sphere smaller so the full sphere is always visible (no edge cutoffs).
    const HERO_RADIUS = 0.55;
    const heroGeo = new THREE.SphereGeometry(HERO_RADIUS, 96, 96);
    const heroMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#4FFFB0'),
      emissive: new THREE.Color('#0a2e1a'),
      emissiveIntensity: 0.35,
      metalness: 0.18,
      roughness: 0.35,
    });
    const hero = new THREE.Mesh(heroGeo, heroMat);
    hero.visible = true;
    scene.add(hero);

    const heroGlowGeo = new THREE.SphereGeometry(HERO_RADIUS * 1.06, 64, 64);
    const heroGlowMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#4FFFB0'),
      transparent: true,
      opacity: 0.10,
    });
    const heroGlow = new THREE.Mesh(heroGlowGeo, heroGlowMat);
    heroGlow.visible = true;
    scene.add(heroGlow);

    // Camera direction (slightly above/right like iOS)
    const flyDir = new THREE.Vector3(0.7, 0.28, 1.0).normalize();

    const distanceToFitSphere = (radius) => {
      // Fit sphere within BOTH vertical and horizontal FOV (portrait devices have tight horizontal FOV).
      const fovY = (camera.fov * Math.PI) / 180;
      const fovX = 2 * Math.atan(Math.tan(fovY / 2) * camera.aspect);
      const limitingFov = Math.min(fovX, fovY);
      const d = radius / Math.tan(limitingFov / 2);
      return d * 1.9; // strong margin so the whole sphere is always visible
    };

    const tick = () => {
      // CRITICAL: Stop animation loop if component unmounted
      if (!isMountedRef.current) {
        console.log('[PlanetZoom3D] tick stopped - component unmounted');
        return;
      }

      // Star drift
      stars.rotation.y += 0.0008;

      const s = stateRef.current;
      // Smoothly approach the target angle (shortest path)
      const TWO_PI = Math.PI * 2;
      const current = s.currentAngle;
      let target = s.targetAngle;
      let delta = ((target - current + Math.PI) % TWO_PI) - Math.PI;
      s.currentAngle = current + delta * 0.08;

      // Update display index based on current angle so info/color updates WHILE swiping
      const len = Math.max(1, normalizedItems.length);
      const angleNorm = ((s.currentAngle % TWO_PI) + TWO_PI) % TWO_PI;
      const idxFromAngle = Math.round((angleNorm / TWO_PI) * len) % len;
      if (idxFromAngle !== displayIndexRef.current && isMountedRef.current) {
        displayIndexRef.current = idxFromAngle;
        setDisplayIndex(idxFromAngle);
      }

      // Place sphere on a circular orbit and move camera with it
      const angle = s.currentAngle;
      const targetPos = new THREE.Vector3(
        Math.cos(angle) * ORBIT_RADIUS,
        0,
        Math.sin(angle) * ORBIT_RADIUS
      );

      // Update color from currently displayed item's HEALTH (uses ref for real-time slider updates)
      const item = normalizedItems[displayIndexRef.current] || normalizedItems[0];
      // Use sliderValueRef for real-time color updates when sliding
      const healthScore = sliderValueRef.current ?? item?.healthScore ?? 100;
      const healthStatus = healthScore >= 80 ? 'healthy' : healthScore >= 60 ? 'cooling' : healthScore >= 40 ? 'at_risk' : 'cold';
      const color = getHealthColor(healthStatus);
      heroMat.color.set(new THREE.Color(color));
      heroGlowMat.color.set(new THREE.Color(color));
      orbitRingMat.color.set(new THREE.Color(color));

      // Add subtle floating animation for more "3D-ish" feel
      const floatTime = Date.now() * 0.001;
      const floatY = Math.sin(floatTime * 0.5) * 0.08;
      const floatX = Math.cos(floatTime * 0.3) * 0.04;

      hero.position.copy(targetPos);
      hero.position.y += floatY;
      hero.position.x += floatX;
      heroGlow.position.copy(hero.position);

      // Keep full sphere visible and move camera with the swipe
      const dist = distanceToFitSphere(HERO_RADIUS);
      const camPos = new THREE.Vector3().copy(targetPos).addScaledVector(flyDir, dist);
      camera.position.lerp(camPos, 0.25);
      camera.lookAt(targetPos);

      // Rotate sphere for subtle life
      hero.rotation.y += 0.006;
      hero.rotation.x += 0.0012;

      renderer.render(scene, camera);
      gl.endFrameEXP();
      
      // Only continue loop if still mounted
      if (isMountedRef.current) {
        s.raf = requestAnimationFrame(tick);
      }
    };

    tick();

    stateRef.current.cleanup = () => {
      if (stateRef.current.raf) cancelAnimationFrame(stateRef.current.raf);
      heroGeo.dispose();
      heroMat.dispose();
      heroGlowGeo.dispose();
      heroGlowMat.dispose();
      orbitRingGeo.dispose();
      orbitRingMat.dispose();
      starGeo.dispose();
      starMat.dispose();
      renderer.dispose?.();
    };
  };

  const requestClose = () => {
    // Close immediately (per UX request). We still set targetZoom=0 so the next open starts clean.
    const s = stateRef.current;
    s.targetZoom = 0;
    if (s.closeTimer) clearTimeout(s.closeTimer);
    onClose?.();
  };

  const panResponder = useMemo(() => {
    const SWIPE_THRESHOLD = 30;
    return PanResponder.create({
      // CRITICAL: Do NOT use capture - it blocks all other touch handlers
      // Only become responder through normal negotiation
      onStartShouldSetPanResponder: () => isMountedRef.current,
      onMoveShouldSetPanResponder: (_evt, gesture) => {
        // Only claim horizontal swipes, let vertical gestures through
        if (!isMountedRef.current) return false;
        const isHorizontalSwipe = Math.abs(gesture.dx) > 8 && Math.abs(gesture.dy) < 30;
        return isHorizontalSwipe;
      },
      // REMOVED: onMoveShouldSetPanResponderCapture - this was blocking ALL touches
      onPanResponderGrant: () => {
        if (!isMountedRef.current) return;
        stateRef.current.gestureStartAngle = stateRef.current.targetAngle;
      },
      onPanResponderMove: (_evt, gesture) => {
        if (!isMountedRef.current) return;
        const len = Math.max(1, normalizedItems.length);
        if (len <= 1) return;
        const step = (Math.PI * 2) / len;
        const sensitivity = 1.15;
        const delta = (-gesture.dx / Math.max(1, SCREEN_WIDTH)) * step * sensitivity;
        stateRef.current.targetAngle = stateRef.current.gestureStartAngle + delta;
      },
      onPanResponderRelease: (_evt, gesture) => {
        if (!isMountedRef.current) return;
        const len = Math.max(1, normalizedItems.length);
        if (len <= 1) return;

        const moved = Math.abs(gesture.dx) >= SWIPE_THRESHOLD;
        const TWO_PI = Math.PI * 2;
        const target = stateRef.current.targetAngle;
        const angleNorm = ((target % TWO_PI) + TWO_PI) % TWO_PI;
        const nearest = Math.round((angleNorm / TWO_PI) * len) % len;
        const finalIndex = moved ? nearest : currentIndex;

        setCurrentIndex(finalIndex);
        stateRef.current.targetAngle = (TWO_PI * finalIndex) / len;
      },
      onPanResponderTerminate: () => {
        // Responder was taken away - reset any gesture state
        console.log('[PlanetZoom3D] PanResponder terminated - resetting state');
        if (isMountedRef.current) {
          // Snap back to current index on termination
          const len = Math.max(1, normalizedItems.length);
          stateRef.current.targetAngle = (Math.PI * 2 * currentIndex) / len;
        }
      },
    });
  }, [normalizedItems.length, currentIndex]);

  const activeItem = normalizedItems[displayIndex] || normalizedItems[0];

  // Calculate days since last contact
  const getDaysSinceContact = (item) => {
    if (!item?.lastInteractionDate) return null;
    const lastDate = new Date(item.lastInteractionDate);
    const today = new Date();
    const diffTime = Math.abs(today - lastDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysSinceContact = getDaysSinceContact(activeItem);

  // Get health status label
  const getHealthStatusLabel = (score) => {
    if (score >= 80) return 'Healthy';
    if (score >= 60) return 'Cooling';
    if (score >= 40) return 'At Risk';
    return 'Cold';
  };

  // Handle "Just Talked" action - resets health to 100%
  const handleJustTalked = () => {
    if (activeItem && onHealthChange) {
      onHealthChange(activeItem, 100);
      setSliderValue(100);
    }
    // Also call onJustTalked callback if provided (for logging interaction)
    if (onJustTalked && activeItem) {
      onJustTalked(activeItem);
    }
  };

  const handleMoreInfoPress = () => {
    if (showMoreInfo) {
      // Close the popup
      Animated.timing(moreInfoAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setShowMoreInfo(false));
    } else {
      // Open the popup
      setShowMoreInfo(true);
      Animated.spring(moreInfoAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    }
  };

  return (
    <Modal 
      visible={true}
      transparent={false} 
      animationType="slide" 
      onRequestClose={requestClose}
    >
      <View style={styles.container}>
        <GLView style={styles.glFull} onContextCreate={onContextCreate} pointerEvents="none" />

        {/* Gesture layer */}
        <View style={styles.gestureLayer} pointerEvents="box-none">
          <View
            style={styles.gestureHitbox}
            pointerEvents="auto"
            {...panResponder.panHandlers}
          />

          {/* First-time user gesture hint */}
          {normalizedItems.length > 1 && (
            <SwipeHint visible={showSwipeHint} onDismiss={dismissSwipeHint} />
          )}

          {/* Info popup (top-right) - Enhanced with surfaced health controls */}
          <View style={styles.topRightCard} pointerEvents="auto">
            {/* Breadcrumb navigation context */}
            {circleName && (
              <View style={styles.breadcrumb}>
                <Text style={styles.breadcrumbText}>Circles</Text>
                <Ionicons name="chevron-forward" size={12} color="#666" />
                <Text style={styles.breadcrumbCircle}>{circleName}</Text>
              </View>
            )}

            {/* Header: Avatar + Name + Close */}
            <View style={styles.cardHeaderRow}>
              <TouchableOpacity
                style={[styles.avatarPlaceholder, { borderColor: activeItem?.color || '#4FFFB0' }]}
                onPress={handleMoreInfoPress}
                activeOpacity={0.7}
              >
                {!!activeItem?.initials && <Text style={styles.avatarText}>{activeItem.initials}</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cardHeaderText}
                onPress={handleMoreInfoPress}
                activeOpacity={0.7}
              >
                <Text style={styles.title} numberOfLines={1}>{activeItem?.name || 'Contact'}</Text>
                {activeItem?.jobTitle && (
                  <Text style={styles.subtitle} numberOfLines={1}>{activeItem.jobTitle}</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.closePill} onPress={requestClose} activeOpacity={0.85}>
                <Text style={styles.closePillTxt}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Health Status Section - Surfaced from "More Info" */}
            {activeItem?.healthScore !== undefined && (
              <View style={styles.healthSection}>
                <View style={styles.healthHeader}>
                  <Text style={[styles.healthStatus, { color: getHealthColor(sliderValue >= 80 ? 'healthy' : sliderValue >= 60 ? 'cooling' : sliderValue >= 40 ? 'at_risk' : 'cold') }]}>
                    {getHealthStatusLabel(sliderValue)}
                  </Text>
                  <Text style={styles.healthPercent}>{Math.round(sliderValue)}%</Text>
                </View>
                {/* Mini health bar */}
                <View style={styles.healthBarContainer}>
                  <View style={[styles.healthBarFill, {
                    width: `${sliderValue}%`,
                    backgroundColor: getHealthColor(sliderValue >= 80 ? 'healthy' : sliderValue >= 60 ? 'cooling' : sliderValue >= 40 ? 'at_risk' : 'cold')
                  }]} />
                </View>
                {/* Last contact info */}
                {daysSinceContact !== null && (
                  <Text style={styles.lastContact}>
                    Last contact {daysSinceContact === 0 ? 'today' : daysSinceContact === 1 ? 'yesterday' : `${daysSinceContact} days ago`}
                  </Text>
                )}
              </View>
            )}

            {/* Swipe hint */}
            <Text style={styles.sub} numberOfLines={1}>
              ← Swipe to explore →
            </Text>

            {/* Action Buttons Row - Message, More */}
            <View style={styles.cardActionsRow}>
              <TouchableOpacity style={styles.actionBtnPrimary} onPress={() => onMessage?.(activeItem)} activeOpacity={0.85}>
                <Ionicons name="chatbubble" size={16} color="#000" />
                <Text style={styles.actionBtnPrimaryTxt}>Message</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtnSecondary} onPress={handleMoreInfoPress} activeOpacity={0.85}>
                <Ionicons name="ellipsis-horizontal" size={16} color="#4FFFB0" />
                <Text style={styles.actionBtnSecondaryTxt}>More</Text>
              </TouchableOpacity>
            </View>

            {/* Remind Button - Full width below */}
            <TouchableOpacity 
              style={styles.remindBtnFull} 
              onPress={() => {
                console.log('[PlanetZoom3D] Remind button pressed for:', activeItem?.name);
                if (onSetReminder && activeItem) {
                  onSetReminder(activeItem);
                }
              }} 
              activeOpacity={0.85}
            >
              <Ionicons name="alarm-outline" size={16} color="#4FFFB0" />
              <Text style={styles.remindBtnFullTxt}>Set Reminder</Text>
            </TouchableOpacity>
          </View>

          {/* More Info Popup - wide rectangle at bottom */}
          {showMoreInfo && (
            <Animated.View
              style={[
                styles.moreInfoPopup,
                {
                  transform: [{
                    translateY: moreInfoAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [300, 0],
                    }),
                  }],
                  opacity: moreInfoAnim,
                },
              ]}
              pointerEvents="auto"
            >
              <TouchableOpacity
                style={styles.closeMoreInfo}
                onPress={handleMoreInfoPress}
              >
                <Ionicons name="close" size={24} color="#ffffff" />
              </TouchableOpacity>

              <Text style={styles.moreInfoName}>{activeItem?.name || 'Contact'}</Text>

              {/* Health Slider Section */}
              <View style={styles.healthSliderSection}>
                <View style={styles.healthSliderHeader}>
                  <Ionicons name="heart" size={18} color={getHealthColor(sliderValue >= 80 ? 'healthy' : sliderValue >= 60 ? 'cooling' : sliderValue >= 40 ? 'at_risk' : 'cold')} />
                  <Text style={styles.healthSliderLabel}>Relationship Health</Text>
                  <Text style={[styles.healthSliderValue, { color: getHealthColor(sliderValue >= 80 ? 'healthy' : sliderValue >= 60 ? 'cooling' : sliderValue >= 40 ? 'at_risk' : 'cold') }]}>
                    {Math.round(sliderValue)}%
                  </Text>
                </View>
                <Slider
                  style={styles.healthSlider}
                  minimumValue={0}
                  maximumValue={100}
                  step={1}
                  value={sliderValue}
                  onValueChange={(val) => {
                    setSliderValue(val);
                    sliderValueRef.current = val; // Update ref for real-time 3D color
                    setIsSliding(true);
                  }}
                  onSlidingComplete={(val) => {
                    setIsSliding(false);
                    setSliderValue(val);
                    sliderValueRef.current = val; // Update ref for 3D color
                    // Call the callback to update health in database
                    if (onHealthChange && activeItem) {
                      onHealthChange(activeItem, val);
                    }
                  }}
                  minimumTrackTintColor={getHealthColor(sliderValue >= 80 ? 'healthy' : sliderValue >= 60 ? 'cooling' : sliderValue >= 40 ? 'at_risk' : 'cold')}
                  maximumTrackTintColor="rgba(255,255,255,0.2)"
                  thumbTintColor="#ffffff"
                />
                <View style={styles.healthSliderLabels}>
                  <Text style={styles.healthSliderMinMax}>Cold</Text>
                  <Text style={styles.healthSliderMinMax}>Healthy</Text>
                </View>
              </View>

              {activeItem?.jobTitle && (
                <View style={styles.moreInfoRow}>
                  <Ionicons name="briefcase-outline" size={18} color="#4FFFB0" />
                  <Text style={styles.moreInfoText}>{activeItem.jobTitle}</Text>
                </View>
              )}

              {activeItem?.location && (
                <View style={styles.moreInfoRow}>
                  <Ionicons name="location-outline" size={18} color="#4FFFB0" />
                  <Text style={styles.moreInfoText}>{activeItem.location}</Text>
                </View>
              )}

              {activeItem?.bio && (
                <View style={styles.moreInfoRow}>
                  <Ionicons name="chatbox-outline" size={18} color="#4FFFB0" />
                  <Text style={styles.moreInfoText}>{activeItem.bio}</Text>
                </View>
              )}

              {/* How We Met */}
              {activeItem?.howWeMet && (
                <View style={styles.moreInfoRow}>
                  <Ionicons name="people-outline" size={18} color="#4FFFB0" />
                  <Text style={styles.moreInfoText}>Met: {activeItem.howWeMet}</Text>
                </View>
              )}

              {/* Tags */}
              {activeItem?.tags && activeItem.tags.length > 0 && (
                <View style={styles.tagsRow}>
                  {activeItem.tags.slice(0, 4).map((tag, idx) => (
                    <View key={idx} style={styles.tagBadge}>
                      <Text style={styles.tagBadgeText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Notes Preview */}
              {activeItem?.notes && (
                <View style={styles.notesPreview}>
                  <Ionicons name="document-text-outline" size={14} color="#888888" />
                  <Text style={styles.notesPreviewText} numberOfLines={2}>
                    {activeItem.notes}
                  </Text>
                </View>
              )}

              {/* Action Buttons Row */}
              {activeItem?.id && activeItem.id !== 'nucleus' && (
                <View style={styles.actionButtonsRow}>
                  {/* Set Reminder Button */}
                  <TouchableOpacity
                    style={styles.setReminderBtn}
                    onPress={() => {
                      handleMoreInfoPress(); // Close popup first
                      onSetReminder?.(activeItem);
                    }}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="calendar-outline" size={18} color="#000000" />
                    <Text style={styles.setReminderTxt}>Reminder</Text>
                  </TouchableOpacity>

                  {/* Edit Contact Button */}
                  <TouchableOpacity
                    style={styles.editContactBtn}
                    onPress={() => {
                      handleMoreInfoPress(); // Close popup first
                      onEditContact?.(activeItem);
                    }}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="create-outline" size={18} color="#4FFFB0" />
                    <Text style={styles.editContactTxt}>Edit</Text>
                  </TouchableOpacity>
                </View>
              )}
          </Animated.View>
        )}
      </View>
    </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  glFull: { ...StyleSheet.absoluteFillObject },
  gestureLayer: { ...StyleSheet.absoluteFillObject },
  gestureHitbox: { ...StyleSheet.absoluteFillObject },

  topRightCard: {
    position: 'absolute',
    right: 14,
    top: 54,
    width: 220,
    backgroundColor: 'rgba(10, 26, 10, 0.92)',
    borderWidth: 2,
    borderColor: '#4FFFB0',
    borderRadius: 16,
    padding: 12,
    zIndex: 50,
  },

  // Breadcrumb styles
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 4,
  },
  breadcrumbText: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },
  breadcrumbCircle: {
    fontSize: 10,
    color: '#4FFFB0',
    fontWeight: '600',
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#4FFFB0',
    backgroundColor: 'rgba(79, 255, 176, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
  cardHeaderText: { flex: 1 },
  logoText: { color: '#ffffff', fontSize: 16, fontWeight: '900' },
  title: { color: '#fff', fontSize: 14, fontWeight: '800' },
  subtitle: { color: '#999', fontSize: 11, marginTop: 2 },
  healthBadgeRow: { marginTop: 4 },
  sub: { color: '#888', fontSize: 11, textAlign: 'center', marginTop: 6, marginBottom: 2 },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },

  // Action Buttons Row - Message, More, Remind
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  actionBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#4FFFB0',
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionBtnPrimaryTxt: {
    color: '#000',
    fontWeight: '700',
    fontSize: 12,
  },
  actionBtnSecondary: {
    flex: 0.7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(79, 255, 176, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(79, 255, 176, 0.4)',
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionBtnSecondaryTxt: {
    color: '#4FFFB0',
    fontWeight: '600',
    fontSize: 11,
  },
  // Full-width Remind button below Message/More row
  remindBtnFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(79, 255, 176, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(79, 255, 176, 0.3)',
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 8,
  },
  remindBtnFullTxt: {
    color: '#4FFFB0',
    fontWeight: '600',
    fontSize: 12,
  },

  // Health Section Styles (surfaced controls)
  healthSection: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    marginBottom: 4,
  },
  healthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  healthStatus: {
    fontSize: 13,
    fontWeight: '700',
  },
  healthPercent: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  healthBarContainer: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  healthBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  lastContact: {
    fontSize: 10,
    color: '#888',
    marginTop: 6,
    fontStyle: 'italic',
  },

  // Just Talked Button
  justTalkedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(79, 255, 176, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(79, 255, 176, 0.5)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  justTalkedTxt: {
    color: '#4FFFB0',
    fontWeight: '700',
    fontSize: 12,
  },

  // Secondary Actions Row
  cardActionsSecondary: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 8,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  secondaryBtnTxt: {
    color: '#4FFFB0',
    fontSize: 11,
    fontWeight: '600',
  },
  messageBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#4FFFB0',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageTxt: { color: '#000', fontWeight: '700', fontSize: 12 },
  moreBtn: {
    width: 64,
    backgroundColor: 'rgba(79, 255, 176, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(79, 255, 176, 0.6)',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  moreTxt: { color: '#4FFFB0', fontWeight: '900' },
  closePill: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(79, 255, 176, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  closePillTxt: { color: '#4FFFB0', fontSize: 16, fontWeight: '900' },

  // More Info Popup Styles
  moreInfoPopup: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(26, 42, 26, 0.98)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#4FFFB0',
    padding: 20,
    shadowColor: '#4FFFB0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 20,
    zIndex: 100,
  },
  closeMoreInfo: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreInfoName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  moreInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  moreInfoText: {
    fontSize: 15,
    color: '#ffffff',
    flex: 1,
  },
  moreInfoEmpty: {
    fontSize: 14,
    color: '#999999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },

  // Health Slider Styles
  healthSliderSection: {
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(79, 255, 176, 0.2)',
  },
  healthSliderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  healthSliderLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  healthSliderValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  healthSlider: {
    width: '100%',
    height: 40,
  },
  healthSliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  healthSliderMinMax: {
    fontSize: 11,
    color: '#888888',
  },

  // Tags display
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  tagBadge: {
    backgroundColor: 'rgba(79, 255, 176, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(79, 255, 176, 0.3)',
  },
  tagBadgeText: {
    fontSize: 11,
    color: '#4FFFB0',
    fontWeight: '500',
  },

  // Notes preview
  notesPreview: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  notesPreviewText: {
    flex: 1,
    fontSize: 12,
    color: '#888888',
    fontStyle: 'italic',
    lineHeight: 16,
  },

  // Action Buttons Row
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },

  // Set Reminder Button
  setReminderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#4FFFB0',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  setReminderTxt: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000000',
  },

  // Edit Contact Button
  editContactBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(79, 255, 176, 0.15)',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(79, 255, 176, 0.4)',
  },
  editContactTxt: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4FFFB0',
  },
});


