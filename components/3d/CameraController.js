/**
 * CameraController - Smooth camera transitions for 3D views
 * 
 * Handles animated camera movements between views:
 * - Overview → Ring Focus
 * - Ring Focus → Contact
 * - Contact → Ring
 * - Any → Overview
 */

import * as THREE from 'three';

// Easing functions
export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
export const easeInOutCubic = (t) => 
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
export const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);
export const easeInOutQuart = (t) =>
  t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;

// Transition presets
export const TRANSITIONS = {
  OVERVIEW_TO_RING: {
    duration: 400,
    easing: easeOutCubic,
  },
  RING_TO_CONTACT: {
    duration: 500,
    easing: easeInOutCubic,
  },
  CONTACT_TO_RING: {
    duration: 400,
    easing: easeOutCubic,
  },
  ANY_TO_OVERVIEW: {
    duration: 500,
    easing: easeInOutQuart,
  },
};

/**
 * CameraController class for managing camera state and transitions
 */
export class CameraController {
  constructor(camera, options = {}) {
    this.camera = camera;
    this.isAnimating = false;
    this.animationId = null;
    
    // Store initial camera state
    this.initialPosition = camera.position.clone();
    this.initialTarget = new THREE.Vector3(0, 0, 0);
    
    // Current target (what camera looks at)
    this.currentTarget = this.initialTarget.clone();
    
    // Callbacks
    this.onTransitionStart = options.onTransitionStart;
    this.onTransitionEnd = options.onTransitionEnd;
    this.onTransitionUpdate = options.onTransitionUpdate;
  }

  /**
   * Animate camera to a new position and target
   * 
   * @param {object} target - { position: Vector3, lookAt: Vector3 }
   * @param {object} options - { duration, easing, onComplete }
   */
  animateTo(target, options = {}) {
    const {
      duration = 400,
      easing = easeOutCubic,
      onComplete,
    } = options;

    // Cancel any existing animation
    this.cancelAnimation();

    const startPosition = this.camera.position.clone();
    const startTarget = this.currentTarget.clone();
    const endPosition = target.position.clone();
    const endTarget = target.lookAt?.clone() || new THREE.Vector3(0, 0, 0);

    let startTime = null;
    this.isAnimating = true;
    this.onTransitionStart?.();

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easing(progress);

      // Interpolate position
      this.camera.position.lerpVectors(startPosition, endPosition, easedProgress);

      // Interpolate lookAt target
      this.currentTarget.lerpVectors(startTarget, endTarget, easedProgress);
      this.camera.lookAt(this.currentTarget);

      // Callback for progress updates
      this.onTransitionUpdate?.(easedProgress);

      if (progress < 1) {
        this.animationId = requestAnimationFrame(animate);
      } else {
        this.isAnimating = false;
        this.animationId = null;
        this.onTransitionEnd?.();
        onComplete?.();
      }
    };

