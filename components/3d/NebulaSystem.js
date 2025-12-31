/**
 * NebulaSystem - Colorful cosmic cloud backgrounds
 *
 * Creates an ethereal atmosphere with soft, glowing nebula clouds
 * floating in the far background. Uses vertex-colored geometry
 * since React Native doesn't support canvas texture generation.
 */

import * as THREE from 'three';

// Nebula color palette - deep space colors
const NEBULA_COLORS = [
  0x4a0080, // Deep purple
  0x2a0050, // Dark purple
  0x004060, // Deep teal
  0x003040, // Dark teal
  0x102018, // Dark green (theme-matching)
  0x1a0030, // Violet
  0x002030, // Ocean blue
  0x0a1a0a, // Forest green
];

// Configuration
const DEFAULT_CONFIG = {
  count: 8,
  minSize: 60,
  maxSize: 140,
  spread: 280,
  depthMin: -120,
  depthMax: -250,
  baseOpacity: 0.04,
  driftSpeed: 0.0001,
};

const LOW_QUALITY_CONFIG = {
  ...DEFAULT_CONFIG,
  count: 3,
  baseOpacity: 0.03,
};

/**
 * Create a single nebula cloud using vertex-colored icosahedron
 */
function createNebulaCloud(color, size, opacity) {
  // Use icosahedron for soft, organic shape
  const geometry = new THREE.IcosahedronGeometry(size, 2);

  // Deform vertices for organic look
  const positions = geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const z = positions.getZ(i);

    // Random displacement for organic shape
    const noise = 0.7 + Math.random() * 0.6;
    positions.setXYZ(i, x * noise, y * noise, z * noise);
  }

  geometry.computeVertexNormals();

  // Create gradient colors from center to edge
  const colors = new Float32Array(positions.count * 3);
  const baseColor = new THREE.Color(color);

  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const z = positions.getZ(i);
    const dist = Math.sqrt(x * x + y * y + z * z);
    const maxDist = size * 1.3;

    // Fade from bright center to transparent edge
    const factor = 1 - Math.min(dist / maxDist, 1);
    const adjustedFactor = Math.pow(factor, 0.5); // Softer falloff

    colors[i * 3] = baseColor.r * adjustedFactor;
    colors[i * 3 + 1] = baseColor.g * adjustedFactor;
    colors[i * 3 + 2] = baseColor.b * adjustedFactor;
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.MeshBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  return new THREE.Mesh(geometry, material);
}

/**
 * Create the complete nebula system
 * @param {THREE.Scene} scene - The Three.js scene
 * @param {boolean} highQuality - Whether to use high quality settings
 * @returns {Object} Nebula controller with update and dispose methods
 */
export function createNebulaSystem(scene, highQuality = true) {
  const config = highQuality ? DEFAULT_CONFIG : LOW_QUALITY_CONFIG;
  const { count, minSize, maxSize, spread, depthMin, depthMax, baseOpacity, driftSpeed } = config;

  const nebulas = [];

  for (let i = 0; i < count; i++) {
    const color = NEBULA_COLORS[i % NEBULA_COLORS.length];
    const size = minSize + Math.random() * (maxSize - minSize);
    const opacity = baseOpacity * (0.6 + Math.random() * 0.8);

    const cloud = createNebulaCloud(color, size, opacity);

    // Position in far background
    cloud.position.set(
      (Math.random() - 0.5) * spread,
      (Math.random() - 0.5) * spread * 0.6,
      depthMin + Math.random() * (depthMax - depthMin)
    );

    // Random rotation for variety
    cloud.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );

    scene.add(cloud);

    nebulas.push({
      mesh: cloud,
      driftSpeed: driftSpeed * (0.5 + Math.random()),
      rotationSpeed: {
        x: (Math.random() - 0.5) * 0.0001,
        y: (Math.random() - 0.5) * 0.0001,
        z: (Math.random() - 0.5) * 0.0001,
      },
      phaseOffset: Math.random() * Math.PI * 2,
    });
  }

  return {
    nebulas,

    /**
     * Update nebula animations (call in animation loop)
     * @param {number} time - Current time in seconds
     */
    update: (time) => {
      nebulas.forEach((nebula, i) => {
        // Slow drift animation
        nebula.mesh.position.x += Math.sin(time * 0.1 + nebula.phaseOffset) * nebula.driftSpeed;
        nebula.mesh.position.y += Math.cos(time * 0.08 + nebula.phaseOffset) * nebula.driftSpeed * 0.5;

        // Very slow rotation
        nebula.mesh.rotation.x += nebula.rotationSpeed.x;
        nebula.mesh.rotation.y += nebula.rotationSpeed.y;
        nebula.mesh.rotation.z += nebula.rotationSpeed.z;

        // Subtle opacity pulse
        const baseMat = nebula.mesh.material;
        const pulse = 1 + Math.sin(time * 0.2 + i * 0.5) * 0.15;
        baseMat.opacity = config.baseOpacity * pulse;
      });
    },

    /**
     * Set overall visibility
     */
    setVisible: (visible) => {
      nebulas.forEach(n => {
        n.mesh.visible = visible;
      });
    },

    /**
     * Clean up resources
     */
    dispose: () => {
      nebulas.forEach(n => {
        n.mesh.geometry.dispose();
        n.mesh.material.dispose();
        scene.remove(n.mesh);
      });
    },
  };
}

export default { createNebulaSystem };
