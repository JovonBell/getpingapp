/**
 * NucleusGlow - Dramatic pulsing center representing "you"
 *
 * Creates a mesmerizing nucleus at the center of the universe
 * with multiple glow layers and a heartbeat pulse animation.
 * This is where all your contacts orbit around.
 */

import * as THREE from 'three';

// Default configuration - Enhanced for living universe feel
const DEFAULT_CONFIG = {
  coreRadius: 0.6,
  primaryColor: 0x4fffb0, // Theme mint green
  coreColor: 0xffffff,
  glowLayers: 4,
  pulseSpeed: 1.8, // Slightly faster heartbeat
  breathSpeed: 0.6, // Slower, deeper breathing
  breathAmplitude: 0.12, // More noticeable breathing (was 0.06)
  lightIntensity: 1.4,
  lightDistance: 40,
};

const LOW_QUALITY_CONFIG = {
  ...DEFAULT_CONFIG,
  glowLayers: 2,
  lightIntensity: 0.8,
};

/**
 * Create the nucleus glow system
 * @param {THREE.Scene} scene - The Three.js scene
 * @param {Object} options - Configuration options
 * @param {boolean} highQuality - Whether to use high quality settings
 * @returns {Object} Nucleus controller with update and dispose methods
 */
export function createNucleus(scene, options = {}, highQuality = true) {
  const baseConfig = highQuality ? DEFAULT_CONFIG : LOW_QUALITY_CONFIG;
  const config = { ...baseConfig, ...options };
  const { coreRadius, primaryColor, coreColor, glowLayers, lightIntensity, lightDistance } = config;

  const nucleus = new THREE.Group();
  const materials = [];
  const meshes = [];

  // Layer 1: Solid bright core
  const coreGeo = new THREE.SphereGeometry(coreRadius, 32, 32);
  const coreMat = new THREE.MeshBasicMaterial({
    color: coreColor,
    transparent: true,
    opacity: 0.95,
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  nucleus.add(core);
  materials.push(coreMat);
  meshes.push({ mesh: core, type: 'core', baseScale: 1 });

  // Layer 2: Inner emissive glow
  const innerGlowGeo = new THREE.SphereGeometry(coreRadius * 1.15, 24, 24);
  const innerGlowMat = new THREE.MeshBasicMaterial({
    color: primaryColor,
    transparent: true,
    opacity: 0.6,
    side: THREE.BackSide,
  });
  const innerGlow = new THREE.Mesh(innerGlowGeo, innerGlowMat);
  nucleus.add(innerGlow);
  materials.push(innerGlowMat);
  meshes.push({ mesh: innerGlow, type: 'innerGlow', baseScale: 1.15 });

  // Layer 3: Mid glow (pulses strongly)
  const midGlowGeo = new THREE.SphereGeometry(coreRadius * 1.6, 24, 24);
  const midGlowMat = new THREE.MeshBasicMaterial({
    color: primaryColor,
    transparent: true,
    opacity: 0.25,
    side: THREE.BackSide,
  });
  const midGlow = new THREE.Mesh(midGlowGeo, midGlowMat);
  nucleus.add(midGlow);
  materials.push(midGlowMat);
  meshes.push({ mesh: midGlow, type: 'midGlow', baseScale: 1.6, baseOpacity: 0.25 });

  // Layer 4: Outer corona (breathes slowly)
  if (glowLayers >= 3) {
    const outerGlowGeo = new THREE.SphereGeometry(coreRadius * 2.2, 20, 20);
    const outerGlowMat = new THREE.MeshBasicMaterial({
      color: primaryColor,
      transparent: true,
      opacity: 0.12,
      side: THREE.BackSide,
    });
    const outerGlow = new THREE.Mesh(outerGlowGeo, outerGlowMat);
    nucleus.add(outerGlow);
    materials.push(outerGlowMat);
    meshes.push({ mesh: outerGlow, type: 'outerGlow', baseScale: 2.2, baseOpacity: 0.12 });
  }

  // Layer 5: Far corona (very subtle)
  if (glowLayers >= 4) {
    const farGlowGeo = new THREE.SphereGeometry(coreRadius * 3.0, 16, 16);
    const farGlowMat = new THREE.MeshBasicMaterial({
      color: primaryColor,
      transparent: true,
      opacity: 0.05,
      side: THREE.BackSide,
    });
    const farGlow = new THREE.Mesh(farGlowGeo, farGlowMat);
    nucleus.add(farGlow);
    materials.push(farGlowMat);
    meshes.push({ mesh: farGlow, type: 'farGlow', baseScale: 3.0, baseOpacity: 0.05 });
  }

  // Point light emanating from nucleus
  const pointLight = new THREE.PointLight(primaryColor, lightIntensity, lightDistance);
  pointLight.position.set(0, 0, 0);
  nucleus.add(pointLight);

  // Add nucleus group to scene at origin
  nucleus.position.set(0, 0, 0);
  scene.add(nucleus);

  // Store state for animation
  const state = {
    meshes,
    materials,
    pointLight,
    config,
  };

  return {
    group: nucleus,
    pointLight,

    /**
     * Update nucleus animation (call in animation loop)
     * @param {number} time - Current time in seconds
     */
    update: (time) => {
      const { pulseSpeed, breathSpeed, breathAmplitude = 0.12 } = config;

      // Heartbeat pulse (faster, sharp) - more noticeable
      const heartbeat = 1 + Math.pow(Math.sin(time * pulseSpeed * Math.PI), 2) * 0.15;

      // Breathing (slow, smooth) - deeper and more obvious
      const breath = 1 + Math.sin(time * breathSpeed) * breathAmplitude;

      // Combined pulse
      const pulse = heartbeat * breath;

      meshes.forEach(({ mesh, type, baseScale, baseOpacity }) => {
        switch (type) {
          case 'core':
            // Core pulses tightly
            mesh.scale.setScalar(pulse);
            break;

          case 'innerGlow':
            // Inner glow follows core closely
            mesh.scale.setScalar(baseScale * pulse * 1.02);
            break;

          case 'midGlow':
            // Mid glow pulses opposite phase for depth
            const midPulse = 1 + Math.sin(time * pulseSpeed + Math.PI * 0.5) * 0.15;
            mesh.scale.setScalar(baseScale * midPulse);
            mesh.material.opacity = baseOpacity * (0.8 + Math.sin(time * 2) * 0.2);
            break;

          case 'outerGlow':
            // Outer corona breathes slowly
            const outerBreath = 1 + Math.sin(time * breathSpeed * 0.7) * 0.2;
            mesh.scale.setScalar(baseScale * outerBreath);
            mesh.material.opacity = baseOpacity * (0.7 + Math.sin(time * 0.5) * 0.3);
            break;

          case 'farGlow':
            // Far corona expands very slowly
            const farBreath = 1 + Math.sin(time * 0.3) * 0.25;
            mesh.scale.setScalar(baseScale * farBreath);
            mesh.material.opacity = baseOpacity * (0.6 + Math.sin(time * 0.4) * 0.4);
            break;
        }
      });

      // Point light intensity pulses with heartbeat
      pointLight.intensity = lightIntensity * (0.85 + heartbeat * 0.15);
    },

    /**
     * Change the primary color
     */
    setColor: (newColor) => {
      const color = new THREE.Color(newColor);
      materials.forEach((mat, i) => {
        if (i > 0) { // Skip core (stays white)
          mat.color = color;
        }
      });
      pointLight.color = color;
    },

    /**
     * Set overall visibility
     */
    setVisible: (visible) => {
      nucleus.visible = visible;
    },

    /**
     * Get position for raycasting
     */
    getPosition: () => nucleus.position.clone(),

    /**
     * Get bounding sphere for tap detection
     */
    getBoundingSphere: () => {
      return new THREE.Sphere(nucleus.position, coreRadius * 2);
    },

    /**
     * Clean up resources
     */
    dispose: () => {
      meshes.forEach(({ mesh }) => {
        mesh.geometry.dispose();
      });
      materials.forEach(mat => mat.dispose());
      scene.remove(nucleus);
    },
  };
}

export default { createNucleus };
