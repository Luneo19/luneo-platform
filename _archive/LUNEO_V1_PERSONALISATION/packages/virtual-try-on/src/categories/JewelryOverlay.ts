/**
 * @luneo/virtual-try-on - Jewelry Overlay professionnel
 * Positionnement boucles d'oreilles, colliers
 */

import * as THREE from 'three';
import type { FaceTrackingResult } from '../core/types';
import { FACE_LANDMARKS_INDICES } from '../tracking/FaceTracker';
import type { Logger } from '../utils/Logger';

/**
 * Type de bijou
 */
export type JewelryType = 'earring' | 'necklace' | 'nose-ring' | 'tiara';

/**
 * Configuration pour bijoux
 */
export interface JewelryConfig {
  /** Type de bijou */
  type: JewelryType;
  
  /** Pour earrings: 'left' | 'right' | 'both' */
  earringSide?: 'left' | 'right' | 'both';
  
  /** Offset vertical */
  verticalOffset?: number;
  
  /** Offset horizontal */
  horizontalOffset?: number;
  
  /** Scale multiplier */
  scaleMultiplier?: number;
  
  /** Smoothing factor (0-1) */
  smoothingFactor?: number;
}

/**
 * Jewelry Overlay professionnel
 * 
 * Features:
 * - Earrings (anchor sur oreilles)
 * - Necklace (anchor sur cou)
 * - Nose ring (anchor sur nez)
 * - Tiara (anchor sur front)
 * 
 * @example
 * ```typescript
 * const overlay = new JewelryOverlay(earringModel, {
 *   type: 'earring',
 *   earringSide: 'both',
 *   scaleMultiplier: 1.0
 * }, logger);
 * 
 * overlay.update(faceResult);
 * ```
 */
export class JewelryOverlay {
  private config: Required<JewelryConfig>;
  private model: THREE.Object3D;
  private leftEarringModel: THREE.Object3D | null = null;
  private rightEarringModel: THREE.Object3D | null = null;
  
  // Smoothing
  private lastPositions: Map<string, THREE.Vector3> = new Map();
  private lastRotations: Map<string, THREE.Euler> = new Map();
  private lastScales: Map<string, number> = new Map();

  constructor(
    model: THREE.Object3D,
    config: JewelryConfig,
    private logger: Logger
  ) {
    this.model = model;
    
    this.config = {
      type: config.type,
      earringSide: config.earringSide || 'both',
      verticalOffset: config.verticalOffset || 0,
      horizontalOffset: config.horizontalOffset || 0,
      scaleMultiplier: config.scaleMultiplier || 1.0,
      smoothingFactor: config.smoothingFactor || 0.3,
    };
    
    // Si earrings both, créer 2 modèles
    if (this.config.type === 'earring' && this.config.earringSide === 'both') {
      this.leftEarringModel = this.model.clone();
      this.rightEarringModel = this.model.clone();
    }
    
    this.logger.debug('JewelryOverlay created', this.config);
  }

  /**
   * Met à jour la position/rotation du bijou
   */
  update(faceResult: FaceTrackingResult): void {
    switch (this.config.type) {
      case 'earring':
        this.updateEarrings(faceResult);
        break;
      case 'necklace':
        this.updateNecklace(faceResult);
        break;
      case 'nose-ring':
        this.updateNoseRing(faceResult);
        break;
      case 'tiara':
        this.updateTiara(faceResult);
        break;
    }
  }

  /**
   * Update earrings
   */
  private updateEarrings(faceResult: FaceTrackingResult): void {
    const landmarks = faceResult.landmarks;
    
    if (this.config.earringSide === 'both' && this.leftEarringModel && this.rightEarringModel) {
      // Left earring
      const leftEar = landmarks[FACE_LANDMARKS_INDICES.LEFT_EAR];
      if (leftEar) {
        this.updateSingleEarring(leftEar, this.leftEarringModel, 'left');
      }
      
      // Right earring
      const rightEar = landmarks[FACE_LANDMARKS_INDICES.RIGHT_EAR];
      if (rightEar) {
        this.updateSingleEarring(rightEar, this.rightEarringModel, 'right');
      }
    } else {
      // Single earring
      const ear = this.config.earringSide === 'left'
        ? landmarks[FACE_LANDMARKS_INDICES.LEFT_EAR]
        : landmarks[FACE_LANDMARKS_INDICES.RIGHT_EAR];
      
      if (ear) {
        this.updateSingleEarring(ear, this.model, this.config.earringSide);
      }
    }
  }

