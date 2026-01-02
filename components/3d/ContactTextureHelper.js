/**
 * ContactTextureHelper - Utilities for loading contact photos as 3D textures
 *
 * Handles:
 * - Loading contact photos as THREE.Texture
 * - Generating initials-based fallback textures
 * - Caching loaded textures for performance
 */

import * as THREE from 'three';
import { TextureLoader } from 'expo-three';

// Texture cache to avoid reloading
const textureCache = new Map();

// Color palette for initials backgrounds (based on name hash)
const INITIALS_COLORS = [
  '#4FFFB0', // Mint green (primary)
  '#FF6B6B', // Coral red
  '#4F9FFF', // Electric blue
  '#FFD93D', // Golden yellow
  '#B04FFF', // Nebula purple
  '#FF4F9F', // Rose pink
  '#4ECDC4', // Teal
  '#FF9F4F', // Solar orange
];

/**
 * Get a consistent color based on contact name
 */
function getColorForName(name) {
  const str = String(name || '');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return INITIALS_COLORS[Math.abs(hash) % INITIALS_COLORS.length];
}

/**
 * Load a contact's photo as a texture
 * @param {string} uri - The photo URI
 * @param {number} timeout - Timeout in ms (default 5000)
 * @returns {Promise<THREE.Texture|null>}
 */
export async function loadContactTexture(uri, timeout = 5000) {
  if (!uri) return null;

  // Check cache first
  if (textureCache.has(uri)) {
    return textureCache.get(uri);
  }

  try {
    const textureLoader = new TextureLoader();
    const texturePromise = textureLoader.loadAsync(uri);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Texture load timeout')), timeout)
    );

    const texture = await Promise.race([texturePromise, timeoutPromise]);

    // Configure texture
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    // Cache it
    textureCache.set(uri, texture);

    return texture;
  } catch (err) {
    console.warn('[ContactTextureHelper] Failed to load texture:', err?.message);
    return null;
  }
}

/**
 * Create a material for a contact sphere
 * @param {Object} contact - Contact data with optional thumbnail
 * @param {string} healthColor - Hex color for health status
 * @param {boolean} loadPhoto - Whether to attempt loading photo
 * @returns {THREE.Material}
 */
export function createContactMaterial(contact, healthColor = '#4FFFB0', loadPhoto = true) {
  const baseColor = contact?.thumbnail ? 0xffffff : getColorForName(contact?.name);

  const material = new THREE.MeshStandardMaterial({
    color: baseColor,
    transparent: true,
    opacity: 0.92,
    metalness: 0.2,
    roughness: 0.5,
    emissive: new THREE.Color(healthColor),
    emissiveIntensity: 0.15,
  });

  // If contact has a thumbnail, load it asynchronously
  if (loadPhoto && contact?.thumbnail) {
    loadContactTexture(contact.thumbnail).then((texture) => {
      if (texture) {
        material.map = texture;
        material.needsUpdate = true;
      }
    }).catch((err) => {
      // Texture load failed - contact will display with initials/color instead
      console.warn('[ContactTextureHelper] Failed to load contact texture:', err?.message || err);
    });
  }

  return material;
}

/**
 * Create a glowing ring around a contact sphere
 * Creates a beautiful aesthetic border effect with:
 * - Inner bright border ring (white/cyan)
 * - Outer soft health-colored glow
 * @param {number} radius - Sphere radius
 * @param {string} color - Hex color for health status
 * @returns {THREE.Group} Group containing border and glow meshes
 */
export function createContactGlow(radius, color) {
  const group = new THREE.Group();

  // Inner bright border ring - gives photos a crisp circular frame
  const borderGeo = new THREE.TorusGeometry(radius * 1.02, 0.025, 8, 32);
  const borderMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.7,
  });
  const border = new THREE.Mesh(borderGeo, borderMat);
  border.rotation.x = Math.PI / 2; // Lay flat around equator
  group.add(border);

  // Second border ring at different angle for 3D effect
  const border2 = new THREE.Mesh(borderGeo, borderMat.clone());
  border2.rotation.y = Math.PI / 2;
  group.add(border2);

  // Outer soft glow sphere - health-colored aura
  const glowGeo = new THREE.SphereGeometry(radius * 1.2, 16, 16);
  const glowMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(color),
    transparent: true,
    opacity: 0.25,
    side: THREE.BackSide,
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  group.add(glow);

  // Store references for cleanup
  group.userData = {
    borderGeo,
    borderMat,
    border2Mat: border2.material,
    glowGeo,
    glowMat,
    dispose: () => {
      borderGeo.dispose();
      borderMat.dispose();
      border2.material.dispose();
      glowGeo.dispose();
      glowMat.dispose();
    }
  };

  return group;
}

/**
 * Clear the texture cache (call on unmount)
 */
export function clearTextureCache() {
  textureCache.forEach((texture) => {
    texture.dispose();
  });
  textureCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    size: textureCache.size,
    keys: Array.from(textureCache.keys()),
  };
}

export default {
  loadContactTexture,
  createContactMaterial,
  createContactGlow,
  clearTextureCache,
  getCacheStats,
};
