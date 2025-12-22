/**
 * PathAnimation - 3D animated path between connections
 * 
 * Shows the "six degrees" path from you to a target person
 * with animated particle trail and message bubbles.
 */

import * as THREE from 'three';

// Animation configuration
const PATH_CONFIG = {
  particleSpeed: 0.03, // Units per frame
  trailLength: 20, // Number of trail particles
  trailFadeRate: 0.05,
  nodeGlowDuration: 1000, // ms
  celebrationParticles: 50,
};

/**
 * Create a path animation between nodes in 3D space
 * 
 * @param {THREE.Scene} scene - The Three.js scene
 * @param {Array} pathNodes - Array of { position: Vector3, contact: object }
 * @param {object} options - Animation options
 * @returns {object} - Animation controller
 */
export function createPathAnimation(scene, pathNodes, options = {}) {
  const {
    color = 0x4FFFB0,
    onNodeReached,
    onPathComplete,
    onPathStart,
  } = options;

  if (!pathNodes || pathNodes.length < 2) {
    console.warn('[PathAnimation] Need at least 2 nodes for a path');
    return null;
  }

  // State
  let currentSegment = 0;
  let segmentProgress = 0;
  let isPlaying = false;
  let isPaused = false;
  let animationId = null;

  // Create path line geometry
  const pathPoints = pathNodes.map(n => n.position.clone());
  const pathCurve = new THREE.CatmullRomCurve3(pathPoints);
  
  // Main trail line
  const lineGeometry = new THREE.BufferGeometry().setFromPoints(
    pathCurve.getPoints(100)
  );
  const lineMaterial = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: 0,
    linewidth: 2,
  });
  const pathLine = new THREE.Line(lineGeometry, lineMaterial);
  scene.add(pathLine);

  // Leading particle (the "traveler")
  const particleGeo = new THREE.SphereGeometry(0.15, 16, 16);
  const particleMat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 1,
  });
  const particle = new THREE.Mesh(particleGeo, particleMat);
  particle.position.copy(pathNodes[0].position);
  scene.add(particle);

  // Particle glow
  const glowGeo = new THREE.SphereGeometry(0.25, 16, 16);
  const glowMat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.3,
    side: THREE.BackSide,
  });
  const particleGlow = new THREE.Mesh(glowGeo, glowMat);
  particle.add(particleGlow);

  // Trail particles
  const trail = [];
  for (let i = 0; i < PATH_CONFIG.trailLength; i++) {
    const trailGeo = new THREE.SphereGeometry(0.08 * (1 - i / PATH_CONFIG.trailLength), 8, 8);
    const trailMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0,
    });
    const trailParticle = new THREE.Mesh(trailGeo, trailMat);
    trailParticle.visible = false;
    scene.add(trailParticle);
    trail.push({ mesh: trailParticle, geo: trailGeo, mat: trailMat, position: null });
  }

  // Node glow effects (for when particle reaches each node)
  const nodeGlows = pathNodes.map((node, i) => {
    const glowGeo = new THREE.RingGeometry(0.3, 0.5, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.copy(node.position);
    glow.lookAt(0, 0, 0); // Face center
    scene.add(glow);
    return { mesh: glow, geo: glowGeo, mat: glowMat, triggered: false };
  });

  // Target ghost sphere (solidifies when reached)
  const targetNode = pathNodes[pathNodes.length - 1];
  const ghostGeo = new THREE.SphereGeometry(0.5, 32, 32);
  const ghostMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.2,
    wireframe: true,
  });
  const ghostSphere = new THREE.Mesh(ghostGeo, ghostMat);
  ghostSphere.position.copy(targetNode.position);
  scene.add(ghostSphere);

  // Dashed outline for target
  const outlineGeo = new THREE.TorusGeometry(0.6, 0.02, 8, 32);
  const outlineMat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.5,
  });
  const outline = new THREE.Mesh(outlineGeo, outlineMat);
  outline.position.copy(targetNode.position);
  scene.add(outline);

  // Celebration particles (hidden until path complete)
  const celebrationParticles = [];

  /**
   * Start the path animation
   */
  function start() {
    if (isPlaying) return;
    
    isPlaying = true;
    isPaused = false;
    currentSegment = 0;
    segmentProgress = 0;
    
    // Reset visuals
    lineMaterial.opacity = 0.3;
    particle.position.copy(pathNodes[0].position);
    particle.visible = true;
    
    onPathStart?.();
    
    animate();
  }

  /**
   * Pause the animation
   */
  function pause() {
    isPaused = true;
  }

  /**
   * Resume the animation
   */
  function resume() {
    if (!isPlaying) return;
    isPaused = false;
    animate();
  }

  /**
   * Stop and reset the animation
   */
  function stop() {
    isPlaying = false;
    isPaused = false;
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    
    // Hide particle
    particle.visible = false;
    trail.forEach(t => { t.mesh.visible = false; });
  }

  /**
   * Animation loop
   */
  function animate() {
    if (!isPlaying || isPaused) return;
    
    // Calculate current position on path
    const totalSegments = pathNodes.length - 1;
    const totalProgress = (currentSegment + segmentProgress) / totalSegments;
    
    // Get position on curve
    const position = pathCurve.getPointAt(Math.min(totalProgress, 1));
    particle.position.copy(position);
    
    // Update trail
    trail.forEach((t, i) => {
      if (t.position) {
        t.mesh.position.copy(t.position);
        t.mesh.visible = true;
        t.mat.opacity = (1 - i / PATH_CONFIG.trailLength) * 0.5;
      }
    });
    
    // Shift trail positions
    for (let i = trail.length - 1; i > 0; i--) {
      trail[i].position = trail[i - 1].position?.clone();
    }
    trail[0].position = position.clone();
    
    // Pulse particle glow
    const pulse = 1 + Math.sin(Date.now() * 0.01) * 0.2;
    particleGlow.scale.setScalar(pulse);
    
    // Pulse target outline
    const outlinePulse = 1 + Math.sin(Date.now() * 0.005) * 0.1;
    outline.scale.setScalar(outlinePulse);
    outline.rotation.z += 0.01;
    
    // Check if reached next node
    const nextNode = pathNodes[currentSegment + 1];
    if (nextNode) {
      const distToNext = position.distanceTo(nextNode.position);
      
      if (distToNext < 0.3 && !nodeGlows[currentSegment + 1].triggered) {
        // Trigger node glow
        nodeGlows[currentSegment + 1].triggered = true;
        triggerNodeGlow(currentSegment + 1);
        
        onNodeReached?.(currentSegment + 1, nextNode);
      }
    }
    
    // Advance progress
    segmentProgress += PATH_CONFIG.particleSpeed;
    
    if (segmentProgress >= 1) {
      segmentProgress = 0;
      currentSegment++;
      
      if (currentSegment >= totalSegments) {
        // Path complete!
        completeAnimation();
        return;
      }
    }
    
    animationId = requestAnimationFrame(animate);
  }

  /**
   * Trigger glow effect on a node
   */
  function triggerNodeGlow(nodeIndex) {
    const glow = nodeGlows[nodeIndex];
    if (!glow) return;
    
    glow.mat.opacity = 0.8;
    
    // Animate glow fade
    const fadeStart = Date.now();
    const fadeGlow = () => {
      const elapsed = Date.now() - fadeStart;
      const progress = elapsed / PATH_CONFIG.nodeGlowDuration;
      
      if (progress < 1) {
        glow.mat.opacity = 0.8 * (1 - progress);
        glow.mesh.scale.setScalar(1 + progress * 0.5);
        requestAnimationFrame(fadeGlow);
      } else {
        glow.mat.opacity = 0;
      }
    };
    fadeGlow();
  }

  /**
   * Complete animation with celebration
   */
  function completeAnimation() {
    isPlaying = false;
    
    // Solidify ghost sphere
    ghostMat.wireframe = false;
    ghostMat.opacity = 0.8;
    ghostMat.color.set(color);
    
    // Create celebration particles
    for (let i = 0; i < PATH_CONFIG.celebrationParticles; i++) {
      const pGeo = new THREE.SphereGeometry(0.05, 8, 8);
      const pMat = new THREE.MeshBasicMaterial({
        color: Math.random() > 0.5 ? color : 0xffffff,
        transparent: true,
        opacity: 1,
      });
      const p = new THREE.Mesh(pGeo, pMat);
      p.position.copy(targetNode.position);
      
      // Random velocity
      p.userData.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.2,
        Math.random() * 0.15,
        (Math.random() - 0.5) * 0.2
      );
      
      scene.add(p);
      celebrationParticles.push({ mesh: p, geo: pGeo, mat: pMat });
    }
    
    // Animate celebration
    let celebFrame = 0;
    const animateCelebration = () => {
      celebFrame++;
      
      celebrationParticles.forEach(p => {
        p.mesh.position.add(p.mesh.userData.velocity);
        p.mesh.userData.velocity.y -= 0.005; // Gravity
        p.mat.opacity = Math.max(0, 1 - celebFrame / 60);
      });
      
      if (celebFrame < 60) {
        requestAnimationFrame(animateCelebration);
      } else {
        // Cleanup celebration particles
        celebrationParticles.forEach(p => {
          scene.remove(p.mesh);
          p.geo.dispose();
          p.mat.dispose();
        });
        celebrationParticles.length = 0;
      }
    };
    animateCelebration();
    
    onPathComplete?.();
  }

  /**
   * Cleanup all resources
   */
  function dispose() {
    stop();
    
    scene.remove(pathLine);
    lineGeometry.dispose();
    lineMaterial.dispose();
    
    scene.remove(particle);
    particleGeo.dispose();
    particleMat.dispose();
    glowGeo.dispose();
    glowMat.dispose();
    
    trail.forEach(t => {
      scene.remove(t.mesh);
      t.geo.dispose();
      t.mat.dispose();
    });
    
    nodeGlows.forEach(g => {
      scene.remove(g.mesh);
      g.geo.dispose();
      g.mat.dispose();
    });
    
    scene.remove(ghostSphere);
    ghostGeo.dispose();
    ghostMat.dispose();
    
    scene.remove(outline);
    outlineGeo.dispose();
    outlineMat.dispose();
    
    celebrationParticles.forEach(p => {
      scene.remove(p.mesh);
      p.geo.dispose();
      p.mat.dispose();
    });
  }

  return {
    start,
    pause,
    resume,
    stop,
    dispose,
    isPlaying: () => isPlaying,
    getProgress: () => {
      const totalSegments = pathNodes.length - 1;
      return (currentSegment + segmentProgress) / totalSegments;
    },
  };
}

