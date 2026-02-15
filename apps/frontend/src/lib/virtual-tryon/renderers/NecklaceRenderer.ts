import * as THREE from 'three';
import { BaseProductRenderer, RendererConfig } from './BaseProductRenderer';
import type { HandLandmarks } from '../HandTracker';
import type { FaceLandmarks } from '../FaceTracker';

/**
 * NecklaceRenderer - Positions a 3D necklace model below the chin/neck area.
 * Uses face landmarks for chin (152) and ear positions to follow neck curvature.
 * The necklace center is placed below the chin, scaled by face width.
 */
export class NecklaceRenderer extends BaseProductRenderer {
  private smoothedPosition = new THREE.Vector3();
  private smoothedRotation = new THREE.Euler();
  private initialized = false;

  constructor(config: RendererConfig) {
    super(config);
  }

  updateFromHandTracking(_hands: HandLandmarks[]): void {
    // Necklace uses face tracking
    this.setVisibility(false);
  }

  updateFromFaceTracking(face: FaceLandmarks): void {
    if (!this.model) {
      this.setVisibility(false);
      return;
    }

    const { chinPosition, earPositions, rotation, faceWidth, faceHeight } =
      face;

    // Necklace center: below chin, centered between ears
    const neckCenterX = (earPositions.left.x + earPositions.right.x) / 2;
    const neckCenterY = chinPosition.y + faceHeight * 0.25; // Below chin
    const neckCenterZ = chinPosition.z;

    const targetPos = this.normalizedToWorld(
      neckCenterX,
      neckCenterY,
      neckCenterZ,
    );

    // Scale based on face/shoulder width
    const scale = (this.config.scaleFactor || 1) * faceWidth * 8;

    // Follow head rotation (reduced influence for necklace)
    const rotRad = THREE.MathUtils.degToRad;
    const targetRot = new THREE.Euler(
      rotRad(rotation.pitch * 0.3), // Less pitch influence
      rotRad(rotation.yaw * 0.4), // Less yaw influence
      rotRad(rotation.roll * 0.5),
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
        0.25,
      );
      this.smoothedRotation = this.lerpRotation(
        this.smoothedRotation,
        targetRot,
        0.25,
      );
    }

    this.model.position.copy(this.smoothedPosition);
    this.model.rotation.copy(this.smoothedRotation);
    this.model.scale.setScalar(scale);
    this.setVisibility(true);
  }
}
