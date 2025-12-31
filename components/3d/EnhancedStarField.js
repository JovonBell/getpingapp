/**
 * EnhancedStarField - Immersive 3-layer parallax star system
 *
 * Creates a deep space atmosphere with:
 * - Distant stars (dim, slow parallax)
 * - Mid-field stars (twinkle animation)
 * - Close stars (bright, fast parallax)
 * - Pointed star burst textures ✦
 */

import * as THREE from 'three';

// Cached star texture (created once, reused for all layers)
let cachedStarTexture = null;

/**
 * Create a pointed star burst texture ✦ using DataTexture
 * Works in React Native (no canvas/DOM needed)
 */
function createStarTexture() {
  const size = 64;
  const data = new Uint8Array(size * size * 4); // RGBA
  const center = size / 2;

  // Helper to set pixel with alpha blending (max)
  const setPixel = (x, y, alpha) => {
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    const i = (Math.floor(y) * size + Math.floor(x)) * 4;
    const newAlpha = Math.floor(alpha * 255);
    // Use max blending for overlapping spikes
    if (newAlpha > data[i + 3]) {
      data[i] = 255;     // R
      data[i + 1] = 255; // G
      data[i + 2] = 255; // B
      data[i + 3] = newAlpha; // A
    }
  };

  // Draw a spike from center outward at given angle
  const drawSpike = (angle, length, width) => {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const perpCos = Math.cos(angle + Math.PI / 2);
    const perpSin = Math.sin(angle + Math.PI / 2);

    for (let d = 0; d < length; d++) {
      const progress = d / length;
      const alpha = 1 - progress; // Fade out along spike

      // Width tapers toward tip
      const currentWidth = width * (1 - progress * 0.8);

      for (let w = -currentWidth / 2; w <= currentWidth / 2; w++) {
        const x = center + cos * d + perpCos * w;
        const y = center + sin * d + perpSin * w;
        const widthFade = 1 - Math.abs(w) / (currentWidth / 2);
        setPixel(x, y, alpha * widthFade);
      }
    }
  };

  // Draw 4 main spikes (up, down, left, right)
  const spikeLength = center * 0.9;
  const spikeWidth = 5;
  drawSpike(0, spikeLength, spikeWidth);               // Right
  drawSpike(Math.PI, spikeLength, spikeWidth);         // Left
  drawSpike(Math.PI / 2, spikeLength, spikeWidth);     // Down
  drawSpike(-Math.PI / 2, spikeLength, spikeWidth);    // Up

  // Draw 4 smaller diagonal spikes
  const diagLength = spikeLength * 0.5;
  const diagWidth = 3;
  drawSpike(Math.PI / 4, diagLength, diagWidth);
  drawSpike(3 * Math.PI / 4, diagLength, diagWidth);
  drawSpike(-Math.PI / 4, diagLength, diagWidth);
  drawSpike(-3 * Math.PI / 4, diagLength, diagWidth);

  // Draw bright center glow
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 8) {
        const alpha = 1 - dist / 8;
        setPixel(x, y, alpha);
      }
    }
  }

  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Get or create the star texture (cached)
 */
function getStarTexture() {
  if (!cachedStarTexture) {
    cachedStarTexture = createStarTexture();
  }
  return cachedStarTexture;
}

// Layer configurations for different depth perception
const LAYER_CONFIG = {
  distant: {
    count: 1000,
    size: 1.5,
    baseOpacity: 0.25,
    spread: 350,
    parallaxFactor: 0.02,
    color: 0xffffff,
    twinkle: true,
    twinkleSpeed: 0.3,
  },
  mid: {
    count: 500,
    size: 2.5,
    baseOpacity: 0.4,
    spread: 200,
    parallaxFactor: 0.05,
    color: 0xffffff,
    twinkle: true,
    twinkleSpeed: 1.2,
  },
  close: {
    count: 300,
    size: 4.0,
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
    map: getStarTexture(),  // Pointed star burst texture ✦
    alphaTest: 0.01,        // Discard transparent pixels to show star shape ✦
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const stars = new THREE.Points(geometry, material);
  stars.userData = {
    layerName,
    baseOpacity,
    baseSize: size,  // Store base size for twinkle size variation
    twinkle,
    twinkleSpeed: twinkleSpeed || 1,
    parallaxFactor: config.parallaxFactor,
    originalPositions: new Float32Array(positions),
  };

  return stars;
}

/**
 * Update twinkle animation for a star layer
 * VERY aggressive twinkling for that magical living universe feel
 * Uses size variation for more visible twinkling effect
 */
function updateTwinkle(stars, time) {
  if (!stars.userData.twinkle) return;

  const { baseOpacity, twinkleSpeed, currentBrightness = 1.0, baseSize } = stars.userData;

  // Super aggressive twinkling - multiple frequencies for sparkle effect
  const phase = time * twinkleSpeed * 5; // Even faster animation
  const primaryWave = Math.sin(phase) * 0.6;
  const secondaryWave = Math.sin(phase * 3.1 + 1.3) * 0.4;
  const tertiaryWave = Math.sin(phase * 5.7 + 2.7) * 0.3;
  const sparkle = Math.pow(Math.sin(phase * 11.3), 6) * 0.5; // Sharp sparkle bursts

  // Combined variation creates magical twinkling
  const variation = primaryWave + secondaryWave + tertiaryWave + sparkle;

  // Apply brightness multiplier for time-of-day themes
  const adjustedOpacity = baseOpacity * Math.max(0.5, currentBrightness);

  // OPACITY: Range from 0.3 to 1.0 for visible twinkle
  const opacityMultiplier = 0.6 + variation * 0.4;
  stars.material.opacity = Math.max(0.3, Math.min(1.0, adjustedOpacity * opacityMultiplier));

  // SIZE: Also vary the size for more noticeable twinkling effect
  if (baseSize) {
    const sizeMultiplier = 0.8 + variation * 0.3;
    stars.material.size = baseSize * Math.max(0.6, Math.min(1.4, sizeMultiplier));
  }
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
