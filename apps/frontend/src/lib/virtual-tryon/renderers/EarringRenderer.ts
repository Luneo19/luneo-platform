import * as THREE from 'three';
import { BaseProductRenderer, RendererConfig } from './BaseProductRenderer';
import type { HandLandmarks } from '../HandTracker';
import type { FaceLandmarks } from '../FaceTracker';

/**
 * EarringRenderer - Positions 3D earring models on both ears.
 * Uses face landmarks 234 (left ear) and 454 (right ear) from MediaPipe Face Mesh.
 * Handles pair rendering (left + right) with mirroring.
 */
export class EarringRenderer extends BaseProductRenderer {
  private rightEarringModel: THREE.Group | null = null;
  private smoothedLeftPos = new THREE.Vector3();
  private smoothedRightPos = new THREE.Vector3();
  private smoothedRotation = new THREE.Euler();
  private initialized = false;

  constructor(config: RendererConfig) {
    super(config);
  }

  /**
   * Override to also load a mirrored version for the right ear.
   */
  async loadModel(url?: string): Promise<THREE.Group> {
    const group = await super.loadModel(url);

    // Clone and mirror for right ear
    this.rightEarringModel = group.clone();
    this.rightEarringModel.scale.x *= -1; // Mirror on X axis
    this.rightEarringModel.visible = false;

    if (this.scene) {
      this.scene.add(this.rightEarringModel);
    }

    return group;
  }

  override attachToScene(scene: THREE.Scene): void {
    super.attachToScene(scene);
    if (this.rightEarringModel) {
      scene.add(this.rightEarringModel);
    }
  }

  updateFromHandTracking(_hands: HandLandmarks[]): void {
    // Earrings use face tracking
    this.setVisibility(false);
  }

  updateFromFaceTracking(face: FaceLandmarks): void {
    if (!this.model) {
      this.setVisibility(false);
      return;
    }

    const { earPositions, rotation, faceWidth } = face;

    // Scale based on face width
    const scale = (this.config.scaleFactor || 1) * faceWidth * 5;

    // Left earring position (slightly below ear landmark)
    const leftTarget = this.normalizedToWorld(
      earPositions.left.x,
      earPositions.left.y + faceWidth * 0.15, // Offset down for earlobe
      earPositions.left.z,
    );

    // Right earring position
    const rightTarget = this.normalizedToWorld(
      earPositions.right.x,
      earPositions.right.y + faceWidth * 0.15,
      earPositions.right.z,
    );

    // Apply head rotation to earrings
    const rotRad = THREE.MathUtils.degToRad;
    const targetRot = new THREE.Euler(
      rotRad(rotation.pitch * 0.5),
      rotRad(rotation.yaw * 0.5),
      rotRad(rotation.roll),
    );

    // Smooth interpolation
    if (!this.initialized) {
      this.smoothedLeftPos.copy(leftTarget);
      this.smoothedRightPos.copy(rightTarget);
      this.smoothedRotation.copy(targetRot);
      this.initialized = true;
    } else {
      this.smoothedLeftPos = this.lerpPosition(
        this.smoothedLeftPos,
        leftTarget,
        0.3,
      );
      this.smoothedRightPos = this.lerpPosition(
        this.smoothedRightPos,
        rightTarget,
        0.3,
      );
      this.smoothedRotation = this.lerpRotation(
        this.smoothedRotation,
        targetRot,
        0.3,
      );
    }

    // Apply to left earring
    this.model.position.copy(this.smoothedLeftPos);
    this.model.rotation.copy(this.smoothedRotation);
    this.model.scale.setScalar(scale);
    this.model.visible = true;

    // Apply to right earring (mirrored)
    if (this.rightEarringModel) {
      this.rightEarringModel.position.copy(this.smoothedRightPos);
      this.rightEarringModel.rotation.copy(this.smoothedRotation);
      this.rightEarringModel.scale.set(-scale, scale, scale); // Mirrored
      this.rightEarringModel.visible = true;
    }

    this.isVisible = true;
  }

  override setVisibility(visible: boolean): void {
    super.setVisibility(visible);
    if (this.rightEarringModel) {
      this.rightEarringModel.visible = visible;
    }
  }

  override dispose(): void {
    if (this.rightEarringModel && this.scene) {
      this.scene.remove(this.rightEarringModel);
      this.rightEarringModel.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.geometry?.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else if (mesh.material) {
            mesh.material.dispose();
          }
        }
      });
      this.rightEarringModel = null;
    }
    super.dispose();
  }
}
