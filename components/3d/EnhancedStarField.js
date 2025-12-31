/**
 * EnhancedStarField - Immersive 3-layer parallax star system
 *
 * Creates a deep space atmosphere with:
 * - Distant stars (dim, slow parallax)
 * - Mid-field stars (twinkle animation)
 * - Close stars (bright, fast parallax)
 */

import * as THREE from 'three';

// Layer configurations for different depth perception
const LAYER_CONFIG = {
  distant: {
    count: 1000,
    size: 0.5,
    baseOpacity: 0.25,
    spread: 350,
    parallaxFactor: 0.02,
    color: 0xffffff,
    twinkle: true,
    twinkleSpeed: 0.3,
  },
  mid: {
    count: 500,
    size: 0.9,
    baseOpacity: 0.4,
    spread: 200,
    parallaxFactor: 0.05,
    color: 0xffffff,
    twinkle: true,
    twinkleSpeed: 1.2,
  },
  close: {
    count: 300,
    size: 1.4,
    baseOpacity: 0.7,
    spread: 100,
    parallaxFactor: 0.1,
    color: 0xffffff,
    twinkle: true,
    twinkleSpeed: 2.5,
  },
};

// Low quality config for older devices
const LOW_QUALITY_CONFIG = {
  distant: { ...LAYER_CONFIG.distant, count: 300 },
  mid: { ...LAYER_CONFIG.mid, count: 150 },
  close: { ...LAYER_CONFIG.close, count: 80 },
};

/**
 * Create a single star layer
 */
function createStarLayer(config, layerName) {
  const { count, size, baseOpacity, spread, color, twinkle, twinkleSpeed } = config;

  const positions = new Float32Array(count * 3);
  const phases = new Float32Array(count); // For twinkle offset
  const sizes = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    // Distribute stars in a sphere around the camera
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = spread * (0.4 + Math.random() * 0.6);

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);

    // Random phase offset for non-uniform twinkling
    phases[i] = Math.random() * Math.PI * 2;

    // Slight size variation
    sizes[i] = size * (0.7 + Math.random() * 0.6);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const material = new THREE.PointsMaterial({
    size,
    sizeAttenuation: true,
    transparent: true,
    opacity: baseOpacity,
    color,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const stars = new THREE.Points(geometry, material);
  stars.userData = {
    layerName,
    baseOpacity,
    twinkle,
    twinkleSpeed: twinkleSpeed || 1,
    parallaxFactor: config.parallaxFactor,
    originalPositions: new Float32Array(positions),
  };

  return stars;
}

/**
 * Update twinkle animation for a star layer
 * Now with more aggressive twinkling for that living universe feel
 */
function updateTwinkle(stars, time) {
  if (!stars.userData.twinkle) return;

  const { baseOpacity, twinkleSpeed, currentBrightness = 1.0 } = stars.userData;
  const phases = stars.geometry.attributes.phase?.array;

  if (!phases) return;

  // More aggressive twinkling - combine multiple frequencies
  const layerPhase = time * twinkleSpeed;
  const primaryWave = Math.sin(layerPhase) * 0.4;
  const secondaryWave = Math.sin(layerPhase * 2.3) * 0.2;
  const tertiaryWave = Math.sin(layerPhase * 0.7) * 0.15;

  // Combined variation creates more organic, less predictable twinkling
  const variation = primaryWave + secondaryWave + tertiaryWave;

  // Apply brightness multiplier for time-of-day themes
  const adjustedOpacity = baseOpacity * currentBrightness;
  stars.material.opacity = Math.max(0.1, adjustedOpacity * (1 + variation));
}

/**
 * Update parallax position based on camera
 */
function updateParallax(stars, cameraPosition) {
  const { parallaxFactor } = stars.userData;

  stars.position.x = -cameraPosition.x * parallaxFactor;
  stars.position.y = -cameraPosition.y * parallaxFactor;
  stars.position.z = -cameraPosition.z * parallaxFactor * 0.5;
}

/**
 * Create the complete enhanced star field
 * @param {THREE.Scene} scene - The Three.js scene
 * @param {boolean} highQuality - Whether to use high quality settings
 * @returns {Object} Star field controller with update and dispose methods
 */
export function createEnhancedStarField(scene, highQuality = true) {
  const config = highQuality ? LAYER_CONFIG : LOW_QUALITY_CONFIG;

  // Create all three layers
  const distantStars = createStarLayer(config.distant, 'distant');
  const midStars = createStarLayer(config.mid, 'mid');
  const closeStars = createStarLayer(config.close, 'close');

  // Add to scene in order (back to front)
  scene.add(distantStars);
  scene.add(midStars);
  scene.add(closeStars);

  const layers = [distantStars, midStars, closeStars];

  return {
    layers,

    /**
     * Update all star layers (call in animation loop)
     * @param {number} time - Current time in seconds
     * @param {THREE.Vector3} cameraPosition - Current camera position
     */
    update: (time, cameraPosition) => {
      layers.forEach(layer => {
        updateTwinkle(layer, time);
        if (cameraPosition) {
          updateParallax(layer, cameraPosition);
        }
      });
    },

    /**
     * Set overall visibility
     */
    setVisible: (visible) => {
      layers.forEach(layer => {
        layer.visible = visible;
      });
    },

    /**
     * Set brightness multiplier (for time-of-day themes)
     * @param {number} brightness - Multiplier (0.0 to 1.0+)
     */
    setBrightness: (brightness) => {
      layers.forEach(layer => {
        const baseOpacity = layer.userData.baseOpacity;
        layer.userData.currentBrightness = brightness;
        // Will be applied during twinkle update
      });
    },

    /**
     * Clean up resources
     */
    dispose: () => {
      layers.forEach(layer => {
        layer.geometry.dispose();
        layer.material.dispose();
        scene.remove(layer);
      });
    },
  };
}

export default { createEnhancedStarField };
