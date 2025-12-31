/**
 * FloatingParticles - Ethereal drifting dust/sparkle particles
 *
 * Creates an atmospheric effect with tiny glowing particles
 * drifting slowly across the scene, adding life and depth.
 */

import * as THREE from 'three';

// Theme-matching particle colors
const PARTICLE_COLORS = [
  0x4fffb0, // Mint green (primary theme)
  0xffffff, // White
  0x80ffcc, // Pale green
  0xb0ffe0, // Light mint
  0x60ffa0, // Bright green
];

// Configuration
const DEFAULT_CONFIG = {
  count: 150,
  minSize: 0.03,
  maxSize: 0.12,
  spreadX: 35,
  spreadY: 25,
  spreadZ: 20,
  baseOpacity: 0.5,
  velocityRange: 0.003,
};

const LOW_QUALITY_CONFIG = {
  ...DEFAULT_CONFIG,
  count: 50,
  baseOpacity: 0.4,
};

/**
 * Create the floating particles system
 * @param {THREE.Scene} scene - The Three.js scene
 * @param {boolean} highQuality - Whether to use high quality settings
 * @returns {Object} Particles controller with update and dispose methods
 */
export function createFloatingParticles(scene, highQuality = true) {
  const config = highQuality ? DEFAULT_CONFIG : LOW_QUALITY_CONFIG;
  const { count, minSize, maxSize, spreadX, spreadY, spreadZ, baseOpacity, velocityRange } = config;

  // Allocate arrays
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const colors = new Float32Array(count * 3);
  const phases = new Float32Array(count); // For individual twinkle

  for (let i = 0; i < count; i++) {
    // Random positions within bounds
    positions[i * 3] = (Math.random() - 0.5) * spreadX;
    positions[i * 3 + 1] = (Math.random() - 0.5) * spreadY;
    positions[i * 3 + 2] = (Math.random() - 0.5) * spreadZ;

    // Slow random velocities with bias toward gentle upward drift
    velocities[i * 3] = (Math.random() - 0.5) * velocityRange;
    velocities[i * 3 + 1] = (Math.random() - 0.3) * velocityRange; // Slight upward bias
    velocities[i * 3 + 2] = (Math.random() - 0.5) * velocityRange * 0.5;

    // Random sizes
    sizes[i] = minSize + Math.random() * (maxSize - minSize);

    // Random color from palette
    const color = new THREE.Color(PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)]);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;

    // Random phase for twinkle
    phases[i] = Math.random() * Math.PI * 2;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.08,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: baseOpacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const particles = new THREE.Points(geometry, material);
  scene.add(particles);

  // Store references for updates
  const state = {
    positions: geometry.attributes.position.array,
    velocities,
    phases,
    bounds: { x: spreadX / 2, y: spreadY / 2, z: spreadZ / 2 },
  };

  return {
    mesh: particles,

    /**
     * Update particle positions (call in animation loop)
     * @param {number} time - Current time in seconds (optional, for twinkle)
     */
    update: (time = 0) => {
      const pos = state.positions;
      const vel = state.velocities;
      const { x: bx, y: by, z: bz } = state.bounds;

      for (let i = 0; i < count; i++) {
        // Update positions
        pos[i * 3] += vel[i * 3];
        pos[i * 3 + 1] += vel[i * 3 + 1];
        pos[i * 3 + 2] += vel[i * 3 + 2];

        // Wrap around when out of bounds (seamless loop)
        if (pos[i * 3] > bx) pos[i * 3] = -bx;
        if (pos[i * 3] < -bx) pos[i * 3] = bx;
        if (pos[i * 3 + 1] > by) pos[i * 3 + 1] = -by;
        if (pos[i * 3 + 1] < -by) pos[i * 3 + 1] = by;
        if (pos[i * 3 + 2] > bz) pos[i * 3 + 2] = -bz;
        if (pos[i * 3 + 2] < -bz) pos[i * 3 + 2] = bz;

        // Subtle velocity variation (gentle wandering)
        vel[i * 3] += (Math.random() - 0.5) * 0.00005;
        vel[i * 3 + 1] += (Math.random() - 0.5) * 0.00005;

        // Clamp velocities
        const maxVel = velocityRange * 1.5;
        vel[i * 3] = Math.max(-maxVel, Math.min(maxVel, vel[i * 3]));
        vel[i * 3 + 1] = Math.max(-maxVel, Math.min(maxVel, vel[i * 3 + 1]));
        vel[i * 3 + 2] = Math.max(-maxVel, Math.min(maxVel, vel[i * 3 + 2]));
      }

      geometry.attributes.position.needsUpdate = true;

      // Subtle overall opacity pulse
      if (time) {
        const pulse = 1 + Math.sin(time * 0.5) * 0.1;
        material.opacity = baseOpacity * pulse;
      }
    },

    /**
     * Set overall visibility
     */
    setVisible: (visible) => {
      particles.visible = visible;
    },

    /**
     * Clean up resources
     */
    dispose: () => {
      geometry.dispose();
      material.dispose();
      scene.remove(particles);
    },
  };
}

export default { createFloatingParticles };
