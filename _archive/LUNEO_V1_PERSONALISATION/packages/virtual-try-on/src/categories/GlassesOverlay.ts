/**
 * @luneo/virtual-try-on - Glasses Overlay professionnel
 * Positionnement précis des lunettes sur le nez
 */

import * as THREE from 'three';
import type { FaceTrackingResult, GlassesAnchorPoints } from '../core/types';
import { FACE_LANDMARKS_INDICES } from '../tracking/FaceTracker';
import type { Logger } from '../utils/Logger';

/**
 * Configuration pour lunettes
 */
export interface GlassesConfig {
  /** Offset vertical (ajustement nez) */
  verticalOffset?: number;
  
  /** Offset profondeur (avant/arrière) */
  depthOffset?: number;
  
  /** Scale multiplier */
  scaleMultiplier?: number;
  
  /** Smoothing factor (0-1) */
  smoothingFactor?: number;
}

/**
 * Glasses Overlay professionnel
 * 
 * Features:
 * - Anchor sur nose bridge
 * - Rotation naturelle (suit le visage)
 * - Scale adaptatif
 * - Smoothing pour stabilité
 * 
 * @example
 * ```typescript
 * const overlay = new GlassesOverlay(glassesModel, {
 *   verticalOffset: 0.01,
 *   depthOffset: 0.02,
 *   scaleMultiplier: 1.2
 * }, logger);
 * 
 * // Dans render loop
 * if (faceResult) {
 *   overlay.update(faceResult);
 * }
 * ```
 */
export class GlassesOverlay {
  private config: Required<GlassesConfig>;
  private model: THREE.Object3D;
  
  // Smoothing
  private lastPosition: THREE.Vector3 | null = null;
  private lastRotation: THREE.Euler | null = null;
  private lastScale: number | null = null;

  constructor(
    model: THREE.Object3D,
    config: GlassesConfig = {},
    private logger: Logger
  ) {
    this.model = model;
    
    this.config = {
      verticalOffset: config.verticalOffset || 0,
      depthOffset: config.depthOffset || 0,
      scaleMultiplier: config.scaleMultiplier || 1.0,
      smoothingFactor: config.smoothingFactor || 0.3,
    };
    
    this.logger.debug('GlassesOverlay created', this.config);
  }

  /**
   * Met à jour la position/rotation des lunettes
   */
  update(faceResult: FaceTrackingResult): void {
    const anchorPoints = this.calculateAnchorPoints(faceResult);
    
    if (!anchorPoints) {
      this.logger.warn('Could not calculate anchor points for glasses');
      return;
    }
    
    // Apply position with smoothing
    const targetPosition = new THREE.Vector3(
      anchorPoints.noseBridge.x,
      anchorPoints.noseBridge.y + this.config.verticalOffset,
      anchorPoints.noseBridge.z + this.config.depthOffset
    );
    
    if (this.lastPosition) {
      this.model.position.lerp(targetPosition, this.config.smoothingFactor);
    } else {
      this.model.position.copy(targetPosition);
    }
    this.lastPosition = this.model.position.clone();
    
    // Apply rotation with smoothing
    if (this.lastRotation) {
      this.model.rotation.x = THREE.MathUtils.lerp(
        this.model.rotation.x,
        anchorPoints.rotation.x,
        this.config.smoothingFactor
      );
      this.model.rotation.y = THREE.MathUtils.lerp(
        this.model.rotation.y,
        anchorPoints.rotation.y,
        this.config.smoothingFactor
      );
      this.model.rotation.z = THREE.MathUtils.lerp(
        this.model.rotation.z,
        anchorPoints.rotation.z,
        this.config.smoothingFactor
      );
    } else {
      this.model.rotation.copy(anchorPoints.rotation);
    }
    this.lastRotation = this.model.rotation.clone();
    
    // Apply scale with smoothing
    const targetScale = anchorPoints.scale * this.config.scaleMultiplier;
    
    if (this.lastScale !== null) {
      const smoothedScale = THREE.MathUtils.lerp(
        this.lastScale,
        targetScale,
        this.config.smoothingFactor
      );
      this.model.scale.setScalar(smoothedScale);
    } else {
      this.model.scale.setScalar(targetScale);
    }
    this.lastScale = this.model.scale.x;
  }

