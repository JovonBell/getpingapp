/**
 * SolarSystemView - Multi-ring 3D network visualization
 * 
 * Renders all rings as concentric orbits with contacts as spheres.
 * Uses InstancedMesh for performance with many contacts.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';
import { TouchController, GESTURE_STATE } from './TouchController';
import { CameraController } from './CameraController';
import { createSimpleStarField } from './StarField';
import { getHealthColor } from '../../utils/scoring/healthScoring';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Ring configuration
const RING_CONFIG = {
  baseRadius: 3,
  radiusStep: 2.5,
  maxRings: 6,
  maxContactsPerRing: 12,
  contactRadius: 0.4,
  ringOpacity: 0.3,
};

// Animation settings
const ORBIT_SPEED = 0.0003; // Radians per frame
const CONTACT_FLOAT_SPEED = 0.002;
const CONTACT_FLOAT_AMOUNT = 0.1;

export default function SolarSystemView({
  circles = [],
  healthMap = {},
  onContactTap,
  onContactDoubleTap,
  onRingTap,
  onBackgroundTap,
  style,
}) {
  const [labelPositions, setLabelPositions] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [focusedRing, setFocusedRing] = useState(null);
  
  // Refs for 3D scene
  const stateRef = useRef({
    raf: null,
    cleanup: null,
    time: 0,
    orbitAngles: [], // Per-ring rotation angles
  });
  
  const isMountedRef = useRef(true);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const glRef = useRef(null);
  const touchControllerRef = useRef(null);
  const cameraControllerRef = useRef(null);
  const instancedMeshRef = useRef(null);
  const starFieldRef = useRef(null);
  
  // Contact data for raycasting
  const contactDataRef = useRef([]);

  // Flatten circles into contact array with positions
  const flattenedContacts = useMemo(() => {
    const contacts = [];
    let instanceIndex = 0;
    
    circles.forEach((circle, ringIndex) => {
      if (ringIndex >= RING_CONFIG.maxRings) return;
      
      const radius = RING_CONFIG.baseRadius + ringIndex * RING_CONFIG.radiusStep;
      const visibleContacts = circle.contacts?.slice(0, RING_CONFIG.maxContactsPerRing) || [];
      const totalContacts = circle.contacts?.length || 0;
      const overflow = totalContacts - visibleContacts.length;
      
      visibleContacts.forEach((contact, i) => {
        const angle = (i / visibleContacts.length) * Math.PI * 2;
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
          baseAngle: Math.PI * 1.5, // Position at bottom
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
        const hitIndex = performRaycast(pos.x, pos.y);
        if (hitIndex >= 0) {
          const contact = contactDataRef.current[hitIndex];
          if (contact?.isOverflow) {
            onRingTap?.(contact.circleId, contact.ringIndex);
          } else {
            setSelectedContact(contact);
            onContactTap?.(contact);
          }
        } else {
          setSelectedContact(null);
          onBackgroundTap?.();
        }
      },
      onDoubleTap: (pos) => {
        const hitIndex = performRaycast(pos.x, pos.y);
        if (hitIndex >= 0) {
          const contact = contactDataRef.current[hitIndex];
          if (!contact?.isOverflow) {
            onContactDoubleTap?.(contact);
          }
        }
      },
      onDragStart: () => {},
      onDrag: ({ dx, dy }) => {
        if (cameraControllerRef.current) {
          cameraControllerRef.current.updateRotation(
            { dx, dy },
            cameraControllerRef.current.getDistance()
          );
        }
      },
      onDragEnd: ({ velocity }) => {
        // Momentum handled by TouchController.update()
      },
      onPinch: ({ scale }) => {
        if (cameraControllerRef.current) {
          const currentDistance = cameraControllerRef.current.getDistance();
          cameraControllerRef.current.updateDistance(
            currentDistance / scale,
            { min: 8, max: 50 }
          );
        }
      },
    });
    
    return () => {
      touchControllerRef.current?.reset();
    };
  }, [onContactTap, onContactDoubleTap, onRingTap, onBackgroundTap]);

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

  const onContextCreate = async (gl) => {
    console.log('[SolarSystemView] GL Context created');
    glRef.current = gl;
    
    const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;

    // Renderer
    const renderer = new Renderer({ gl });
    renderer.setSize(width, height);
    renderer.setClearColor(0x050510, 1);
    rendererRef.current = renderer;

    // Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050510, 0.015);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 500);
    camera.position.set(0, 15, 25);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;
    
    // Camera controller
    cameraControllerRef.current = new CameraController(camera);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
    keyLight.position.set(5, 10, 5);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0x4FFFB0, 0.5);
    rimLight.position.set(-5, -5, -5);
    scene.add(rimLight);

    // Star field background
    starFieldRef.current = createSimpleStarField(scene, 800);

    // Center nucleus (you)
    const nucleusGeo = new THREE.SphereGeometry(0.8, 32, 32);
    const nucleusMat = new THREE.MeshStandardMaterial({
      color: 0x4FFFB0,
      emissive: 0x4FFFB0,
      emissiveIntensity: 0.5,
      metalness: 0.3,
      roughness: 0.7,
    });
    const nucleus = new THREE.Mesh(nucleusGeo, nucleusMat);
    scene.add(nucleus);

    // Nucleus glow
    const glowGeo = new THREE.SphereGeometry(1.2, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x4FFFB0,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    scene.add(glow);

    // Ring geometries
    const ringMeshes = [];
    circles.forEach((circle, i) => {
      if (i >= RING_CONFIG.maxRings) return;
      
      const radius = RING_CONFIG.baseRadius + i * RING_CONFIG.radiusStep;
      const ringGeo = new THREE.TorusGeometry(radius, 0.02, 8, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: circle.color || 0x4FFFB0,
        transparent: true,
        opacity: RING_CONFIG.ringOpacity,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      scene.add(ring);
      ringMeshes.push({ geo: ringGeo, mat: ringMat, mesh: ring });
    });

    // Initialize orbit angles
    stateRef.current.orbitAngles = circles.map(() => 0);

    // Create InstancedMesh for all contacts
    const totalContacts = flattenedContacts.length;
    if (totalContacts > 0) {
      const contactGeo = new THREE.SphereGeometry(RING_CONFIG.contactRadius, 16, 16);
      const contactMat = new THREE.MeshStandardMaterial({
        transparent: true,
        opacity: 0.85,
        metalness: 0.2,
        roughness: 0.6,
      });
      
      const instancedMesh = new THREE.InstancedMesh(contactGeo, contactMat, totalContacts);
      instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      scene.add(instancedMesh);
      instancedMeshRef.current = instancedMesh;
      
      // Store contact data for raycasting
      contactDataRef.current = flattenedContacts;
      
      // Set initial colors
      const color = new THREE.Color();
      flattenedContacts.forEach((contact, i) => {
        if (contact.isOverflow) {
          color.set(0x888888);
        } else {
          const healthStatus = contact.health?.status || 'unknown';
          color.set(getHealthColor(healthStatus));
        }
        instancedMesh.setColorAt(i, color);
      });
      instancedMesh.instanceColor.needsUpdate = true;
    }

    // Animation loop
    const tick = () => {
      if (!isMountedRef.current) return;
      
      const s = stateRef.current;
      s.time += 0.016; // ~60fps
      
      // Apply momentum from touch controller
      const momentum = touchControllerRef.current?.update();
      if (momentum && cameraControllerRef.current) {
        cameraControllerRef.current.updateRotation(
          { dx: momentum.x, dy: momentum.y },
          cameraControllerRef.current.getDistance()
        );
      }
      
      // Update star field
      starFieldRef.current?.update(s.time, camera.position);
      
      // Update contact positions
      if (instancedMeshRef.current && contactDataRef.current.length > 0) {
        const dummy = new THREE.Object3D();
        
        contactDataRef.current.forEach((contact, i) => {
          const ringAngle = s.orbitAngles[contact.ringIndex] || 0;
          const totalAngle = contact.baseAngle + ringAngle;
          
          const x = Math.cos(totalAngle) * contact.radius;
          const z = Math.sin(totalAngle) * contact.radius;
          const y = Math.sin(s.time * CONTACT_FLOAT_SPEED + i) * CONTACT_FLOAT_AMOUNT;
          
          dummy.position.set(x, y, z);
          dummy.scale.setScalar(contact.isOverflow ? 0.6 : 1);
          dummy.updateMatrix();
          instancedMeshRef.current.setMatrixAt(i, dummy.matrix);
        });
        
        instancedMeshRef.current.instanceMatrix.needsUpdate = true;
      }
      
      // Slow orbit rotation
      s.orbitAngles = s.orbitAngles.map((angle, i) => 
        angle + ORBIT_SPEED * (i + 1) // Inner rings rotate faster
      );
      
      // Nucleus pulse
      if (nucleus) {
        const pulse = 1 + Math.sin(s.time * 2) * 0.03;
        nucleus.scale.setScalar(pulse);
        glow.scale.setScalar(pulse * 1.5);
      }
      
      // Project contact positions to 2D for labels
      if (s.time % 3 < 0.02) { // Update labels every ~50ms
        updateLabelPositions(camera, gl);
      }
      
      renderer.render(scene, camera);
      gl.endFrameEXP();
      
      s.raf = requestAnimationFrame(tick);
    };
    
    tick();

    // Cleanup
    stateRef.current.cleanup = () => {
      console.log('[SolarSystemView] Cleaning up');
      if (stateRef.current.raf) cancelAnimationFrame(stateRef.current.raf);
      
      nucleusGeo.dispose();
      nucleusMat.dispose();
      glowGeo.dispose();
      glowMat.dispose();
      
      ringMeshes.forEach(r => {
        r.geo.dispose();
        r.mat.dispose();
      });
      
      if (instancedMeshRef.current) {
        instancedMeshRef.current.geometry.dispose();
        instancedMeshRef.current.material.dispose();
      }
      
      starFieldRef.current?.dispose();
      renderer.dispose?.();
    };
  };

  const performRaycast = useCallback((touchX, touchY) => {
    if (!cameraRef.current || !instancedMeshRef.current || !glRef.current) return -1;
    
    const camera = cameraRef.current;
    const gl = glRef.current;
    const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;
    
    const x = (touchX / SCREEN_WIDTH) * 2 - 1;
    const y = -((touchY / SCREEN_HEIGHT) * 2 - 1);
    
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
    
    const intersects = raycaster.intersectObject(instancedMeshRef.current);
    
    if (intersects.length > 0) {
      return intersects[0].instanceId;
    }
    
    return -1;
  }, []);

  const updateLabelPositions = useCallback((camera, gl) => {
    if (!contactDataRef.current.length || !instancedMeshRef.current) return;
    
    const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;
    const dummy = new THREE.Object3D();
    const positions = [];
    
    contactDataRef.current.forEach((contact, i) => {
      instancedMeshRef.current.getMatrixAt(i, dummy.matrix);
      dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
      
      const vector = dummy.position.clone();
      vector.project(camera);
      
      const screenX = (vector.x * 0.5 + 0.5) * SCREEN_WIDTH;
      const screenY = (-vector.y * 0.5 + 0.5) * SCREEN_HEIGHT;
      const isBehindCamera = vector.z > 1;
      
      positions.push({
        x: screenX,
        y: screenY,
        visible: !isBehindCamera && screenX > 0 && screenX < SCREEN_WIDTH && screenY > 0 && screenY < SCREEN_HEIGHT,
        name: contact.name,
        isOverflow: contact.isOverflow,
        isSelected: selectedContact?.id === contact.id,
      });
    });
    
    if (isMountedRef.current) {
      setLabelPositions(positions);
    }
  }, [selectedContact]);

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
      
      {/* Contact labels */}
      {labelPositions.map((pos, i) => 
        pos.visible && !pos.isOverflow ? (
          <View
            key={i}
            style={[
              styles.label,
              {
                left: pos.x - 40,
                top: pos.y + 25,
              },
              pos.isSelected && styles.labelSelected,
            ]}
            pointerEvents="none"
          >
            <Text style={styles.labelText} numberOfLines={1}>
              {pos.name}
            </Text>
          </View>
        ) : null
      )}
      
      {/* Overflow indicators */}
      {labelPositions.map((pos, i) =>
        pos.visible && pos.isOverflow ? (
          <View
            key={`overflow-${i}`}
            style={[
              styles.overflowLabel,
              {
                left: pos.x - 30,
                top: pos.y + 20,
              },
            ]}
            pointerEvents="none"
          >
            <Text style={styles.overflowText}>{pos.name}</Text>
          </View>
        ) : null
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050510',
  },
  glView: {
    flex: 1,
  },
  label: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    maxWidth: 80,
  },
  labelSelected: {
    backgroundColor: 'rgba(79, 255, 176, 0.3)',
    borderWidth: 1,
    borderColor: '#4FFFB0',
  },
  labelText: {
    color: '#fff',
    fontSize: 10,
    textAlign: 'center',
  },
  overflowLabel: {
    position: 'absolute',
    backgroundColor: 'rgba(136, 136, 136, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  overflowText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
});