/**
 * Create a message bubble as a 3D billboard
 * 
 * @param {THREE.Scene} scene - The Three.js scene
 * @param {string} text - Message text
 * @param {THREE.Vector3} position - World position
 * @param {object} options - Style options
 */
export function createMessageBubble(scene, text, position, options = {}) {
  const {
    color = 0x4FFFB0,
    backgroundColor = 0x1a1a2e,
    width = 2,
    height = 0.8,
  } = options;

  // Create billboard plane
  const geometry = new THREE.PlaneGeometry(width, height);
  const material = new THREE.MeshBasicMaterial({
    color: backgroundColor,
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
  });
  
  const bubble = new THREE.Mesh(geometry, material);
  bubble.position.copy(position);
  bubble.position.y += 1; // Float above node
  
  // Border
  const borderGeo = new THREE.PlaneGeometry(width + 0.1, height + 0.1);
  const borderMat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide,
  });
  const border = new THREE.Mesh(borderGeo, borderMat);
  border.position.z = -0.01;
  bubble.add(border);
  
  scene.add(bubble);

  // Note: Text rendering in Three.js/React Native is complex
  // In production, use react-native-gl-model-view or canvas texture
  // For now, the bubble is a placeholder

  return {
    mesh: bubble,
    setText: (newText) => {
      // Would update texture with new text
      console.log('[MessageBubble] Text:', newText);
    },
    setVisible: (visible) => {
      bubble.visible = visible;
    },
    lookAt: (camera) => {
      bubble.quaternion.copy(camera.quaternion);
    },
    dispose: () => {
      scene.remove(bubble);
      geometry.dispose();
      material.dispose();
      borderGeo.dispose();
      borderMat.dispose();
    },
  };
}

export default { createPathAnimation, createMessageBubble };