  /**
   * Calcule les points d'ancrage pour lunettes
   */
  private calculateAnchorPoints(faceResult: FaceTrackingResult): GlassesAnchorPoints | null {
    const landmarks = faceResult.landmarks;
    
    // Get key landmarks
    const noseBridgeLandmark = landmarks[FACE_LANDMARKS_INDICES.NOSE_BRIDGE];
    const leftTempleLandmark = landmarks[FACE_LANDMARKS_INDICES.LEFT_TEMPLE];
    const rightTempleLandmark = landmarks[FACE_LANDMARKS_INDICES.RIGHT_TEMPLE];
    const leftEyeLandmark = landmarks[FACE_LANDMARKS_INDICES.LEFT_EYE_OUTER];
    const rightEyeLandmark = landmarks[FACE_LANDMARKS_INDICES.RIGHT_EYE_OUTER];
    
    if (!noseBridgeLandmark || !leftTempleLandmark || !rightTempleLandmark ||
        !leftEyeLandmark || !rightEyeLandmark) {
      return null;
    }
    
    // Convert to Three.js coordinates
    const noseBridge = new THREE.Vector3(
      (noseBridgeLandmark.x - 0.5) * 2,
      -(noseBridgeLandmark.y - 0.5) * 2,
      -noseBridgeLandmark.z * 2
    );
    
    const leftTemple = new THREE.Vector3(
      (leftTempleLandmark.x - 0.5) * 2,
      -(leftTempleLandmark.y - 0.5) * 2,
      -leftTempleLandmark.z * 2
    );
    
    const rightTemple = new THREE.Vector3(
      (rightTempleLandmark.x - 0.5) * 2,
      -(rightTempleLandmark.y - 0.5) * 2,
      -rightTempleLandmark.z * 2
    );
    
    const leftEye = new THREE.Vector3(
      (leftEyeLandmark.x - 0.5) * 2,
      -(leftEyeLandmark.y - 0.5) * 2,
      -leftEyeLandmark.z * 2
    );
    
    const rightEye = new THREE.Vector3(
      (rightEyeLandmark.x - 0.5) * 2,
      -(rightEyeLandmark.y - 0.5) * 2,
      -rightEyeLandmark.z * 2
    );
    
    // Calculate rotation from eye line
    const eyeVector = new THREE.Vector3().subVectors(rightEye, leftEye);
    const eyeDistance = eyeVector.length();
    
    // Roll (rotation around Z axis)
    const roll = Math.atan2(eyeVector.y, eyeVector.x);
    
    // Pitch (rotation around X axis) - approximation
    const pitch = 0;
    
    // Yaw (rotation around Y axis) - from nose bridge depth
    const yaw = Math.atan2(noseBridge.x, Math.abs(noseBridge.z));
    
    const rotation = new THREE.Euler(pitch, yaw, roll);
    
    // Calculate scale from eye distance
    const scale = eyeDistance * 1.5;
    
    return {
      noseBridge,
      leftTemple,
      rightTemple,
      rotation,
      scale,
    };
  }

  /**
   * Obtient le modèle
   */
  getModel(): THREE.Object3D {
    return this.model;
  }

  /**
   * Change le modèle
   */
  setModel(model: THREE.Object3D): void {
    this.model = model;
    this.resetSmoothing();
    this.logger.debug('Glasses model changed');
  }

  /**
   * Réinitialise le smoothing
   */
  resetSmoothing(): void {
    this.lastPosition = null;
    this.lastRotation = null;
    this.lastScale = null;
  }

  /**
   * Change la configuration
   */
  updateConfig(config: Partial<GlassesConfig>): void {
    Object.assign(this.config, config);
    this.logger.debug('Glasses config updated', config);
  }
}

