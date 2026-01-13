/**
 * Camera Animation Utilities
 *
 * GSAP-based camera transitions for Apple Astronomy-style smooth animations.
 * All transitions use power3.inOut easing and 1.5s duration.
 */

import { gsap } from 'gsap';
import * as THREE from 'three';

// Default animation settings (Apple Astronomy spec)
const DEFAULT_DURATION = 1.5;
const DEFAULT_EASE = 'power3.inOut';

// Camera distances
const SYSTEM_VIEW_DISTANCE = 24; // Full solar system view
const CONTACT_FOCUS_OFFSET = 3;  // Distance from contact when focused

/**
 * Smoothly zoom camera to focus on a contact
 *
 * @param {THREE.Camera} camera - The Three.js camera
 * @param {THREE.Vector3} contactPosition - Position of the contact in 3D space
 * @param {Object} options - Animation options
 * @param {number} options.duration - Animation duration (default: 1.5s)
 * @param {string} options.ease - GSAP easing (default: power3.inOut)
 * @param {Function} options.onStart - Callback when animation starts
 * @param {Function} options.onComplete - Callback when animation completes
 * @param {Function} options.onUpdate - Callback on each frame
 * @returns {gsap.core.Tween} - The GSAP tween for control
 */
export function zoomToContact(camera, contactPosition, options = {}) {
  const {
    duration = DEFAULT_DURATION,
    ease = DEFAULT_EASE,
    onStart,
    onComplete,
    onUpdate,
  } = options;

  // Calculate target camera position (offset from contact toward camera)
  const direction = new THREE.Vector3();
  direction.subVectors(camera.position, contactPosition).normalize();

  const targetPosition = new THREE.Vector3();
  targetPosition.copy(contactPosition).add(direction.multiplyScalar(CONTACT_FOCUS_OFFSET));

  // Kill any existing camera animations
  gsap.killTweensOf(camera.position);

  // Animate camera position
  const tween = gsap.to(camera.position, {
    x: targetPosition.x,
    y: targetPosition.y,
    z: targetPosition.z,
    duration,
    ease,
    onStart,
    onComplete,
    onUpdate: () => {
      // Keep camera looking at contact during animation
      camera.lookAt(contactPosition);
      if (onUpdate) onUpdate();
    },
  });

  return tween;
}

/**
 * Smoothly zoom camera back to system view (full solar system)
 *
 * @param {THREE.Camera} camera - The Three.js camera
 * @param {Object} options - Animation options
 * @param {number} options.duration - Animation duration (default: 1.5s)
 * @param {string} options.ease - GSAP easing (default: power3.inOut)
 * @param {Function} options.onStart - Callback when animation starts
 * @param {Function} options.onComplete - Callback when animation completes
 * @param {Function} options.onUpdate - Callback on each frame
 * @returns {gsap.core.Tween} - The GSAP tween for control
 */
export function zoomToSystemView(camera, options = {}) {
  const {
    duration = DEFAULT_DURATION,
    ease = DEFAULT_EASE,
    onStart,
    onComplete,
    onUpdate,
  } = options;

  // Target: default overview position
  const targetPosition = { x: 0, y: 14, z: SYSTEM_VIEW_DISTANCE };
  const lookAtTarget = new THREE.Vector3(0, 0, 0);

  // Kill any existing camera animations
  gsap.killTweensOf(camera.position);

  // Animate camera position
  const tween = gsap.to(camera.position, {
    x: targetPosition.x,
    y: targetPosition.y,
    z: targetPosition.z,
    duration,
    ease,
    onStart,
    onComplete,
    onUpdate: () => {
      // Gradually shift lookAt back to origin
      camera.lookAt(lookAtTarget);
      if (onUpdate) onUpdate();
    },
  });

  return tween;
}

/**
 * Smoothly animate camera position and lookAt simultaneously
 * More control for complex transitions
 *
 * @param {THREE.Camera} camera - The Three.js camera
 * @param {Object} target - Target state
 * @param {THREE.Vector3} target.position - Target camera position
 * @param {THREE.Vector3} target.lookAt - Target lookAt point
 * @param {Object} options - Animation options
 * @returns {gsap.core.Timeline} - The GSAP timeline for control
 */