    this.animationId = requestAnimationFrame(animate);
  }

  /**
   * Animate camera to focus on a specific ring
   * 
   * @param {number} ringIndex - Index of the ring (0-based)
   * @param {object} ringConfig - { baseRadius, radiusStep }
   */
  focusOnRing(ringIndex, ringConfig = {}) {
    const { baseRadius = 3, radiusStep = 2.5 } = ringConfig;
    const ringRadius = baseRadius + ringIndex * radiusStep;
    
    // Position camera to look at ring from above and slightly back
    const distance = ringRadius * 1.5;
    const height = ringRadius * 0.8;
    
    this.animateTo({
      position: new THREE.Vector3(0, height, distance),
      lookAt: new THREE.Vector3(0, 0, 0),
    }, TRANSITIONS.OVERVIEW_TO_RING);
  }

  /**
   * Animate camera to focus on a specific contact
   * 
   * @param {THREE.Vector3} contactPosition - Position of the contact sphere
   * @param {number} offset - How far back from the contact to position camera
   */
  focusOnContact(contactPosition, offset = 3) {
    // Calculate camera position behind the contact, looking at it
    const direction = contactPosition.clone().normalize();
    const cameraPos = contactPosition.clone().add(
      direction.multiplyScalar(offset)
    );
    
    // Slightly above the contact
    cameraPos.y += offset * 0.3;
    
    this.animateTo({
      position: cameraPos,
      lookAt: contactPosition,
    }, TRANSITIONS.RING_TO_CONTACT);
  }

  /**
   * Return to overview (zoomed out) position
   */
  returnToOverview() {
    this.animateTo({
      position: this.initialPosition.clone(),
      lookAt: this.initialTarget.clone(),
    }, TRANSITIONS.ANY_TO_OVERVIEW);
  }

  /**
   * Pull back from contact to ring view
   * 
   * @param {number} ringIndex - Index of the ring to return to
   */
  pullBackToRing(ringIndex, ringConfig = {}) {
    const { baseRadius = 3, radiusStep = 2.5 } = ringConfig;
    const ringRadius = baseRadius + ringIndex * radiusStep;
    
    const distance = ringRadius * 2;
    const height = ringRadius;
    
    this.animateTo({
      position: new THREE.Vector3(0, height, distance),
      lookAt: new THREE.Vector3(0, 0, 0),
    }, TRANSITIONS.CONTACT_TO_RING);
  }

  /**
   * Cancel any in-progress animation
   */
  cancelAnimation() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.isAnimating = false;
  }

  /**
   * Manually update camera position (for drag/momentum)
   * 
   * @param {object} delta - { dx, dy } rotation deltas
   * @param {number} distance - Camera distance from center
   */
  updateRotation(delta, distance) {
    if (this.isAnimating) return;
    
    const { dx, dy } = delta;
    const sensitivity = 0.005;
    
    // Get current spherical coordinates
    const spherical = new THREE.Spherical();
    spherical.setFromVector3(this.camera.position);
    
    // Update angles
    spherical.theta -= dx * sensitivity;
    spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi + dy * sensitivity));
    spherical.radius = distance;
    
    // Apply to camera
    this.camera.position.setFromSpherical(spherical);
    this.camera.lookAt(this.currentTarget);
  }

  /**
   * Update camera distance (for pinch zoom)
   * 
   * @param {number} distance - New camera distance
   * @param {object} limits - { min, max }
   */
  updateDistance(distance, limits = { min: 5, max: 50 }) {
    if (this.isAnimating) return;
    
    const clamped = Math.max(limits.min, Math.min(limits.max, distance));
    
    const direction = this.camera.position.clone().normalize();
    this.camera.position.copy(direction.multiplyScalar(clamped));
    this.camera.lookAt(this.currentTarget);
  }

  /**
   * Get current camera distance from target
   */
  getDistance() {
    return this.camera.position.distanceTo(this.currentTarget);
  }

  /**
   * Reset camera to initial state
   */
  reset() {
    this.cancelAnimation();
    this.camera.position.copy(this.initialPosition);
    this.currentTarget.copy(this.initialTarget);
    this.camera.lookAt(this.currentTarget);
  }

  /**
   * Set new initial/home position
   */
  setHomePosition(position, target = new THREE.Vector3(0, 0, 0)) {
    this.initialPosition = position.clone();
    this.initialTarget = target.clone();
  }
}

/**
 * Standalone function to animate camera (for use without controller)
 */
export function animateCameraTo(camera, target, options = {}) {
  const {
    duration = 400,
    easing = easeOutCubic,
    onComplete,
    onUpdate,
  } = options;

  const startPosition = camera.position.clone();
  const endPosition = target.position.clone();
  
  // Get current lookAt by creating a target from camera direction
  const currentLookAt = new THREE.Vector3(0, 0, -1)
    .applyQuaternion(camera.quaternion)
    .add(camera.position);
  const endLookAt = target.lookAt?.clone() || new THREE.Vector3(0, 0, 0);

  let startTime = null;
  let animationId = null;

  const animate = (timestamp) => {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easing(progress);

    // Interpolate position
    camera.position.lerpVectors(startPosition, endPosition, easedProgress);

    // Interpolate lookAt
    const currentTarget = new THREE.Vector3().lerpVectors(
      currentLookAt,
      endLookAt,
      easedProgress
    );
    camera.lookAt(currentTarget);

    onUpdate?.(easedProgress);

    if (progress < 1) {
      animationId = requestAnimationFrame(animate);
    } else {
      onComplete?.();
    }
  };

  animationId = requestAnimationFrame(animate);

  // Return cancel function
  return () => {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
  };
}

export default CameraController;
