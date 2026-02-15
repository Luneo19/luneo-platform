import * as THREE from 'three';
import { BaseProductRenderer, RendererConfig } from './BaseProductRenderer';
import type { HandLandmarks } from '../HandTracker';
import type { FaceLandmarks } from '../FaceTracker';

/**
 * RingRenderer - Positions a 3D ring model on the ring finger.
 * Uses landmarks 13-16 (ring finger joints) from MediaPipe Hands.
 * Landmark 13 = ring finger MCP (base), 14 = PIP, 15 = DIP, 16 = tip
 */
export class RingRenderer extends BaseProductRenderer {
  private smoothedPosition = new THREE.Vector3();
  private smoothedRotation = new THREE.Euler();
  private initialized = false;

  constructor(config: RendererConfig) {
    super(config);
  }

  updateFromHandTracking(hands: HandLandmarks[]): void {
    if (hands.length === 0 || !this.model) {
      this.setVisibility(false);
      return;
    }

    // Use the first hand (prefer left for engagement/wedding ring)
    const hand =
      hands.find((h) => h.handedness === 'Left') || hands[0];

    // Ring position: between MCP (13) and PIP (14) joints of the ring finger
    const ringBase = hand.landmarks[13]; // MCP
    const ringPIP = hand.landmarks[14]; // PIP

    // Position between the two joints
    const ringPos = {
      x: (ringBase.x + ringPIP.x) / 2,
      y: (ringBase.y + ringPIP.y) / 2,
      z: (ringBase.z + ringPIP.z) / 2,
    };

    const targetPos = this.normalizedToWorld(ringPos.x, ringPos.y, ringPos.z);

    // Calculate finger angle for rotation
    const dx = ringPIP.x - ringBase.x;
    const dy = ringPIP.y - ringBase.y;
    const dz = ringPIP.z - ringBase.z;

    const fingerAngle = Math.atan2(dy, dx);

    const targetRot = new THREE.Euler(
      Math.atan2(dz, Math.sqrt(dx * dx + dy * dy)),
      0,
      fingerAngle + Math.PI / 2, // Rotate 90 degrees to wrap around the finger
    );

    // Scale based on finger thickness (approximate from hand size)
    const fingerThickness = hand.handSize * 0.15;
    const scale = (this.config.scaleFactor || 1) * fingerThickness * 12;

    // Smooth interpolation
    if (!this.initialized) {
      this.smoothedPosition.copy(targetPos);
      this.smoothedRotation.copy(targetRot);
      this.initialized = true;
    } else {
      this.smoothedPosition = this.lerpPosition(
        this.smoothedPosition,
        targetPos,
        0.35,
      );
      this.smoothedRotation = this.lerpRotation(
        this.smoothedRotation,
        targetRot,
        0.35,
      );
    }

    this.model.position.copy(this.smoothedPosition);
    this.model.rotation.copy(this.smoothedRotation);
    this.model.scale.setScalar(scale);
    this.setVisibility(true);
  }

  updateFromFaceTracking(_face: FaceLandmarks): void {
    // Ring uses hand tracking
    this.setVisibility(false);
  }
}
