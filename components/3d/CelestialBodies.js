/**
 * CelestialBodies - Sun, Moon, Aurora, and Horizon Glow
 *
 * Time-of-day celestial system that creates an immersive atmosphere:
 * - Sun rises/sets based on time
 * - Moon appears at sunset/night
 * - Aurora ribbons at night
 * - Horizon glow matches time theme
 */

import * as THREE from 'three';

// Cached textures
let sunGlowTexture = null;
let moonGlowTexture = null;

/**
 * Create a radial glow texture for sun/moon corona
 */
function createGlowTexture(color1, color2) {
  const size = 128;
  const data = new Uint8Array(size * size * 4);
  const center = size / 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy) / center;

      // Radial falloff
      const alpha = Math.max(0, 1 - dist);
      const softAlpha = Math.pow(alpha, 1.5) * 255;

      const i = (y * size + x) * 4;
      data[i] = 255;     // R
      data[i + 1] = 255; // G
      data[i + 2] = 255; // B
      data[i + 3] = softAlpha; // A
    }
  }

  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Create the Sun with corona glow
 * @param {THREE.Scene} scene
 * @returns {Object} Sun controller
 */
export function createSun(scene) {
  // Sun core (bright center)
  const coreGeo = new THREE.SphereGeometry(2, 32, 32);
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0xFFDD44,
    transparent: true,
    opacity: 1,
  });
  const core = new THREE.Mesh(coreGeo, coreMat);

  // Sun corona (outer glow)
  if (!sunGlowTexture) {
    sunGlowTexture = createGlowTexture();
  }

  const coronaGeo = new THREE.PlaneGeometry(12, 12);
  const coronaMat = new THREE.MeshBasicMaterial({
    map: sunGlowTexture,
    color: 0xFFAA33,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const corona = new THREE.Mesh(coronaGeo, coronaMat);
  corona.renderOrder = -1;

  // Second corona layer for extra glow
  const corona2Geo = new THREE.PlaneGeometry(18, 18);
  const corona2Mat = new THREE.MeshBasicMaterial({
    map: sunGlowTexture,
    color: 0xFF6600,
    transparent: true,
    opacity: 0.3,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const corona2 = new THREE.Mesh(corona2Geo, corona2Mat);
  corona2.renderOrder = -2;

  // Group everything
  const sunGroup = new THREE.Group();
  sunGroup.add(core);
  sunGroup.add(corona);
  sunGroup.add(corona2);

  // Position far in background
  sunGroup.position.set(80, 40, -100);
  sunGroup.visible = false;

  scene.add(sunGroup);

  return {
    group: sunGroup,
    core,
    corona,
    corona2,
    coreMat,
    coronaMat,
    corona2Mat,

    /**
     * Update sun based on time of day
     * @param {string} theme - 'dawn', 'day', 'sunset', 'night'
     * @param {number} time - Animation time
     */
    update: (theme, time) => {
      // Sun visibility and position by theme
      switch (theme) {
        case 'dawn':
          sunGroup.visible = true;
          // Rising from lower right
          sunGroup.position.set(60, -20 + Math.sin(time * 0.1) * 2, -100);
          coreMat.color.setHex(0xFFAA66); // Orange
          coronaMat.color.setHex(0xFF7744);
          corona2Mat.color.setHex(0xFF4422);
          coronaMat.opacity = 0.5;
          break;

        case 'day':
          sunGroup.visible = true;
          // High in sky
          sunGroup.position.set(40, 60 + Math.sin(time * 0.15) * 3, -100);
          coreMat.color.setHex(0xFFEE88); // Yellow-white
          coronaMat.color.setHex(0xFFDD66);
          corona2Mat.color.setHex(0xFFBB44);
          coronaMat.opacity = 0.4;
          break;

        case 'sunset':
          sunGroup.visible = true;
          // Setting to lower left
          sunGroup.position.set(-50, -10 + Math.sin(time * 0.1) * 2, -100);
          coreMat.color.setHex(0xFF6633); // Deep orange
          coronaMat.color.setHex(0xFF4411);
          corona2Mat.color.setHex(0xCC2200);
          coronaMat.opacity = 0.7;
          break;

        case 'night':
          sunGroup.visible = false;
          break;
      }

      // Pulsing corona animation
      if (sunGroup.visible) {
        const pulse = 1 + Math.sin(time * 2) * 0.1;
        corona.scale.setScalar(pulse);
        corona2.scale.setScalar(pulse * 0.95);

        // Corona always faces camera
        corona.lookAt(0, 0, 0);
        corona2.lookAt(0, 0, 0);
      }
    },

    dispose: () => {
      scene.remove(sunGroup);
      coreGeo.dispose();
      coreMat.dispose();
      coronaGeo.dispose();
      coronaMat.dispose();
      corona2Geo.dispose();
      corona2Mat.dispose();
    },
  };
}

/**
 * Create the Moon with crescent shape and glow
 * @param {THREE.Scene} scene
 * @returns {Object} Moon controller
 */
export function createMoon(scene) {
  // Moon body (sphere with crescent shadow)
  const moonGeo = new THREE.SphereGeometry(1.5, 32, 32);
  const moonMat = new THREE.MeshBasicMaterial({
    color: 0xEEEEFF,
    transparent: true,
    opacity: 0.95,
  });
  const moon = new THREE.Mesh(moonGeo, moonMat);

  // Shadow sphere to create crescent effect
  const shadowGeo = new THREE.SphereGeometry(1.4, 32, 32);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000011,
    transparent: true,
    opacity: 0.98,
  });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.position.set(-0.7, 0.3, 0.5); // Offset to create crescent

  // Moon glow
  if (!moonGlowTexture) {
    moonGlowTexture = createGlowTexture();
  }

  const glowGeo = new THREE.PlaneGeometry(8, 8);
  const glowMat = new THREE.MeshBasicMaterial({
    map: moonGlowTexture,
    color: 0x8899FF,
    transparent: true,
    opacity: 0.3,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.renderOrder = -1;

  // Group
  const moonGroup = new THREE.Group();
  moonGroup.add(moon);
  moonGroup.add(shadow);
  moonGroup.add(glow);

  moonGroup.position.set(-70, 50, -90);
  moonGroup.visible = false;

  scene.add(moonGroup);

  return {
    group: moonGroup,
    moon,
    glow,
    moonMat,
    glowMat,

    update: (theme, time) => {
      switch (theme) {
        case 'dawn':
          // Fading out
          moonGroup.visible = true;
          moonGroup.position.set(-60, 30, -90);
          moonMat.opacity = 0.3;
          glowMat.opacity = 0.1;
          break;

        case 'day':
          moonGroup.visible = false;
          break;

        case 'sunset':
          // Appearing
          moonGroup.visible = true;
          moonGroup.position.set(55, 35 + Math.sin(time * 0.2) * 2, -90);
          moonMat.opacity = 0.7;
          glowMat.opacity = 0.2;
          break;

        case 'night':
          // Full brightness
          moonGroup.visible = true;
          moonGroup.position.set(-40, 55 + Math.sin(time * 0.15) * 3, -90);
          moonMat.opacity = 0.95;
          glowMat.opacity = 0.4;
          break;
      }

      // Gentle rotation and glow pulse
      if (moonGroup.visible) {
        moonGroup.rotation.z = Math.sin(time * 0.1) * 0.05;
        const glowPulse = 1 + Math.sin(time * 1.5) * 0.15;
        glow.scale.setScalar(glowPulse);
        glow.lookAt(0, 0, 0);
      }
    },

    dispose: () => {
      scene.remove(moonGroup);
      moonGeo.dispose();
      moonMat.dispose();
      shadowGeo.dispose();
      shadowMat.dispose();
      glowGeo.dispose();
      glowMat.dispose();
    },
  };
}

/**
 * Create Aurora Borealis effect (night only)
 * @param {THREE.Scene} scene
 * @returns {Object} Aurora controller
 */
export function createAurora(scene) {
  // Create ribbon geometry
  const ribbonCount = 3;
  const ribbons = [];

  for (let r = 0; r < ribbonCount; r++) {
    const points = [];
    const segments = 50;
    const width = 80;
    const baseY = 60 + r * 8;

    for (let i = 0; i <= segments; i++) {
      const x = (i / segments - 0.5) * width;
      const y = baseY;
      const z = -80 - r * 10;
      points.push(new THREE.Vector3(x, y, z));
    }

    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeo = new THREE.TubeGeometry(curve, segments, 1.5 - r * 0.3, 8, false);

    // Aurora colors - green/purple gradient
    const colors = [0x00FF88, 0x44FFAA, 0x8844FF];
    const tubeMat = new THREE.MeshBasicMaterial({
      color: colors[r],
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    const ribbon = new THREE.Mesh(tubeGeo, tubeMat);
    scene.add(ribbon);

    ribbons.push({
      mesh: ribbon,
      geo: tubeGeo,
      mat: tubeMat,
      baseY,
      phaseOffset: r * Math.PI * 0.6,
    });
  }

  return {
    ribbons,

    update: (theme, time) => {
      const isNight = theme === 'night';

      ribbons.forEach((ribbon, i) => {
        // Fade in/out based on theme
        const targetOpacity = isNight ? 0.12 - i * 0.02 : 0;
        ribbon.mat.opacity += (targetOpacity - ribbon.mat.opacity) * 0.05;

        if (isNight) {
          // Wave animation
          const phase = time * 0.5 + ribbon.phaseOffset;

          // Update vertex positions for wave effect
          const positions = ribbon.geo.attributes.position.array;
          for (let j = 0; j < positions.length; j += 3) {
            const originalY = ribbon.baseY;
            const x = positions[j];
            const wave = Math.sin(x * 0.05 + phase) * 4;
            const wave2 = Math.sin(x * 0.08 + phase * 1.3) * 2;
            positions[j + 1] = originalY + wave + wave2;
          }
          ribbon.geo.attributes.position.needsUpdate = true;
        }
      });
    },

    dispose: () => {
      ribbons.forEach(ribbon => {
        scene.remove(ribbon.mesh);
        ribbon.geo.dispose();
        ribbon.mat.dispose();
      });
    },
  };
}

/**
 * Create horizon glow effect
 * @param {THREE.Scene} scene
 * @returns {Object} Horizon controller
 */
export function createHorizonGlow(scene) {
  // Large plane at bottom of scene
  const glowGeo = new THREE.PlaneGeometry(200, 60);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0xFF6633,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.position.set(0, -40, -50);
  glow.rotation.x = -Math.PI / 4;

  scene.add(glow);

  // Theme colors
  const themeColors = {
    dawn: 0xFF7744,
    day: 0x4488FF,
    sunset: 0xFF4422,
    night: 0x220044,
  };

  const themeOpacities = {
    dawn: 0.15,
    day: 0.05,
    sunset: 0.2,
    night: 0.03,
  };

  return {
    mesh: glow,
    mat: glowMat,

    update: (theme, time) => {
      const targetColor = themeColors[theme] || 0x220044;
      const targetOpacity = themeOpacities[theme] || 0.05;

      // Smooth color/opacity transition
      glowMat.color.lerp(new THREE.Color(targetColor), 0.02);
      glowMat.opacity += (targetOpacity - glowMat.opacity) * 0.02;

      // Subtle breathing
      const breath = 1 + Math.sin(time * 0.3) * 0.1;
      glow.scale.setScalar(breath);
    },

    dispose: () => {
      scene.remove(glow);
      glowGeo.dispose();
      glowMat.dispose();
    },
  };
}

/**
 * Create complete celestial system
 * @param {THREE.Scene} scene
 * @returns {Object} Celestial system controller
 */
export function createCelestialSystem(scene) {
  const sun = createSun(scene);
  const moon = createMoon(scene);
  const aurora = createAurora(scene);
  const horizon = createHorizonGlow(scene);

  return {
    sun,
    moon,
    aurora,
    horizon,

    /**
     * Update all celestial bodies
     * @param {string} theme - Current time theme
     * @param {number} time - Animation time
     */
    update: (theme, time) => {
      sun.update(theme, time);
      moon.update(theme, time);
      aurora.update(theme, time);
      horizon.update(theme, time);
    },

    dispose: () => {
      sun.dispose();
      moon.dispose();
      aurora.dispose();
      horizon.dispose();
    },
  };
}

export default { createCelestialSystem };
