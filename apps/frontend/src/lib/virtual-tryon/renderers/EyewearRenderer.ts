import * as THREE from 'three';
import { BaseProductRenderer, RendererConfig } from './BaseProductRenderer';
import type { HandLandmarks } from '../HandTracker';
import type { FaceLandmarks } from '../FaceTracker';

/**
 * EyewearRenderer - Positions 3D glasses/sunglasses on the face.
 * Uses face landmarks 33 (left eye) and 263 (right eye) from MediaPipe Face Mesh.
 * Handles full 3D rotation (pitch/yaw/roll) for accurate glasses placement.
 */
export class EyewearRenderer extends BaseProductRenderer {
  private smoothedPosition = new THREE.Vector3();
  private smoothedRotation = new THREE.Euler();
  private smoothedScale = 1;
  private initialized = false;

  constructor(config: RendererConfig) {
    super(config);
  }

  updateFromHandTracking(_hands: HandLandmarks[]): void {
    // Eyewear uses face tracking
    this.setVisibility(false);
  }

  updateFromFaceTracking(face: FaceLandmarks): void {
    if (!this.model) {
      this.setVisibility(false);
      return;
    }

    const { eyePositions, nosePosition, rotation, faceWidth, earPositions } =
      face;

    // Glasses center: bridge of the nose, between the eyes
    const bridgeX = (eyePositions.left.x + eyePositions.right.x) / 2;
    const bridgeY = (eyePositions.left.y + eyePositions.right.y) / 2;
    const bridgeZ = nosePosition.z;

    const targetPos = this.normalizedToWorld(bridgeX, bridgeY, bridgeZ);

    // Slight forward offset so glasses don't clip into face
    targetPos.z += 0.15;

    // Scale based on inter-eye/ear distance (glasses width should match face)
    const interEarDistance = Math.sqrt(
      Math.pow(earPositions.right.x - earPositions.left.x, 2) +
        Math.pow(earPositions.right.y - earPositions.left.y, 2),
    );
    const targetScale =
      (this.config.scaleFactor || 1) * interEarDistance * 10;

    // Full 3D rotation matching head pose
    const rotRad = THREE.MathUtils.degToRad;
    const targetRot = new THREE.Euler(
      rotRad(rotation.pitch), // Look up/down
      rotRad(-rotation.yaw), // Look left/right (inverted for mirrored camera)
      rotRad(rotation.roll), // Head tilt
    );

    // Smooth interpolation (tighter smoothing for glasses to stay accurate)
    if (!this.initialized) {
      this.smoothedPosition.copy(targetPos);
      this.smoothedRotation.copy(targetRot);
      this.smoothedScale = targetScale;
      this.initialized = true;
    } else {
      this.smoothedPosition = this.lerpPosition(
        this.smoothedPosition,
        targetPos,
        0.4, // Higher factor = less lag for glasses
      );
      this.smoothedRotation = this.lerpRotation(
        this.smoothedRotation,
        targetRot,
        0.4,
      );
      this.smoothedScale += (targetScale - this.smoothedScale) * 0.3;
    }

    this.model.position.copy(this.smoothedPosition);
    this.model.rotation.copy(this.smoothedRotation);
    this.model.scale.setScalar(this.smoothedScale);
    this.setVisibility(true);
  }
}
