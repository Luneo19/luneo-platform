import * as THREE from 'three';
import { BaseProductRenderer, RendererConfig } from './BaseProductRenderer';
import type { HandLandmarks } from '../HandTracker';
import type { FaceLandmarks } from '../FaceTracker';

/**
 * WatchRenderer - Positions a 3D watch model on the wrist detected by HandTracker.
 * Uses landmarks 0 (wrist) and 5/9 (palm) for positioning and rotation.
 */
export class WatchRenderer extends BaseProductRenderer {
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

    // Use the first detected hand (prefer left for watch)
    const hand =
      hands.find((h) => h.handedness === 'Left') || hands[0];

    const wrist = hand.wristPosition;
    const indexBase = hand.landmarks[5]; // index finger MCP
    const middleBase = hand.landmarks[9]; // middle finger MCP

    // Position on wrist
    const targetPos = this.normalizedToWorld(wrist.x, wrist.y, wrist.z);

    // Offset slightly towards the forearm (away from fingers)
    const palmCenter = {
      x: (indexBase.x + middleBase.x) / 2,
      y: (indexBase.y + middleBase.y) / 2,
    };
    const wristToFingers = {
      x: palmCenter.x - wrist.x,
      y: palmCenter.y - wrist.y,
    };
    // Move position slightly back from wrist towards forearm
    targetPos.x -= wristToFingers.x * 2;
    targetPos.y -= wristToFingers.y * 2;

    // Scale based on hand size
    const scale = (this.config.scaleFactor || 1) * hand.handSize * 8;

    // Rotation from hand orientation
    const rotRad = THREE.MathUtils.degToRad;
    const targetRot = new THREE.Euler(
      rotRad(hand.handRotation.pitch),
      rotRad(hand.handRotation.yaw),
      rotRad(hand.handRotation.roll - 90), // Adjust for watch orientation
    );

    // Smooth interpolation
    if (!this.initialized) {
      this.smoothedPosition.copy(targetPos);
      this.smoothedRotation.copy(targetRot);
      this.initialized = true;
    } else {
      this.smoothedPosition = this.lerpPosition(
        this.smoothedPosition,
        targetPos,
        0.3,
      );
      this.smoothedRotation = this.lerpRotation(
        this.smoothedRotation,
        targetRot,
        0.3,
      );
    }

    this.model.position.copy(this.smoothedPosition);
    this.model.rotation.copy(this.smoothedRotation);
    this.model.scale.setScalar(scale);
    this.setVisibility(true);
  }

  updateFromFaceTracking(_face: FaceLandmarks): void {
    // Watch uses hand tracking, not face tracking
    this.setVisibility(false);
  }
}
