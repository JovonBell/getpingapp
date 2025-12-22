/**
 * StarField - Layered background system for 3D depth perception
 * 
 * Creates three layers:
 * 1. Distant stars (slow parallax, dim)
 * 2. Nebula wisps (soft gradients)
 * 3. Close stars (brighter, subtle twinkle)
 */

import * as THREE from 'three';

// Layer configuration
const LAYER_CONFIG = {
  distant: {
    count: 500,
    size: 0.5,
    opacity: 0.1,
    spread: 300,
    color: 0xffffff,
  },
  close: {
    count: 200,
    size: 1.0,
    opacity: 0.2,
    spread: 150,
    color: 0xffffff,
    twinkle: true,
  },
  nebula: {
    opacity: 0.05,
    colors: [0x4a0080, 0x000080, 0x004040],
  },
};

/**
 * Create all background layers and add to scene
 */
export function createBackgroundLayers(scene) {
  const distantStars = createStarLayer(LAYER_CONFIG.distant);
  const closeStars = createStarLayer(LAYER_CONFIG.close);
  const nebula = createNebulaLayer(LAYER_CONFIG.nebula);

  scene.add(distantStars);
  scene.add(nebula);
  scene.add(closeStars);

  return {
    distantStars,
    closeStars,
    nebula,
    
    // Update function for twinkle animation
    update: (time) => {
      updateTwinkle(closeStars, time);
    },
    
    // Parallax update based on camera position
    updateParallax: (cameraPosition) => {
      // Distant stars move slower (parallax effect)
      distantStars.position.x = -cameraPosition.x * 0.02;
      distantStars.position.y = -cameraPosition.y * 0.02;
      
      // Close stars move faster
      closeStars.position.x = -cameraPosition.x * 0.05;
      closeStars.position.y = -cameraPosition.y * 0.05;
    },
    
    // Cleanup function
    dispose: () => {
      distantStars.geometry.dispose();
      distantStars.material.dispose();
      closeStars.geometry.dispose();
      closeStars.material.dispose();
      nebula.geometry.dispose();
      nebula.material.dispose();
    },
  };
}

/**
 * Create a star layer with specified configuration
 */
function createStarLayer({ count, size, opacity, spread, color, twinkle = false }) {
  const positions = new Float32Array(count * 3);
  const sizes = twinkle ? new Float32Array(count) : null;
  const baseOpacities = twinkle ? new Float32Array(count) : null;
  
  for (let i = 0; i < count; i++) {
    // Distribute in sphere
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = spread * (0.5 + Math.random() * 0.5);
    
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
    
    if (twinkle) {
      sizes[i] = size * (0.5 + Math.random() * 0.5);
      baseOpacities[i] = opacity * (0.5 + Math.random() * 0.5);
    }
  }
  
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
  if (twinkle) {
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('baseOpacity', new THREE.BufferAttribute(baseOpacities, 1));
  }
  
  const material = new THREE.PointsMaterial({
    size,
    sizeAttenuation: true,
    transparent: true,
    opacity,
    color,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  
  const stars = new THREE.Points(geometry, material);
  stars.userData.twinkle = twinkle;
  stars.userData.baseOpacity = opacity;
  
  return stars;
}

/**
 * Create nebula layer with soft gradients
 */
function createNebulaLayer({ opacity, colors }) {
  // Create a large sphere with gradient texture for nebula effect
  const geometry = new THREE.SphereGeometry(400, 32, 32);
  
  // Create gradient texture
  const canvas = document.createElement ? 
    createNebulaCanvas(colors, opacity) : 
    null;
  
  let material;
  
  if (canvas) {
    const texture = new THREE.CanvasTexture(canvas);
    material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.BackSide,
      transparent: true,
      opacity: opacity * 2,
      depthWrite: false,
    });
  } else {
    // Fallback for React Native (no document.createElement)
    // Use a simple colored material
    material = new THREE.MeshBasicMaterial({
      color: colors[0],
      side: THREE.BackSide,
      transparent: true,
      opacity: opacity,
      depthWrite: false,
    });
  }
  
  return new THREE.Mesh(geometry, material);
}

/**
 * Create canvas with nebula gradient (web only)
 */
function createNebulaCanvas(colors, opacity) {
  if (typeof document === 'undefined') return null;
  
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  // Create radial gradient
  const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
  
  colors.forEach((color, i) => {
    const hex = color.toString(16).padStart(6, '0');
    const stop = i / (colors.length - 1);
    gradient.addColorStop(stop, `#${hex}`);
  });
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);
  
  return canvas;
}

/**
 * Update twinkle effect for star layer
 */
function updateTwinkle(stars, time) {
  if (!stars.userData.twinkle) return;
  
  const baseOpacity = stars.userData.baseOpacity;
  const twinkleSpeed = 2;
  const twinkleAmount = 0.3;
  
  // Subtle opacity variation
  const variation = Math.sin(time * twinkleSpeed) * twinkleAmount;
  stars.material.opacity = baseOpacity * (1 + variation);
}

/**
 * Create a simple star field for React Native
 * (Simplified version without canvas textures)
 */
export function createSimpleStarField(scene, totalCount = 700) {
  const positions = new Float32Array(totalCount * 3);
  const colors = new Float32Array(totalCount * 3);
  const sizes = new Float32Array(totalCount);
  
  for (let i = 0; i < totalCount; i++) {
    // Distribute in sphere
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    
    // Mix of near and far stars
    const isNear = i < totalCount * 0.3;
    const spread = isNear ? 100 : 250;
    const r = spread * (0.5 + Math.random() * 0.5);
    
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
    
    // Slight color variation (white to pale blue/purple)
    const colorVariation = Math.random();
    colors[i * 3] = 0.9 + colorVariation * 0.1; // R
    colors[i * 3 + 1] = 0.9 + colorVariation * 0.1; // G
    colors[i * 3 + 2] = 1.0; // B (always full)
    
    // Size variation
    sizes[i] = isNear ? 
      1.0 + Math.random() * 0.5 : 
      0.3 + Math.random() * 0.3;
  }
  
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  
  const material = new THREE.PointsMaterial({
    size: 1,
    sizeAttenuation: true,
    vertexColors: true,
    transparent: true,
    opacity: 0.15,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  
  const stars = new THREE.Points(geometry, material);
  scene.add(stars);
  
  return {
    mesh: stars,
    update: (time, cameraPosition) => {
      // Subtle twinkle
      material.opacity = 0.15 + Math.sin(time * 0.5) * 0.02;
      
      // Parallax
      if (cameraPosition) {
        stars.position.x = -cameraPosition.x * 0.03;
        stars.position.y = -cameraPosition.y * 0.03;
      }
    },
    dispose: () => {
      geometry.dispose();
      material.dispose();
    },
  };
}

export default { createBackgroundLayers, createSimpleStarField };
