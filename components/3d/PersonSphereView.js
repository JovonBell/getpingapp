/**
 * PersonSphereView - 3D Contact Focus View
 * 
 * Shows a person as a floating 3D sphere with:
 * - Photo texture mapped onto sphere surface
 * - Data orbs orbiting (LinkedIn, Calendar, Twitter)
 * - Health indicator glow at base
 * - Glass-morphism floating UI
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { GLView } from 'expo-gl';
import { Renderer, TextureLoader } from 'expo-three';
import * as THREE from 'three';
import { Ionicons } from '@expo/vector-icons';
import { TouchController } from './TouchController';
import { createSimpleStarField } from './StarField';
import { getHealthColor } from '../../utils/scoring/healthScoring';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Sphere configuration
const SPHERE_CONFIG = {
  radius: 1.5,
  segments: 32,
  rotationSpeed: 0.002, // Slow rotation
  floatSpeed: 0.001,
  floatAmount: 0.1,
};

// Data orb configuration
const DATA_ORB_CONFIG = {
  radius: 0.2,
  orbitRadius: 2.5,
  orbitSpeed: 0.01,
  sources: [
    { type: 'linkedin', color: 0x0A66C2, angle: 0 },
    { type: 'calendar', color: 0x4285F4, angle: Math.PI * 0.66 },
    { type: 'twitter', color: 0x1DA1F2, angle: Math.PI * 1.33 },
  ],
};

export default function PersonSphereView({
  contact,
  healthData,
  dataSources = [],
  onClose,
  onMessage,
  onVideoCall,
  onVoiceCall,
  onDataOrbTap,
  style,
}) {
  const [selectedOrb, setSelectedOrb] = useState(null);
  
  // Refs
  const stateRef = useRef({
    raf: null,
    cleanup: null,
    time: 0,
    sphereRotation: 0,
  });
  
  const isMountedRef = useRef(true);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const glRef = useRef(null);
  const touchControllerRef = useRef(null);
  const sphereRef = useRef(null);
  const dataOrbsRef = useRef([]);
  const starFieldRef = useRef(null);

  // Get health status
  const healthStatus = healthData?.status || 'unknown';
  const healthScore = healthData?.health_score || 50;
  const healthColor = getHealthColor(healthStatus);

  // Initialize touch controller
  useEffect(() => {
    touchControllerRef.current = new TouchController({
      onTap: (pos) => {
        const hitOrb = performOrbRaycast(pos.x, pos.y);
        if (hitOrb !== null) {
          setSelectedOrb(hitOrb);
          onDataOrbTap?.(dataSources[hitOrb] || DATA_ORB_CONFIG.sources[hitOrb]);
        } else {
          setSelectedOrb(null);
        }
      },
      onDrag: ({ dx }) => {
        // Rotate sphere with drag
        stateRef.current.sphereRotation += dx * 0.005;
      },
    });
    
    return () => {
      touchControllerRef.current?.reset();
    };
  }, [onDataOrbTap, dataSources]);

  // Cleanup
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

  const onContextCreate = async (gl) => {
    console.log('[PersonSphereView] GL Context created');
    glRef.current = gl;
    
    const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;

    // Renderer
    const renderer = new Renderer({ gl });
    renderer.setSize(width, height);
    renderer.setClearColor(0x050510, 1);
    rendererRef.current = renderer;

    // Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050510, 0.02);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 0, 6);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.3));
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
    keyLight.position.set(3, 3, 5);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0x4FFFB0, 0.3);
    fillLight.position.set(-3, -2, 3);
    scene.add(fillLight);
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.5);
    rimLight.position.set(0, 0, -5);
    scene.add(rimLight);

    // Star field background
    starFieldRef.current = createSimpleStarField(scene, 400);

    // Create person sphere
    const sphereGeo = new THREE.SphereGeometry(
      SPHERE_CONFIG.radius,
      SPHERE_CONFIG.segments,
      SPHERE_CONFIG.segments
    );
    
    // Sphere material - semi-transparent with inner glow
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.85,
      metalness: 0.1,
      roughness: 0.4,
      side: THREE.FrontSide,
    });
    
    // Try to load avatar texture
    if (contact?.avatar) {
      try {
        const textureLoader = new TextureLoader();
        const texture = await textureLoader.loadAsync(contact.avatar);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        sphereMat.map = texture;
        sphereMat.needsUpdate = true;
      } catch (err) {
        console.warn('[PersonSphereView] Failed to load avatar texture:', err);
        // Use initials color instead
        sphereMat.color.set(contact?.color || 0x4FFFB0);
      }
    } else {
      // Use contact color or default
      sphereMat.color.set(contact?.color || 0x4FFFB0);
    }
    
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    scene.add(sphere);
    sphereRef.current = sphere;

    // Outer glow based on health
    const glowGeo = new THREE.SphereGeometry(SPHERE_CONFIG.radius * 1.15, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: healthColor,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    scene.add(glow);

    // Health indicator ring at base
    const healthRingGeo = new THREE.TorusGeometry(SPHERE_CONFIG.radius * 0.8, 0.05, 8, 32);
    const healthRingMat = new THREE.MeshBasicMaterial({
      color: healthColor,
      transparent: true,
      opacity: 0.8,
    });
    const healthRing = new THREE.Mesh(healthRingGeo, healthRingMat);
    healthRing.position.y = -SPHERE_CONFIG.radius - 0.1;
    healthRing.rotation.x = Math.PI / 2;
    scene.add(healthRing);

    // Create data orbs
    const orbsToCreate = dataSources.length > 0 ? dataSources : DATA_ORB_CONFIG.sources;
    const dataOrbs = [];
    
    orbsToCreate.forEach((source, i) => {
      const orbGeo = new THREE.SphereGeometry(DATA_ORB_CONFIG.radius, 16, 16);
      const orbMat = new THREE.MeshStandardMaterial({
        color: source.color || 0x4FFFB0,
        emissive: source.color || 0x4FFFB0,
        emissiveIntensity: 0.3,
        metalness: 0.5,
        roughness: 0.3,
      });
      const orb = new THREE.Mesh(orbGeo, orbMat);
      
      // Initial position
      const angle = source.angle || (i / orbsToCreate.length) * Math.PI * 2;
      orb.position.x = Math.cos(angle) * DATA_ORB_CONFIG.orbitRadius;
      orb.position.z = Math.sin(angle) * DATA_ORB_CONFIG.orbitRadius;
      orb.position.y = Math.sin(angle * 2) * 0.3; // Slight vertical variation
      
      orb.userData = { index: i, type: source.type, baseAngle: angle };
      
      scene.add(orb);
      dataOrbs.push({ mesh: orb, geo: orbGeo, mat: orbMat });
    });
    
    dataOrbsRef.current = dataOrbs;

    // Animation loop
    const tick = () => {
      if (!isMountedRef.current) return;
      
      const s = stateRef.current;
      s.time += 0.016;
      
      // Apply momentum
      const momentum = touchControllerRef.current?.update();
      if (momentum) {
        s.sphereRotation += momentum.x * 0.001;
      }
      
      // Update star field
      starFieldRef.current?.update(s.time, camera.position);
      
      // Rotate sphere (slow auto-rotation + user drag)
      if (sphereRef.current) {
        sphereRef.current.rotation.y = s.sphereRotation + s.time * SPHERE_CONFIG.rotationSpeed;
        
        // Subtle float
        sphereRef.current.position.y = Math.sin(s.time * SPHERE_CONFIG.floatSpeed * 1000) * SPHERE_CONFIG.floatAmount;
      }
      
      // Update glow
      if (glow) {
        glow.rotation.y = sphereRef.current?.rotation.y || 0;
        glow.position.y = sphereRef.current?.position.y || 0;
        
        // Pulse effect
        const pulse = 1 + Math.sin(s.time * 2) * 0.05;
        glow.scale.setScalar(pulse);
      }
      
      // Pulse health ring
      if (healthRing) {
        const ringPulse = 0.8 + Math.sin(s.time * 1.5) * 0.1;
        healthRingMat.opacity = ringPulse;
      }
      
      // Orbit data orbs
      dataOrbs.forEach((orb, i) => {
        const baseAngle = orb.mesh.userData.baseAngle;
        const orbAngle = baseAngle + s.time * DATA_ORB_CONFIG.orbitSpeed * (i + 1);
        
        orb.mesh.position.x = Math.cos(orbAngle) * DATA_ORB_CONFIG.orbitRadius;
        orb.mesh.position.z = Math.sin(orbAngle) * DATA_ORB_CONFIG.orbitRadius;
        orb.mesh.position.y = Math.sin(orbAngle * 2) * 0.3;
        
        // Subtle rotation
        orb.mesh.rotation.y += 0.02;
        
        // Highlight selected
        if (selectedOrb === i) {
          orb.mat.emissiveIntensity = 0.6 + Math.sin(s.time * 5) * 0.2;
        } else {
          orb.mat.emissiveIntensity = 0.3;
        }
      });
      
      renderer.render(scene, camera);
      gl.endFrameEXP();
      
      s.raf = requestAnimationFrame(tick);
    };
    
    tick();

    // Cleanup
    stateRef.current.cleanup = () => {
      console.log('[PersonSphereView] Cleaning up');
      if (stateRef.current.raf) cancelAnimationFrame(stateRef.current.raf);
      
      sphereGeo.dispose();
      sphereMat.dispose();
      glowGeo.dispose();
      glowMat.dispose();
      healthRingGeo.dispose();
      healthRingMat.dispose();
      
      dataOrbs.forEach(orb => {
        orb.geo.dispose();
        orb.mat.dispose();
      });
      
      starFieldRef.current?.dispose();
      renderer.dispose?.();
    };
  };

  const performOrbRaycast = useCallback((touchX, touchY) => {
    if (!cameraRef.current || !glRef.current) return null;
    
    const camera = cameraRef.current;
    const gl = glRef.current;
    
    const x = (touchX / SCREEN_WIDTH) * 2 - 1;
    const y = -((touchY / SCREEN_HEIGHT) * 2 - 1);
    
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
    
    const orbMeshes = dataOrbsRef.current.map(o => o.mesh);
    const intersects = raycaster.intersectObjects(orbMeshes);
    
    if (intersects.length > 0) {
      return intersects[0].object.userData.index;
    }
    
    return null;
  }, []);

  // Touch handlers
  const handleTouchStart = (e) => {
    touchControllerRef.current?.handleTouchStart(e.nativeEvent.touches);
  };
  
  const handleTouchMove = (e) => {
    touchControllerRef.current?.handleTouchMove(e.nativeEvent.touches);
  };
  
  const handleTouchEnd = (e) => {
    touchControllerRef.current?.handleTouchEnd(e.nativeEvent.touches);
  };

  return (
    <View style={[styles.container, style]}>
      {/* 3D View */}
      <GLView
        style={styles.glView}
        onContextCreate={onContextCreate}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      
      {/* Contact Info - Floating */}
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{contact?.name || 'Contact'}</Text>
        {contact?.jobTitle && (
          <Text style={styles.title}>{contact.jobTitle}</Text>
        )}
        <View style={styles.healthBadge}>
          <View style={[styles.healthDot, { backgroundColor: healthColor }]} />
          <Text style={styles.healthText}>
            {healthStatus.charAt(0).toUpperCase() + healthStatus.slice(1)}
          </Text>
          <Text style={styles.lastSeenText}>
            {healthData?.last_interaction_date ? 
              `Last seen ${formatRelativeTime(healthData.last_interaction_date)}` : 
              'No recent interaction'
            }
          </Text>
        </View>
      </View>
      
      {/* Data Orb Legend */}
      {selectedOrb !== null && (
        <View style={styles.orbInfo}>
          <Text style={styles.orbInfoTitle}>
            {DATA_ORB_CONFIG.sources[selectedOrb]?.type?.toUpperCase() || 'DATA'}
          </Text>
          <Text style={styles.orbInfoText}>
            Tap to view {DATA_ORB_CONFIG.sources[selectedOrb]?.type || 'data'} activity
          </Text>
        </View>
      )}
      
      {/* Communication Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.primaryAction]}
          onPress={onVideoCall}
        >
          <Ionicons name="videocam" size={24} color="#000" />
          <Text style={styles.actionTextPrimary}>Video</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={onVoiceCall}
        >
          <Ionicons name="mic" size={24} color="#4FFFB0" />
          <Text style={styles.actionText}>Voice</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={onMessage}
        >
          <Ionicons name="chatbubble" size={24} color="#4FFFB0" />
          <Text style={styles.actionText}>Text</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050510',
  },
  glView: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    position: 'absolute',
    bottom: 200,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  name: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  title: {
    color: '#4FFFB0',
    fontSize: 16,
    marginBottom: 12,
  },
  healthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  healthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  healthText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  lastSeenText: {
    color: '#888',
    fontSize: 12,
  },
  orbInfo: {
    position: 'absolute',
    top: '40%',
    left: 20,
    right: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(79, 255, 176, 0.3)',
  },
  orbInfoTitle: {
    color: '#4FFFB0',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  orbInfoText: {
    color: '#888',
    fontSize: 13,
  },
  actionsContainer: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: 'rgba(79, 255, 176, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(79, 255, 176, 0.3)',
  },
  primaryAction: {
    backgroundColor: '#4FFFB0',
    borderColor: '#4FFFB0',
  },
  actionText: {
    color: '#4FFFB0',
    fontSize: 12,
    marginTop: 4,
  },
  actionTextPrimary: {
    color: '#000',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
});
