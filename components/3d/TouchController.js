/**
 * TouchController - Gesture state machine for 3D views
 * 
 * Handles tap/drag disambiguation with 50ms delay,
 * momentum physics, and gesture conflict prevention.
 */

export const GESTURE_STATE = {
  IDLE: 'idle',
  TAP_PENDING: 'tap_pending',
  DRAGGING: 'dragging',
  PINCHING: 'pinching',
};

// Timing constants
const TAP_DELAY_MS = 50;
const TAP_MAX_DISTANCE = 10;
const TAP_MAX_DURATION = 250;
const DRAG_MIN_DISTANCE = 15;

// Physics constants
const FRICTION = 0.95;
const MAX_VELOCITY = 180;
const SNAP_THRESHOLD = 5;

export class TouchController {
  constructor(options = {}) {
    this.state = GESTURE_STATE.IDLE;
    this.tapTimer = null;
    this.startPos = { x: 0, y: 0 };
    this.lastPos = { x: 0, y: 0 };
    this.velocity = { x: 0, y: 0 };
    this.lastMoveTime = 0;
    this.touchStartTime = 0;
    this.totalMovement = 0;
    this.pinchStartDistance = 0;
    
    // Callbacks
    this.onTap = options.onTap;
    this.onDoubleTap = options.onDoubleTap;
    this.onLongPress = options.onLongPress;
    this.onDragStart = options.onDragStart;
    this.onDrag = options.onDrag;
    this.onDragEnd = options.onDragEnd;
    this.onPinchStart = options.onPinchStart;
    this.onPinch = options.onPinch;
    this.onPinchEnd = options.onPinchEnd;
    
    // Double tap tracking
    this.lastTapTime = 0;
    this.lastTapPos = { x: 0, y: 0 };
    
    // Long press tracking
    this.longPressTimer = null;
    this.longPressTriggered = false;
  }

  handleTouchStart(touches) {
    const now = Date.now();
    this.touchStartTime = now;
    this.lastMoveTime = now;
    this.totalMovement = 0;
    this.longPressTriggered = false;
    
    if (touches.length === 2) {
      // Pinch gesture
      this.clearTimers();
      this.state = GESTURE_STATE.PINCHING;
      
      const touch1 = touches[0];
      const touch2 = touches[1];
      this.pinchStartDistance = this.getDistance(touch1, touch2);
      
      this.onPinchStart?.({
        center: this.getCenter(touch1, touch2),
        distance: this.pinchStartDistance,
      });
    } else if (touches.length === 1) {
      const touch = touches[0];
      this.startPos = { x: touch.pageX, y: touch.pageY };
      this.lastPos = { ...this.startPos };
      this.state = GESTURE_STATE.TAP_PENDING;
      
      // Start tap detection timer
      this.tapTimer = setTimeout(() => {
        if (this.state === GESTURE_STATE.TAP_PENDING) {
          // Still pending after delay - could transition to drag
          // (handled in move)
        }
      }, TAP_DELAY_MS);
      
      // Start long press timer (500ms)
      this.longPressTimer = setTimeout(() => {
        if (this.state === GESTURE_STATE.TAP_PENDING && this.totalMovement < TAP_MAX_DISTANCE) {
          this.longPressTriggered = true;
          this.onLongPress?.(this.startPos);
        }
      }, 500);
    }
  }