  /**
   * Update single earring
   */
  private updateSingleEarring(
    earLandmark: { x: number; y: number; z: number },
    model: THREE.Object3D,
    side: string
  ): void {
    const position = new THREE.Vector3(
      (earLandmark.x - 0.5) * 2 + this.config.horizontalOffset,
      -(earLandmark.y - 0.5) * 2 + this.config.verticalOffset,
      -earLandmark.z * 2
    );
    
    const key = `earring-${side}`;
    const lastPos = this.lastPositions.get(key);
    
    if (lastPos) {
      model.position.lerp(position, this.config.smoothingFactor);
    } else {
      model.position.copy(position);
    }
    
    this.lastPositions.set(key, model.position.clone());
    
    // Scale
    const scale = 0.1 * this.config.scaleMultiplier;
    model.scale.setScalar(scale);
  }

  /**
   * Update necklace
   */
  private updateNecklace(faceResult: FaceTrackingResult): void {
    const landmarks = faceResult.landmarks;
    const chin = landmarks[FACE_LANDMARKS_INDICES.CHIN];
    
    if (!chin) return;
    
    const position = new THREE.Vector3(
      (chin.x - 0.5) * 2,
      -(chin.y - 0.5) * 2 - 0.2 + this.config.verticalOffset, // Below chin
      -chin.z * 2
    );
    
    const lastPos = this.lastPositions.get('necklace');
    
    if (lastPos) {
      this.model.position.lerp(position, this.config.smoothingFactor);
    } else {
      this.model.position.copy(position);
    }
    
    this.lastPositions.set('necklace', this.model.position.clone());
    
    // Scale
    const scale = 0.15 * this.config.scaleMultiplier;
    this.model.scale.setScalar(scale);
  }

  /**
   * Update nose ring
   */
  private updateNoseRing(faceResult: FaceTrackingResult): void {
    const landmarks = faceResult.landmarks;
    const noseTip = landmarks[FACE_LANDMARKS_INDICES.NOSE_TIP];
    
    if (!noseTip) return;
    
    const position = new THREE.Vector3(
      (noseTip.x - 0.5) * 2 + this.config.horizontalOffset,
      -(noseTip.y - 0.5) * 2 + this.config.verticalOffset,
      -noseTip.z * 2
    );
    
    const lastPos = this.lastPositions.get('nose-ring');
    
    if (lastPos) {
      this.model.position.lerp(position, this.config.smoothingFactor);
    } else {
      this.model.position.copy(position);
    }
    
    this.lastPositions.set('nose-ring', this.model.position.clone());
    
    // Scale
    const scale = 0.05 * this.config.scaleMultiplier;
    this.model.scale.setScalar(scale);
  }

  /**
   * Update tiara
   */
  private updateTiara(faceResult: FaceTrackingResult): void {
    const landmarks = faceResult.landmarks;
    const forehead = landmarks[FACE_LANDMARKS_INDICES.FOREHEAD_CENTER];
    
    if (!forehead) return;
    
    const position = new THREE.Vector3(
      (forehead.x - 0.5) * 2,
      -(forehead.y - 0.5) * 2 + this.config.verticalOffset,
      -forehead.z * 2
    );
    
    const lastPos = this.lastPositions.get('tiara');
    
    if (lastPos) {
      this.model.position.lerp(position, this.config.smoothingFactor);
    } else {
      this.model.position.copy(position);
    }
    
    this.lastPositions.set('tiara', this.model.position.clone());
    
    // Scale
    const scale = 0.2 * this.config.scaleMultiplier;
    this.model.scale.setScalar(scale);
  }

  /**
   * Obtient le(s) modèle(s)
   */
  getModels(): THREE.Object3D[] {
    if (this.config.type === 'earring' && this.config.earringSide === 'both') {
      return [this.leftEarringModel!, this.rightEarringModel!];
    }
    return [this.model];
  }

  /**
   * Change le modèle
   */
  setModel(model: THREE.Object3D): void {
    this.model = model;
    
    if (this.config.type === 'earring' && this.config.earringSide === 'both') {
      this.leftEarringModel = model.clone();
      this.rightEarringModel = model.clone();
    }
    
    this.resetSmoothing();
    this.logger.debug('Jewelry model changed');
  }

  /**
   * Réinitialise le smoothing
   */
  resetSmoothing(): void {
    this.lastPositions.clear();
    this.lastRotations.clear();
    this.lastScales.clear();
  }

  /**
   * Change la configuration
   */
  updateConfig(config: Partial<JewelryConfig>): void {
    Object.assign(this.config, config);
    this.logger.debug('Jewelry config updated', config);
  }
}

