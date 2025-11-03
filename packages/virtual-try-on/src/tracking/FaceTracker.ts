/**
 * @luneo/virtual-try-on - Face Tracker professionnel
 * Tracking facial avec MediaPipe Face Mesh (468 landmarks)
 */

import { FaceMesh, Results as FaceMeshResults } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';
import * as THREE from 'three';
import type { FaceTrackingResult, FaceLandmark } from '../core/types';
import type { Logger } from '../utils/Logger';

/**
 * Configuration du Face Tracker
 */
export interface FaceTrackerConfig {
  /** Nombre max de visages à tracker */
  maxNumFaces?: number;
  
  /** Landmarks refinés (yeux, lèvres, iris) */
  refineLandmarks?: boolean;
  
  /** Confidence minimum pour détection */
  minDetectionConfidence?: number;
  
  /** Confidence minimum pour tracking */
  minTrackingConfidence?: number;
  
  /** Activer mode selfie (mirror) */
  selfieMode?: boolean;
}

/**
 * Landmarks clés pour anchoring
 */
export const FACE_LANDMARKS_INDICES = {
  // Nez
  NOSE_TIP: 1,
  NOSE_BRIDGE: 168,
  
  // Yeux
  LEFT_EYE_OUTER: 33,
  LEFT_EYE_INNER: 133,
  RIGHT_EYE_OUTER: 362,
  RIGHT_EYE_INNER: 263,
  
  // Oreilles (approximatif)
  LEFT_EAR: 234,
  RIGHT_EAR: 454,
  
  // Tempes
  LEFT_TEMPLE: 234,
  RIGHT_TEMPLE: 454,
  
  // Front
  FOREHEAD_CENTER: 10,
  
  // Mâchoire
  CHIN: 152,
  LEFT_JAW: 234,
  RIGHT_JAW: 454,
} as const;

/**
 * Face Tracker professionnel avec MediaPipe
 * 
 * Features:
 * - 468 facial landmarks
 * - Tracking temps réel (30 FPS)
 * - Confidence scoring
 * - 3D transformation matrix
 * - Multiple faces support
 * 
 * @example
 * ```typescript
 * const tracker = new FaceTracker({
 *   maxNumFaces: 1,
 *   refineLandmarks: true,
 *   minDetectionConfidence: 0.5,
 *   minTrackingConfidence: 0.5
 * }, logger);
 * 
 * await tracker.init(videoElement);
 * 
 * tracker.on('faceDetected', (result) => {
 *   console.log(`Face detected: ${result.landmarks.length} landmarks`);
 * });
 * 
 * await tracker.start();
 * ```
 */
export class FaceTracker {
  private faceMesh: FaceMesh | null = null;
  private camera: Camera | null = null;
  private config: Required<FaceTrackerConfig>;
  private videoElement: HTMLVideoElement | null = null;
  
  // État
  private isInitialized: boolean = false;
  private isTracking: boolean = false;
  private lastResult: FaceTrackingResult | null = null;
  
  // Event callbacks
  private onFaceDetectedCallback: ((result: FaceTrackingResult) => void) | null = null;
  private onFaceLostCallback: (() => void) | null = null;
  
  // Performance
  private frameCount: number = 0;
  private lastFaceDetectedTime: number = 0;
  private faceLostThreshold: number = 500; // ms

  constructor(
    config: FaceTrackerConfig = {},
    private logger: Logger
  ) {
    this.config = {
      maxNumFaces: config.maxNumFaces || 1,
      refineLandmarks: config.refineLandmarks !== false, // Default true
      minDetectionConfidence: config.minDetectionConfidence || 0.5,
      minTrackingConfidence: config.minTrackingConfidence || 0.5,
      selfieMode: config.selfieMode !== false, // Default true
    };
    
    this.logger.debug('FaceTracker created', this.config);
  }

