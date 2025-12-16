import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Modal, PanResponder, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function PlanetZoom3D({
  visible,
  onClose,
  // swipeable items (contacts). If omitted, we fall back to a single planet.
  items = [],
  initialIndex = 0,
  onMoreInfo,
  onMessage,
}) {
  const normalizedItems = useMemo(() => {
    if (items && items.length > 0) return items;
    return [{ id: 'nucleus', name: 'ping!', initials: 'P', color: '#4FFFB0' }];
  }, [items]);

  const [currentIndex, setCurrentIndex] = useState(Math.max(0, Math.min(initialIndex, normalizedItems.length - 1)));
  const [displayIndex, setDisplayIndex] = useState(Math.max(0, Math.min(initialIndex, normalizedItems.length - 1)));
  const displayIndexRef = useRef(Math.max(0, Math.min(initialIndex, normalizedItems.length - 1)));

  // More info popup state
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  const moreInfoAnim = useRef(new Animated.Value(0)).current;

  const stateRef = useRef({
    raf: null,
    cleanup: null,
    closeTimer: null,
    currentAngle: 0,
    targetAngle: 0,
    gestureStartAngle: 0,
  });

  useEffect(() => {
    if (visible) {
      // When modal opens, use the initialIndex prop to set the correct starting contact
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
    } else {
      // Cleanup when modal closes to prevent dead screen
      console.log('[PlanetZoom3D] Modal closing, cleaning up...');
      setShowMoreInfo(false);
      moreInfoAnim.setValue(0);
      
      // Small delay to ensure modal is fully dismissed before cleanup
      const cleanupTimer = setTimeout(() => {
        console.log('[PlanetZoom3D] Cleanup complete');
      }, 100);
      
      return () => clearTimeout(cleanupTimer);
    }
  }, [visible, initialIndex, normalizedItems.length, moreInfoAnim]);

  useEffect(() => {
    // When index changes, set a new target angle
    const a = (2 * Math.PI * currentIndex) / Math.max(1, normalizedItems.length);
    stateRef.current.targetAngle = a;
    setDisplayIndex(currentIndex);
    displayIndexRef.current = currentIndex;
  }, [currentIndex, normalizedItems.length]);

  useEffect(() => {
    return () => {
      if (stateRef.current.closeTimer) clearTimeout(stateRef.current.closeTimer);
      stateRef.current.cleanup?.();
    };
  }, []);

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
      if (idxFromAngle !== displayIndexRef.current) {
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

      // Update color from currently displayed item (mirrors swipe)
      const item = normalizedItems[displayIndexRef.current] || normalizedItems[0];
      const color = item?.color || '#4FFFB0';
      heroMat.color.set(new THREE.Color(color));
      heroGlowMat.color.set(new THREE.Color(color));
      orbitRingMat.color.set(new THREE.Color(color));

      hero.position.copy(targetPos);
      heroGlow.position.copy(targetPos);

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
      s.raf = requestAnimationFrame(tick);
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
      onStartShouldSetPanResponder: () => visible, // Only capture when modal is visible
      onMoveShouldSetPanResponder: (_evt, gesture) => visible && Math.abs(gesture.dx) > 2 && Math.abs(gesture.dy) < 40,
      onMoveShouldSetPanResponderCapture: (_evt, gesture) => visible && Math.abs(gesture.dx) > 2 && Math.abs(gesture.dy) < 40,
      onPanResponderGrant: () => {
        if (!visible) return;
        stateRef.current.gestureStartAngle = stateRef.current.targetAngle;
      },
      onPanResponderMove: (_evt, gesture) => {
        if (!visible) return;
        const len = Math.max(1, normalizedItems.length);
        if (len <= 1) return;
        const step = (Math.PI * 2) / len;
        const sensitivity = 1.15;
        const delta = (-gesture.dx / Math.max(1, SCREEN_WIDTH)) * step * sensitivity;
        stateRef.current.targetAngle = stateRef.current.gestureStartAngle + delta;
      },
      onPanResponderRelease: (_evt, gesture) => {
        if (!visible) return;
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
      onPanResponderTerminationRequest: () => true, // Allow termination
      onPanResponderTerminate: () => {
        // Forced termination - clean up
        console.log('[PlanetZoom3D] PanResponder terminated');
      },
    });
  }, [normalizedItems.length, currentIndex, visible]);

  const activeItem = normalizedItems[displayIndex] || normalizedItems[0];

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
      visible={visible} 
      transparent={false} 
      animationType="slide" 
      onRequestClose={requestClose}
      onDismiss={() => {
        console.log('[PlanetZoom3D] Modal dismissed');
      }}
    >
      <View style={styles.container}>
        {/* GLView can swallow touches; disable pointer events and handle gestures on an overlay */}
        <GLView style={styles.glFull} onContextCreate={onContextCreate} pointerEvents="none" />

        {/* Gesture layer - only active when modal is visible */}
        <View style={styles.gestureLayer} pointerEvents="box-none">
          <View 
            style={styles.gestureHitbox} 
            pointerEvents={visible ? "auto" : "none"} 
            {...(visible ? panResponder.panHandlers : {})}
          />

          {/* Info popup (top-right) */}
          <View style={styles.topRightCard} pointerEvents="auto">
            <View style={styles.cardHeaderRow}>
              <View style={styles.avatarPlaceholder}>
                {!!activeItem?.initials && <Text style={styles.avatarText}>{activeItem.initials}</Text>}
              </View>
              <View style={styles.cardHeaderText}>
                <Text style={styles.title} numberOfLines={1}>{activeItem?.name || 'Contact'}</Text>
              </View>
            </View>

            <Text style={styles.sub} numberOfLines={2}>
              Swipe left/right to explore
            </Text>

            <View style={styles.cardActions}>
              <TouchableOpacity style={styles.messageBtn} onPress={() => onMessage?.(activeItem)} activeOpacity={0.85}>
                <Text style={styles.messageTxt}>Message</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.moreBtn} onPress={handleMoreInfoPress} activeOpacity={0.85}>
                <Text style={styles.moreTxt}>More</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closePill} onPress={requestClose} activeOpacity={0.85}>
                <Text style={styles.closePillTxt}>✕</Text>
              </TouchableOpacity>
            </View>
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
              
              {!activeItem?.jobTitle && !activeItem?.location && !activeItem?.bio && (
                <Text style={styles.moreInfoEmpty}>No additional information available</Text>
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
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
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
  title: { color: '#fff', fontSize: 13, fontWeight: '800', marginTop: 4 },
  sub: { color: '#cfcfcf', fontSize: 12, lineHeight: 16, marginTop: 10 },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  messageBtn: {
    flex: 1,
    backgroundColor: '#4FFFB0',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  messageTxt: { color: '#000', fontWeight: '900' },
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
});


