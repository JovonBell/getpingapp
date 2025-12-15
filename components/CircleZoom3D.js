import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function CircleZoom3D({
  visible,
  onClose,
  circleName = 'Circle',
  contacts = [],
  onContactPress,
  onMessage,
}) {
  const colors = ['#4FFFB0', '#ffaa00', '#ff6b6b', '#4ecdc4'];
  
  const normalizedContacts = useMemo(() => {
    if (contacts && contacts.length > 0) {
      return contacts.map((c, i) => ({
        ...c,
        color: c.color || colors[i % colors.length],
      }));
    }
    return [];
  }, [contacts]);

  const [selectedIndex, setSelectedIndex] = useState(null);
  const [labelPositions, setLabelPositions] = useState([]);

  const stateRef = useRef({
    raf: null,
    cleanup: null,
    orbitAngle: 0,
    targetOrbitAngle: 0,
    isDragging: false,
    isPinching: false,
    lastX: 0,
    lastDistance: 0,
    cameraDistance: 14, // Start zoomed out to see full orbit
    targetCameraDistance: 14,
    touchStartTime: 0,
    touchStartPos: { x: 0, y: 0 },
    totalMovement: 0,
  });

  // References for raycasting
  const planetMeshesRef = useRef([]);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const glRef = useRef(null);

  useEffect(() => {
    if (visible) {
      setSelectedIndex(null);
      stateRef.current.orbitAngle = 0;
      stateRef.current.targetOrbitAngle = 0;
      stateRef.current.cameraDistance = 14;
      stateRef.current.targetCameraDistance = 14;
    }
  }, [visible]);

  useEffect(() => {
    return () => {
      stateRef.current.cleanup?.();
    };
  }, []);

  const onContextCreate = async (gl) => {
    glRef.current = gl;
    const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;

    const renderer = new Renderer({ gl });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 1);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.025);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 5, 14); // Start zoomed out
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const key = new THREE.DirectionalLight(0xffffff, 1.2);
    key.position.set(3, 4, 6);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x4fffb0, 0.7);
    rim.position.set(-4, -1, 3);
    scene.add(rim);

    // Stars
    const starCount = 2000;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      starPositions[i3 + 0] = (Math.random() - 0.5) * 100;
      starPositions[i3 + 1] = (Math.random() - 0.5) * 100;
      starPositions[i3 + 2] = -Math.random() * 120;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      size: 0.12,
      color: 0xffffff,
      transparent: true,
      opacity: 0.7,
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // Central glowing nucleus
    const nucleusGeo = new THREE.SphereGeometry(0.5, 64, 64);
    const nucleusMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#ffffff'),
      emissive: new THREE.Color('#4FFFB0'),
      emissiveIntensity: 0.6,
      metalness: 0.3,
      roughness: 0.2,
    });
    const nucleus = new THREE.Mesh(nucleusGeo, nucleusMat);
    scene.add(nucleus);

    // Nucleus glow
    const nucleusGlowGeo = new THREE.SphereGeometry(0.65, 32, 32);
    const nucleusGlowMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#4FFFB0'),
      transparent: true,
      opacity: 0.15,
    });
    const nucleusGlow = new THREE.Mesh(nucleusGlowGeo, nucleusGlowMat);
    scene.add(nucleusGlow);

    // Orbit ring - main
    const ORBIT_RADIUS = 4.5;
    const orbitRingGeo = new THREE.RingGeometry(ORBIT_RADIUS - 0.03, ORBIT_RADIUS + 0.03, 128);
    const orbitRingMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#4FFFB0'),
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
    });
    const orbitRing = new THREE.Mesh(orbitRingGeo, orbitRingMat);
    orbitRing.rotation.x = Math.PI / 2;
    scene.add(orbitRing);

    // Second decorative ring (tilted)
    const orbitRing2Geo = new THREE.RingGeometry(ORBIT_RADIUS - 0.02, ORBIT_RADIUS + 0.02, 128);
    const orbitRing2Mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#4FFFB0'),
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
    });
    const orbitRing2 = new THREE.Mesh(orbitRing2Geo, orbitRing2Mat);
    orbitRing2.rotation.x = Math.PI / 2.3;
    orbitRing2.rotation.z = Math.PI / 5;
    scene.add(orbitRing2);

    // Third ring
    const orbitRing3Geo = new THREE.RingGeometry(ORBIT_RADIUS - 0.02, ORBIT_RADIUS + 0.02, 128);
    const orbitRing3Mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#4FFFB0'),
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
    });
    const orbitRing3 = new THREE.Mesh(orbitRing3Geo, orbitRing3Mat);
    orbitRing3.rotation.x = Math.PI / 2.8;
    orbitRing3.rotation.z = -Math.PI / 4;
    scene.add(orbitRing3);

    // Create planet meshes for each contact
    const planetMeshes = [];
    const PLANET_RADIUS = 0.45;

    normalizedContacts.forEach((contact, i) => {
      const planetGeo = new THREE.SphereGeometry(PLANET_RADIUS, 48, 48);
      const planetMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(contact.color || '#4FFFB0'),
        emissive: new THREE.Color(contact.color || '#4FFFB0'),
        emissiveIntensity: 0.25,
        metalness: 0.2,
        roughness: 0.4,
      });
      const planet = new THREE.Mesh(planetGeo, planetMat);
      planet.userData = { index: i, contact };
      scene.add(planet);

      // Planet glow
      const glowGeo = new THREE.SphereGeometry(PLANET_RADIUS * 1.2, 32, 32);
      const glowMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(contact.color || '#4FFFB0'),
        transparent: true,
        opacity: 0.15,
      });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      scene.add(glow);

      // Connection line to center
      const lineGeo = new THREE.BufferGeometry();
      const lineMat = new THREE.LineBasicMaterial({
        color: new THREE.Color(contact.color || '#4FFFB0'),
        transparent: true,
        opacity: 0.25,
      });
      const line = new THREE.Line(lineGeo, lineMat);
      scene.add(line);

      planetMeshes.push({ planet, glow, line, lineGeo, contact, geo: planetGeo, mat: planetMat, glowGeo, glowMat, lineMat });
    });

    planetMeshesRef.current = planetMeshes;

    const tick = () => {
      const s = stateRef.current;

      // Smooth rotation towards target
      const rotDelta = s.targetOrbitAngle - s.orbitAngle;
      s.orbitAngle += rotDelta * 0.08;

      // Smooth zoom
      const zoomDelta = s.targetCameraDistance - s.cameraDistance;
      s.cameraDistance += zoomDelta * 0.1;

      // Auto-rotate slowly when not dragging
      if (!s.isDragging && !s.isPinching) {
        s.targetOrbitAngle += 0.002;
        s.orbitAngle += 0.002;
      }

      // Update planet positions
      const count = normalizedContacts.length;
      planetMeshes.forEach((item, i) => {
        const angle = s.orbitAngle + (i * Math.PI * 2) / Math.max(1, count);
        const x = Math.cos(angle) * ORBIT_RADIUS;
        const z = Math.sin(angle) * ORBIT_RADIUS;
        const y = Math.sin(angle * 0.5) * 0.4; // Slight vertical wobble

        item.planet.position.set(x, y, z);
        item.glow.position.set(x, y, z);

        // Rotate planets on their axis
        item.planet.rotation.y += 0.008;

        // Update connection line
        const positions = new Float32Array([0, 0, 0, x, y, z]);
        item.lineGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      });

      // Nucleus pulse
      const pulse = 1 + Math.sin(Date.now() * 0.002) * 0.05;
      nucleus.scale.setScalar(pulse);
      nucleusGlow.scale.setScalar(pulse * 1.2);

      // Star drift
      stars.rotation.y += 0.0002;
      stars.rotation.x += 0.0001;

      // Camera position with zoom and subtle movement
      const camY = 4 + Math.sin(Date.now() * 0.0003) * 0.3;
      const camX = Math.sin(Date.now() * 0.0002) * 0.4;
      camera.position.set(camX, camY, s.cameraDistance);
      camera.lookAt(0, 0, 0);

      // Project 3D planet positions to 2D screen coordinates for labels
      const newLabelPositions = planetMeshes.map((item, i) => {
        const planet = item.planet;
        
        // Create a position slightly below the planet for the label
        const labelWorldPos = new THREE.Vector3(
          planet.position.x,
          planet.position.y - 0.7, // Position label below planet
          planet.position.z
        );
        
        // Project to screen space
        const projected = labelWorldPos.clone().project(camera);
        
        // Convert to screen coordinates
        const screenX = (projected.x + 1) / 2 * SCREEN_WIDTH;
        const screenY = (-projected.y + 1) / 2 * SCREEN_HEIGHT;
        
        // Check if behind camera
        const isBehindCamera = projected.z > 1;
        
        return {
          x: screenX,
          y: screenY,
          visible: !isBehindCamera,
          name: item.contact?.name || 'Contact',
          color: item.contact?.color || '#4FFFB0',
        };
      });
      
      // Update label positions every few frames to avoid excessive re-renders
      if (Date.now() % 3 === 0) {
        setLabelPositions(newLabelPositions);
      }

      renderer.render(scene, camera);
      gl.endFrameEXP();
      s.raf = requestAnimationFrame(tick);
    };

    tick();

    stateRef.current.cleanup = () => {
      if (stateRef.current.raf) cancelAnimationFrame(stateRef.current.raf);
      nucleusGeo.dispose();
      nucleusMat.dispose();
      nucleusGlowGeo.dispose();
      nucleusGlowMat.dispose();
      orbitRingGeo.dispose();
      orbitRingMat.dispose();
      orbitRing2Geo.dispose();
      orbitRing2Mat.dispose();
      orbitRing3Geo.dispose();
      orbitRing3Mat.dispose();
      starGeo.dispose();
      starMat.dispose();
      planetMeshes.forEach(item => {
        item.geo.dispose();
        item.mat.dispose();
        item.glowGeo.dispose();
        item.glowMat.dispose();
        item.lineGeo.dispose();
        item.lineMat.dispose();
      });
      renderer.dispose?.();
    };
  };

  // Perform raycasting to detect tapped planet
  const performRaycast = (touchX, touchY) => {
    if (!cameraRef.current || !sceneRef.current || !glRef.current) return -1;

    const camera = cameraRef.current;
    const gl = glRef.current;
    
    // Convert touch coordinates to normalized device coordinates
    const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;
    
    // Touch coords are in screen space, need to convert to GL coords
    const x = (touchX / SCREEN_WIDTH) * 2 - 1;
    const y = -((touchY / SCREEN_HEIGHT) * 2 - 1);

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

    // Get all planet meshes for intersection
    const planets = planetMeshesRef.current.map(item => item.planet);
    const intersects = raycaster.intersectObjects(planets);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      return hit.userData?.index ?? -1;
    }

    return -1;
  };

  // Touch handlers
  const handleTouchStart = (event) => {
    const touches = event.nativeEvent.touches;
    const s = stateRef.current;

    if (touches.length === 2) {
      // Pinch start
      s.isPinching = true;
      s.isDragging = false;
      const touch1 = touches[0];
      const touch2 = touches[1];
      s.lastDistance = Math.sqrt(
        Math.pow(touch2.pageX - touch1.pageX, 2) + Math.pow(touch2.pageY - touch1.pageY, 2)
      );
    } else if (touches.length === 1) {
      // Single touch - could be tap or drag
      s.isDragging = true;
      s.isPinching = false;
      s.lastX = touches[0].pageX;
      s.touchStartTime = Date.now();
      s.touchStartPos = { x: touches[0].pageX, y: touches[0].pageY };
      s.totalMovement = 0;
    }
  };

  const handleTouchMove = (event) => {
    const touches = event.nativeEvent.touches;
    const s = stateRef.current;

    if (touches.length === 2 && s.isPinching) {
      // Pinch to zoom
      const touch1 = touches[0];
      const touch2 = touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.pageX - touch1.pageX, 2) + Math.pow(touch2.pageY - touch1.pageY, 2)
      );

      if (s.lastDistance > 0) {
        const scale = s.lastDistance / distance;
        const newDistance = s.targetCameraDistance * scale;
        
        // Clamp zoom between 6 and 25
        s.targetCameraDistance = Math.max(6, Math.min(25, newDistance));
      }

      s.lastDistance = distance;
    } else if (touches.length === 1 && s.isDragging) {
      // Drag to rotate
      const currentX = touches[0].pageX;
      const deltaX = currentX - s.lastX;
      s.lastX = currentX;

      s.totalMovement += Math.abs(deltaX);

      // Rotate orbit based on drag
      const sensitivity = 0.006;
      s.targetOrbitAngle -= deltaX * sensitivity;
    }
  };

  const handleTouchEnd = (event) => {
    const s = stateRef.current;
    const touchDuration = Date.now() - s.touchStartTime;
    const wasTap = touchDuration < 250 && s.totalMovement < 10;

    if (wasTap && !s.isPinching) {
      // Check if we tapped on a planet
      const tappedIndex = performRaycast(s.touchStartPos.x, s.touchStartPos.y);
      if (tappedIndex >= 0) {
        setSelectedIndex(tappedIndex === selectedIndex ? null : tappedIndex);
      } else {
        // Tapped on empty space - deselect
        setSelectedIndex(null);
      }
    }

    s.isDragging = false;
    s.isPinching = false;
    s.lastDistance = 0;
  };

  const selectedContact = selectedIndex !== null ? normalizedContacts[selectedIndex] : null;

  return (
    <Modal visible={visible} transparent={false} animationType="fade" onRequestClose={onClose}>
      <View style={styles.container}>
        <GLView style={styles.glFull} onContextCreate={onContextCreate} pointerEvents="none" />

        {/* Gesture layer */}
        <View
          style={styles.gestureLayer}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Header */}
          <View style={styles.header} pointerEvents="box-none">
            <TouchableOpacity style={styles.backButton} onPress={onClose}>
              <Ionicons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
            <View style={styles.headerTitle}>
              <Text style={styles.circleName}>{circleName}</Text>
              <Text style={styles.contactCount}>{normalizedContacts.length} people</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Name labels orbiting with planets */}
          {labelPositions.map((label, i) => {
            if (!label.visible) return null;
            
            return (
              <View
                key={i}
                style={[
                  styles.nameLabel,
                  {
                    left: label.x - 40, // Center the label (assuming ~80px width)
                    top: label.y,
                    borderColor: label.color,
                  },
                ]}
                pointerEvents="none"
              >
                <Text style={styles.nameLabelText} numberOfLines={1}>
                  {label.name.split(' ')[0]}
                </Text>
              </View>
            );
          })}

          {/* Selected contact popup */}
          {selectedContact && (
            <View style={styles.selectedPopup} pointerEvents="box-none">
              <View style={styles.popupHeader}>
                <View style={[styles.popupAvatar, { borderColor: selectedContact.color }]}>
                  <Text style={styles.popupInitials}>{selectedContact.initials || '?'}</Text>
                </View>
                <View style={styles.popupInfo}>
                  <Text style={styles.popupName}>{selectedContact.name}</Text>
                  {selectedContact.phone && (
                    <Text style={styles.popupPhone}>{selectedContact.phone}</Text>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.popupClose}
                  onPress={() => setSelectedIndex(null)}
                >
                  <Ionicons name="close" size={20} color="#ffffff" />
                </TouchableOpacity>
              </View>
              <View style={styles.popupActions}>
                <TouchableOpacity
                  style={styles.popupButton}
                  onPress={() => {
                    onContactPress?.(selectedContact);
                  }}
                >
                  <Ionicons name="expand-outline" size={20} color="#4FFFB0" />
                  <Text style={styles.popupButtonText}>View</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.popupButton, styles.popupButtonPrimary]}
                  onPress={() => {
                    onMessage?.(selectedContact);
                  }}
                >
                  <Ionicons name="chatbubble" size={20} color="#000000" />
                  <Text style={[styles.popupButtonText, styles.popupButtonTextPrimary]}>Message</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Instructions */}
          <View style={styles.instructions} pointerEvents="none">
            <Text style={styles.instructionText}>
              {selectedContact ? 'Tap elsewhere to deselect' : 'Tap a planet • Drag to rotate • Pinch to zoom'}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  glFull: { ...StyleSheet.absoluteFillObject },
  gestureLayer: { ...StyleSheet.absoluteFillObject },

  header: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 100,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(79, 255, 176, 0.4)',
  },
  headerTitle: {
    alignItems: 'center',
  },
  circleName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  contactCount: {
    fontSize: 14,
    color: '#4FFFB0',
    marginTop: 2,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(79, 255, 176, 0.4)',
  },

  selectedPopup: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(26, 42, 26, 0.98)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#4FFFB0',
    padding: 16,
    shadowColor: '#4FFFB0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 25,
    elevation: 25,
  },
  popupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  popupAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    backgroundColor: 'rgba(79, 255, 176, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupInitials: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  popupInfo: {
    flex: 1,
    marginLeft: 14,
  },
  popupName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  popupPhone: {
    fontSize: 14,
    color: '#999999',
    marginTop: 3,
  },
  popupClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  popupActions: {
    flexDirection: 'row',
    gap: 12,
  },
  popupButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(79, 255, 176, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(79, 255, 176, 0.5)',
  },
  popupButtonPrimary: {
    backgroundColor: '#4FFFB0',
    borderColor: '#4FFFB0',
  },
  popupButtonText: {
    color: '#4FFFB0',
    fontSize: 16,
    fontWeight: '600',
  },
  popupButtonTextPrimary: {
    color: '#000000',
  },

  instructions: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructionText: {
    color: '#ffffff',
    fontSize: 14,
    opacity: 0.7,
  },

  // Name labels that orbit with planets
  nameLabel: {
    position: 'absolute',
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: 'rgba(10, 26, 10, 0.85)',
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
    maxWidth: 100,
  },
  nameLabelText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
});