export function animateCameraTo(camera, target, options = {}) {
  const {
    duration = DEFAULT_DURATION,
    ease = DEFAULT_EASE,
    onStart,
    onComplete,
    onUpdate,
  } = options;

  // Create a timeline for synchronized animations
  const timeline = gsap.timeline({
    onStart,
    onComplete,
    onUpdate,
  });

  // We need to track lookAt separately since Three.js cameras don't expose it
  const currentLookAt = new THREE.Vector3(0, 0, 0);
  const targetLookAt = target.lookAt || new THREE.Vector3(0, 0, 0);

  // Animate position
  timeline.to(camera.position, {
    x: target.position.x,
    y: target.position.y,
    z: target.position.z,
    duration,
    ease,
    onUpdate: () => {
      // Interpolate lookAt manually during animation
      const progress = timeline.progress();
      currentLookAt.lerpVectors(currentLookAt, targetLookAt, progress * 0.1);
      camera.lookAt(currentLookAt);
    },
  }, 0);

  return timeline;
}

/**
 * Calculate the optimal camera position to make a contact fill ~60% of screen
 *
 * @param {THREE.Camera} camera - The camera
 * @param {THREE.Vector3} contactPosition - Contact position
 * @param {number} contactRadius - Radius of the contact sphere
 * @param {number} fillPercent - Desired screen fill (0-1, default 0.6)
 * @returns {THREE.Vector3} - Optimal camera position
 */
export function calculateFocusPosition(camera, contactPosition, contactRadius = 0.45, fillPercent = 0.6) {
  // Calculate distance needed for contact to fill desired screen percentage
  const fov = camera.fov * (Math.PI / 180);
  const desiredScreenSize = fillPercent;
  const distance = (contactRadius / Math.tan(fov / 2)) / desiredScreenSize;

  // Calculate direction from contact to current camera
  const direction = new THREE.Vector3();
  direction.subVectors(camera.position, contactPosition).normalize();

  // Return position at calculated distance
  const focusPosition = new THREE.Vector3();
  focusPosition.copy(contactPosition).add(direction.multiplyScalar(distance));

  return focusPosition;
}

/**
 * Smoothly zoom to a contact with optimal framing (60% screen fill)
 *
 * @param {THREE.Camera} camera - The camera
 * @param {THREE.Vector3} contactPosition - Contact position
 * @param {number} contactRadius - Radius of contact sphere
 * @param {Object} options - Animation options
 * @returns {gsap.core.Tween} - The GSAP tween
 */
export function zoomToContactOptimal(camera, contactPosition, contactRadius = 0.45, options = {}) {
  const targetPosition = calculateFocusPosition(camera, contactPosition, contactRadius, 0.6);

  const {
    duration = DEFAULT_DURATION,
    ease = DEFAULT_EASE,
    onStart,
    onComplete,
    onUpdate,
  } = options;

  // Kill any existing camera animations
  gsap.killTweensOf(camera.position);

  // Animate camera position
  const tween = gsap.to(camera.position, {
    x: targetPosition.x,
    y: targetPosition.y,
    z: targetPosition.z,
    duration,
    ease,
    onStart,
    onComplete,
    onUpdate: () => {
      camera.lookAt(contactPosition);
      if (onUpdate) onUpdate();
    },
  });

  return tween;
}

/**
 * Stop all camera animations immediately
 *
 * @param {THREE.Camera} camera - The camera to stop animating
 */
export function stopCameraAnimation(camera) {
  gsap.killTweensOf(camera.position);
}

// Export constants for consistency across components
export const ANIMATION_CONSTANTS = {
  DEFAULT_DURATION,
  DEFAULT_EASE,
  SYSTEM_VIEW_DISTANCE,
  CONTACT_FOCUS_OFFSET,
};