  /**
   * Initialise MediaPipe Face Mesh
   */
  async init(videoElement: HTMLVideoElement): Promise<void> {
    try {
      this.logger.info('Initializing Face Tracker...');
      this.videoElement = videoElement;
      
      // Créer FaceMesh
      this.faceMesh = new FaceMesh({
        locateFile: (file) => {
          // CDN MediaPipe
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        }
      });
      
      // Configurer FaceMesh
      this.faceMesh.setOptions({
        maxNumFaces: this.config.maxNumFaces,
        refineLandmarks: this.config.refineLandmarks,
        minDetectionConfidence: this.config.minDetectionConfidence,
        minTrackingConfidence: this.config.minTrackingConfidence,
        selfieMode: this.config.selfieMode,
      });
      
      this.logger.debug('FaceMesh options set', this.faceMesh);
      
      // Setup callback
      this.faceMesh.onResults((results) => this.onResults(results));
      
      // Créer Camera
      this.camera = new Camera(videoElement, {
        onFrame: async () => {
          if (this.faceMesh && videoElement.readyState >= 2) {
            await this.faceMesh.send({ image: videoElement });
            this.frameCount++;
          }
        },
        width: videoElement.videoWidth || 1280,
        height: videoElement.videoHeight || 720,
      });
      
      this.isInitialized = true;
      this.logger.info('✅ Face Tracker initialized');
      
    } catch (error) {
      this.logger.error('Face Tracker initialization failed:', error);
      throw error;
    }
  }

  /**
   * Démarre le tracking
   */
  async start(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Face Tracker must be initialized before starting');
    }
    
    if (this.isTracking) {
      this.logger.warn('Face Tracker already tracking');
      return;
    }
    
