/**
 * @luneo/virtual-try-on - Watch Overlay professionnel
 * Positionnement précis des montres sur le poignet
 */

import * as THREE from 'three';
import type { HandTrackingResult, WatchAnchorPoints } from '../core/types';
import { HAND_LANDMARKS_INDICES } from '../tracking/HandTracker';
import type { Logger } from '../utils/Logger';

/**
 * Configuration pour montre
 */
export interface WatchConfig {
  /** Quelle main ('Left' ou 'Right') */
  targetHand?: 'Left' | 'Right';
  
  /** Offset vertical (ajustement poignet) */
  verticalOffset?: number;
  
  /** Rotation additionnelle (ajustement bracelet) */
  rotationOffset?: THREE.Euler;
  
  /** Scale multiplier */
  scaleMultiplier?: number;
  
  /** Smoothing factor (0-1) */
  smoothingFactor?: number;
}

/**
 * Watch Overlay professionnel
 * 
 * Features:
 * - Anchor sur wrist
 * - Rotation naturelle (suit la main)
 * - Scale adaptatif
 * - Smoothing pour stabilité
 * - Support Left/Right hand
 * 
 * @example
 * ```typescript
 * const overlay = new WatchOverlay(watchModel, {
 *   targetHand: 'Left',
 *   verticalOffset: 0.05,
 *   scaleMultiplier: 1.0
 * }, logger);
 * 
 * // Dans render loop
 * if (handResult) {
 *   overlay.update(handResult);
 * }
 * ```
 */
export class WatchOverlay {
  private config: Required<WatchConfig>;
  private model: THREE.Object3D;
  
  // Smoothing
  private lastPosition: THREE.Vector3 | null = null;
  private lastRotation: THREE.Euler | null = null;
  private lastScale: number | null = null;

  constructor(
    model: THREE.Object3D,
    config: WatchConfig = {},
    private logger: Logger
  ) {
    this.model = model;
    
    this.config = {
      targetHand: config.targetHand || 'Left',
      verticalOffset: config.verticalOffset || 0,
      rotationOffset: config.rotationOffset || new THREE.Euler(0, 0, 0),
      scaleMultiplier: config.scaleMultiplier || 1.0,
      smoothingFactor: config.smoothingFactor || 0.3,
    };
    
    this.logger.debug('WatchOverlay created', this.config);
  }

  /**
   * Met à jour la position/rotation de la montre
   */
  update(handResult: HandTrackingResult): void {
    // Vérifier que c'est la bonne main
    if (handResult.handedness !== this.config.targetHand) {
      return;
    }
    
    const anchorPoints = this.calculateAnchorPoints(handResult);
    
    if (!anchorPoints) {
      this.logger.warn('Could not calculate anchor points for watch');
      return;
    }
    
    // Apply position with smoothing
    const targetPosition = new THREE.Vector3(
      anchorPoints.wrist.x,
      anchorPoints.wrist.y + this.config.verticalOffset,
      anchorPoints.wrist.z
    );
    
    if (this.lastPosition) {
      this.model.position.lerp(targetPosition, this.config.smoothingFactor);
    } else {
      this.model.position.copy(targetPosition);
    }
    this.lastPosition = this.model.position.clone();
    
    // Apply rotation with smoothing and offset
    const targetRotation = new THREE.Euler(
      anchorPoints.rotation.x + this.config.rotationOffset.x,
      anchorPoints.rotation.y + this.config.rotationOffset.y,
      anchorPoints.rotation.z + this.config.rotationOffset.z
    );
    
    if (this.lastRotation) {
      this.model.rotation.x = THREE.MathUtils.lerp(
        this.model.rotation.x,
        targetRotation.x,
        this.config.smoothingFactor
      );
      this.model.rotation.y = THREE.MathUtils.lerp(
        this.model.rotation.y,
        targetRotation.y,
        this.config.smoothingFactor
      );
      this.model.rotation.z = THREE.MathUtils.lerp(
        this.model.rotation.z,
        targetRotation.z,
        this.config.smoothingFactor
      );
    } else {
      this.model.rotation.copy(targetRotation);
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
   * Calcule les points d'ancrage pour montre
   */
  private calculateAnchorPoints(handResult: HandTrackingResult): WatchAnchorPoints | null {
    const landmarks = handResult.landmarks;
    
    // Get key landmarks
    const wristLandmark = landmarks[HAND_LANDMARKS_INDICES.WRIST];
    const middleMCPLandmark = landmarks[HAND_LANDMARKS_INDICES.MIDDLE_FINGER_MCP];
    const thumbCMCLandmark = landmarks[HAND_LANDMARKS_INDICES.THUMB_CMC];
    const pinkeyMCPLandmark = landmarks[HAND_LANDMARKS_INDICES.PINKY_MCP];
    
    if (!wristLandmark || !middleMCPLandmark || !thumbCMCLandmark || !pinkeyMCPLandmark) {
      return null;
    }
    
    // Convert to Three.js coordinates
    const wrist = new THREE.Vector3(
      (wristLandmark.x - 0.5) * 2,
      -(wristLandmark.y - 0.5) * 2,
      -wristLandmark.z * 2
    );
    
    const middleMCP = new THREE.Vector3(
      (middleMCPLandmark.x - 0.5) * 2,
      -(middleMCPLandmark.y - 0.5) * 2,
      -middleMCPLandmark.z * 2
    );
    
    const thumbCMC = new THREE.Vector3(
      (thumbCMCLandmark.x - 0.5) * 2,
      -(thumbCMCLandmark.y - 0.5) * 2,
      -thumbCMCLandmark.z * 2
    );
    
    const pinkeyMCP = new THREE.Vector3(
      (pinkeyMCPLandmark.x - 0.5) * 2,
      -(pinkeyMCPLandmark.y - 0.5) * 2,
      -pinkeyMCPLandmark.z * 2
    );
    
    // Calculate palm center
    const palmCenter = new THREE.Vector3().addVectors(thumbCMC, pinkeyMCP).multiplyScalar(0.5);
    
    // Calculate hand orientation
    // Vector from wrist to palm center
    const handDirection = new THREE.Vector3().subVectors(palmCenter, wrist).normalize();
    
    // Vector across palm (thumb to pinky)
    const palmWidth = new THREE.Vector3().subVectors(pinkeyMCP, thumbCMC);
    const palmWidthDistance = palmWidth.length();
    
    // Cross product for normal
    const palmNormal = new THREE.Vector3().crossVectors(handDirection, palmWidth).normalize();
    
    // Create rotation from vectors
    const rotationMatrix = new THREE.Matrix4();
    rotationMatrix.makeBasis(
      palmWidth.normalize(),
      handDirection,
      palmNormal
    );
    
    const rotation = new THREE.Euler();
    rotation.setFromRotationMatrix(rotationMatrix);
    
    // Calculate scale from palm width
    const scale = palmWidthDistance * 2.0;
    
    return {
      wrist,
      palmCenter,
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
    this.logger.debug('Watch model changed');
  }

  /**
   * Change la main cible
   */
  setTargetHand(hand: 'Left' | 'Right'): void {
    this.config.targetHand = hand;
    this.resetSmoothing();
    this.logger.debug('Watch target hand changed', { hand });
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
  updateConfig(config: Partial<WatchConfig>): void {
    Object.assign(this.config, config);
    this.logger.debug('Watch config updated', config);
  }
}