  handleTouchMove(touches, timestamp = Date.now()) {
    const dt = Math.max(1, timestamp - this.lastMoveTime);
    this.lastMoveTime = timestamp;

    if (touches.length === 2 && this.state === GESTURE_STATE.PINCHING) {
      const touch1 = touches[0];
      const touch2 = touches[1];
      const distance = this.getDistance(touch1, touch2);
      const scale = distance / this.pinchStartDistance;
      
      this.onPinch?.({
        center: this.getCenter(touch1, touch2),
        distance,
        scale,
      });
    } else if (touches.length === 1) {
      const touch = touches[0];
      const dx = touch.pageX - this.lastPos.x;
      const dy = touch.pageY - this.lastPos.y;
      const distanceFromStart = this.getDistanceFromStart(touch);
      
      this.totalMovement += Math.abs(dx) + Math.abs(dy);

      if (this.state === GESTURE_STATE.TAP_PENDING) {
        // Check if we've moved enough to trigger drag
        if (distanceFromStart > TAP_MAX_DISTANCE) {
          this.clearTimers();
          this.state = GESTURE_STATE.DRAGGING;
          this.onDragStart?.({ x: this.startPos.x, y: this.startPos.y });
        }
      }

      if (this.state === GESTURE_STATE.DRAGGING) {
        // Calculate velocity for momentum
        this.velocity.x = (dx / dt) * 16; // Normalize to ~60fps
        this.velocity.y = (dy / dt) * 16;
        
        // Cap velocity
        const speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
        if (speed > MAX_VELOCITY) {
          const scale = MAX_VELOCITY / speed;
          this.velocity.x *= scale;
          this.velocity.y *= scale;
        }

        this.onDrag?.({
          dx,
          dy,
          x: touch.pageX,
          y: touch.pageY,
          velocity: { ...this.velocity },
        });
      }
      
      this.lastPos = { x: touch.pageX, y: touch.pageY };
    }
  }

  handleTouchEnd(touches) {
    const touchDuration = Date.now() - this.touchStartTime;
    
    if (this.state === GESTURE_STATE.PINCHING) {
      this.onPinchEnd?.();
    } else if (this.state === GESTURE_STATE.TAP_PENDING && !this.longPressTriggered) {
      // Was waiting for tap - this is a tap!
      this.clearTimers();
      
      // Check for double tap
      const now = Date.now();
      const timeSinceLastTap = now - this.lastTapTime;
      const distFromLastTap = Math.sqrt(
        (this.startPos.x - this.lastTapPos.x) ** 2 +
        (this.startPos.y - this.lastTapPos.y) ** 2
      );
      
      if (timeSinceLastTap < 300 && distFromLastTap < 30) {
        // Double tap
        this.onDoubleTap?.(this.startPos);
        this.lastTapTime = 0;
      } else {
        // Single tap
        this.onTap?.(this.startPos);
        this.lastTapTime = now;
        this.lastTapPos = { ...this.startPos };
      }
    } else if (this.state === GESTURE_STATE.DRAGGING) {
      // Apply momentum
      this.onDragEnd?.({ velocity: { ...this.velocity } });
    }
    
    this.clearTimers();
    this.state = GESTURE_STATE.IDLE;
  }

  handleTouchCancel() {
    this.clearTimers();
    this.state = GESTURE_STATE.IDLE;
    this.velocity = { x: 0, y: 0 };
  }

  /**
   * Called in animation loop to apply momentum decay
   * Returns velocity if still moving, null if at rest
   */
  update() {
    if (this.state !== GESTURE_STATE.IDLE) {
      return null;
    }
    
    const speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
    
    if (speed > 0.01) {
      // Apply friction
      this.velocity.x *= FRICTION;
      this.velocity.y *= FRICTION;

      // Snap to rest when slow enough
      if (speed < SNAP_THRESHOLD) {
        this.velocity = { x: 0, y: 0 };
        return null;
      }

      return { ...this.velocity };
    }
    
    return null;
  }

  // Helper methods
  clearTimers() {
    if (this.tapTimer) {
      clearTimeout(this.tapTimer);
      this.tapTimer = null;
    }
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  getDistance(touch1, touch2) {
    return Math.sqrt(
      (touch2.pageX - touch1.pageX) ** 2 +
      (touch2.pageY - touch1.pageY) ** 2
    );
  }

  getCenter(touch1, touch2) {
    return {
      x: (touch1.pageX + touch2.pageX) / 2,
      y: (touch1.pageY + touch2.pageY) / 2,
    };
  }

  getDistanceFromStart(touch) {
    return Math.sqrt(
      (touch.pageX - this.startPos.x) ** 2 +
      (touch.pageY - this.startPos.y) ** 2
    );
  }

  // Reset controller state
  reset() {
    this.clearTimers();
    this.state = GESTURE_STATE.IDLE;
    this.velocity = { x: 0, y: 0 };
    this.totalMovement = 0;
    this.longPressTriggered = false;
  }

  // Get current state for debugging
  getState() {
    return {
      state: this.state,
      velocity: { ...this.velocity },
      totalMovement: this.totalMovement,
    };
  }
}

export default TouchController;