    try {
      this.logger.info('Starting Face Tracker...');
      
      if (!this.camera) {
        throw new Error('Camera not initialized');
      }
      
      await this.camera.start();
      this.isTracking = true;
      
      // Check face lost periodically
      this.startFaceLostCheck();
      
      this.logger.info('✅ Face Tracker started');
      
    } catch (error) {
      this.logger.error('Failed to start Face Tracker:', error);
      throw error;
    }
  }

  /**
   * Arrête le tracking
   */
  async stop(): Promise<void> {
    if (!this.isTracking) {
      return;
    }
    
    this.logger.info('Stopping Face Tracker...');
    
    if (this.camera) {
      this.camera.stop();
    }
    
    this.isTracking = false;
    this.lastResult = null;
    
    this.logger.info('✅ Face Tracker stopped');
  }

  /**
   * Obtient le dernier résultat
   */
  getLastResult(): FaceTrackingResult | null {
    return this.lastResult;
  }

  /**
   * Vérifie si un visage est détecté
   */
  isFaceDetected(): boolean {
    return this.lastResult !== null && 
           Date.now() - this.lastFaceDetectedTime < this.faceLostThreshold;
  }

  /**
   * Obtient un landmark spécifique
   */
  getLandmark(index: number): FaceLandmark | null {
    if (!this.lastResult || !this.lastResult.landmarks[index]) {
      return null;
    }
    return this.lastResult.landmarks[index];
  }

  /**
   * Obtient des landmarks clés (nez, yeux, etc.)
   */
  getKeyLandmarks(): Record<keyof typeof FACE_LANDMARKS_INDICES, FaceLandmark | null> {
    const result: any = {};
    
    for (const [key, index] of Object.entries(FACE_LANDMARKS_INDICES)) {
      result[key] = this.getLandmark(index);
    }
    
    return result;
  }

  /**
   * Event: face detected
   */
  on(event: 'faceDetected', callback: (result: FaceTrackingResult) => void): void;
  on(event: 'faceLost', callback: () => void): void;
  on(event: string, callback: Function): void {
    if (event === 'faceDetected') {
      this.onFaceDetectedCallback = callback as any;
    } else if (event === 'faceLost') {
      this.onFaceLostCallback = callback as any;
    }
  }

  /**
   * Callback MediaPipe results
   */
  private onResults(results: FaceMeshResults): void {
    // Pas de visage détecté
    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) {
      if (this.lastResult !== null) {
        // Visage perdu
        this.logger.debug('Face lost');
        this.lastResult = null;
      }
      return;
    }

    // Prendre le premier visage
    const faceLandmarks = results.multiFaceLandmarks[0];
    
    // Convertir en format FaceTrackingResult
    const landmarks: FaceLandmark[] = faceLandmarks.map(landmark => ({
      x: landmark.x,
      y: landmark.y,
      z: landmark.z,
      visibility: landmark.visibility,
    }));
    
    // Calculer transformation matrix
    const transform = this.calculateTransformMatrix(landmarks);
    
    // Calculer confidence (moyenne des visibilities)
    const confidence = this.calculateConfidence(landmarks);
    
    const result: FaceTrackingResult = {
      landmarks,
      transform,
      confidence,
      timestamp: Date.now(),
    };
    
    this.lastResult = result;
    this.lastFaceDetectedTime = Date.now();
    
    // Emit event
    if (this.onFaceDetectedCallback) {
      this.onFaceDetectedCallback(result);
    }
    
    // Log performance périodiquement
    if (this.frameCount % 60 === 0) {
      this.logger.debug(`Face tracked: ${this.frameCount} frames, confidence: ${(confidence * 100).toFixed(1)}%`);
    }
  }

  /**
   * Calcule la transformation matrix 4x4
   */
  private calculateTransformMatrix(landmarks: FaceLandmark[]): THREE.Matrix4 {
    // Utiliser des landmarks clés pour calculer position et rotation
    const noseTip = landmarks[FACE_LANDMARKS_INDICES.NOSE_TIP];
    const leftEye = landmarks[FACE_LANDMARKS_INDICES.LEFT_EYE_OUTER];
    const rightEye = landmarks[FACE_LANDMARKS_INDICES.RIGHT_EYE_OUTER];
    
    if (!noseTip || !leftEye || !rightEye) {
      return new THREE.Matrix4();
    }
    
    // Position (nez comme centre)
    const position = new THREE.Vector3(
      noseTip.x - 0.5, // Centrer autour de 0
      -(noseTip.y - 0.5), // Inverser Y
      noseTip.z
    );
    
    // Rotation (calculée depuis les yeux)
    const eyeVector = new THREE.Vector3(
      rightEye.x - leftEye.x,
      rightEye.y - leftEye.y,
      rightEye.z - leftEye.z
    );
    
    // Angle de rotation (roll)
    const roll = Math.atan2(eyeVector.y, eyeVector.x);
    
    // Créer quaternion
    const quaternion = new THREE.Quaternion();
    quaternion.setFromAxisAngle(new THREE.Vector3(0, 0, 1), -roll);
    
    // Échelle (distance entre yeux comme référence)
    const eyeDistance = eyeVector.length();
    const scale = eyeDistance * 10; // Facteur d'échelle empirique
    
    // Composer matrix
    const matrix = new THREE.Matrix4();
    matrix.compose(position, quaternion, new THREE.Vector3(scale, scale, scale));
    
    return matrix;
  }

  /**
   * Calcule la confidence moyenne
   */
  private calculateConfidence(landmarks: FaceLandmark[]): number {
    const visibilities = landmarks
      .map(l => l.visibility || 1)
      .filter(v => v > 0);
    
    if (visibilities.length === 0) {
      return 0;
    }
    
    const sum = visibilities.reduce((acc, v) => acc + v, 0);
    return sum / visibilities.length;
  }

  /**
   * Check périodique si le visage est perdu
   */
  private startFaceLostCheck(): void {
    const checkInterval = setInterval(() => {
      if (!this.isTracking) {
        clearInterval(checkInterval);
        return;
      }
      
      if (this.lastResult !== null && 
          Date.now() - this.lastFaceDetectedTime > this.faceLostThreshold) {
        // Visage perdu
        this.logger.warn('Face lost (timeout)');
        this.lastResult = null;
        
        if (this.onFaceLostCallback) {
          this.onFaceLostCallback();
        }
      }
    }, 100); // Check every 100ms
  }

  /**
   * Obtient les statistiques
   */
  getStats(): {
    frameCount: number;
    isTracking: boolean;
    isFaceDetected: boolean;
    lastConfidence: number;
  } {
    return {
      frameCount: this.frameCount,
      isTracking: this.isTracking,
      isFaceDetected: this.isFaceDetected(),
      lastConfidence: this.lastResult?.confidence || 0,
    };
  }
}

