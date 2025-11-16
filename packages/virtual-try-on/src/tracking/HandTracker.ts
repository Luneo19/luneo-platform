/**
 * @luneo/virtual-try-on - Hand Tracker professionnel
 * Tracking main avec MediaPipe Hands (21 landmarks)
 */

import { Hands, Results as HandsResults } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import * as THREE from 'three';
import type { HandTrackingResult, HandLandmark } from '../core/types';
import type { Logger } from '../utils/Logger';

/**
 * Configuration du Hand Tracker
 */
export interface HandTrackerConfig {
  /** Nombre max de mains à tracker (1 ou 2) */
  maxNumHands?: number;
  
  /** Complexité du modèle (0=lite, 1=full) */
  modelComplexity?: 0 | 1;
  
  /** Confidence minimum pour détection */
  minDetectionConfidence?: number;
  
  /** Confidence minimum pour tracking */
  minTrackingConfidence?: number;
}

/**
 * Landmarks clés pour wrist tracking
 */
export const HAND_LANDMARKS_INDICES = {
  WRIST: 0,
  THUMB_CMC: 1,
  THUMB_MCP: 2,
  THUMB_IP: 3,
  THUMB_TIP: 4,
  INDEX_FINGER_MCP: 5,
  INDEX_FINGER_PIP: 6,
  INDEX_FINGER_DIP: 7,
  INDEX_FINGER_TIP: 8,
  MIDDLE_FINGER_MCP: 9,
  MIDDLE_FINGER_PIP: 10,
  MIDDLE_FINGER_DIP: 11,
  MIDDLE_FINGER_TIP: 12,
  RING_FINGER_MCP: 13,
  RING_FINGER_PIP: 14,
  RING_FINGER_DIP: 15,
  RING_FINGER_TIP: 16,
  PINKY_MCP: 17,
  PINKY_PIP: 18,
  PINKY_DIP: 19,
  PINKY_TIP: 20,
} as const;

/**
 * Hand Tracker professionnel avec MediaPipe
 * 
 * Features:
 * - 21 hand landmarks par main
 * - Tracking temps réel
 * - Left/Right hand detection
 * - Wrist orientation
 * - Gesture recognition ready
 * 
 * @example
 * ```typescript
 * const tracker = new HandTracker({
 *   maxNumHands: 2,
 *   modelComplexity: 1,
 *   minDetectionConfidence: 0.5
 * }, logger);
 * 
 * await tracker.init(videoElement);
 * 
 * tracker.on('handDetected', (result) => {
 *   console.log(`${result.handedness} hand detected`);
 * });
 * 
 * await tracker.start();
 * ```
 */
export class HandTracker {
  private hands: Hands | null = null;
  private camera: Camera | null = null;
  private config: Required<HandTrackerConfig>;
  private videoElement: HTMLVideoElement | null = null;
  
  // État
  private isInitialized: boolean = false;
  private isTracking: boolean = false;
  private lastResults: Map<'Left' | 'Right', HandTrackingResult> = new Map();
  
  // Event callbacks
  private onHandDetectedCallback: ((result: HandTrackingResult) => void) | null = null;
  private onHandLostCallback: ((handedness: 'Left' | 'Right') => void) | null = null;
  
  // Performance
  private frameCount: number = 0;
  private lastHandDetectedTime: Map<'Left' | 'Right', number> = new Map();
  private handLostThreshold: number = 500; // ms

  constructor(
    config: HandTrackerConfig = {},
    private logger: Logger
  ) {
    this.config = {
      maxNumHands: config.maxNumHands || 2,
      modelComplexity: config.modelComplexity || 1,
      minDetectionConfidence: config.minDetectionConfidence || 0.5,
      minTrackingConfidence: config.minTrackingConfidence || 0.5,
    };
    
    this.logger.debug('HandTracker created', this.config);
  }

  /**
   * Initialise MediaPipe Hands
   */
  async init(videoElement: HTMLVideoElement): Promise<void> {
    try {
      this.logger.info('Initializing Hand Tracker...');
      this.videoElement = videoElement;
      
      // Créer Hands
      this.hands = new Hands({
        locateFile: (file) => {
          // CDN MediaPipe (configurable via env or fallback)
          const cdnUrl = typeof process !== 'undefined' && process.env.MEDIAPIPE_CDN_URL
            ? process.env.MEDIAPIPE_CDN_URL
            : 'https://cdn.jsdelivr.net/npm/@mediapipe/hands';
          return `${cdnUrl}/${file}`;
        }
      });
      
      // Configurer Hands
      this.hands.setOptions({
        maxNumHands: this.config.maxNumHands,
        modelComplexity: this.config.modelComplexity,
        minDetectionConfidence: this.config.minDetectionConfidence,
        minTrackingConfidence: this.config.minTrackingConfidence,
        selfieMode: true,
      });
      
      this.logger.debug('Hands options set');
      
      // Setup callback
      this.hands.onResults((results) => this.onResults(results));
      
      // Créer Camera
      this.camera = new Camera(videoElement, {
        onFrame: async () => {
          if (this.hands && videoElement.readyState >= 2) {
            await this.hands.send({ image: videoElement });
            this.frameCount++;
          }
        },
        width: videoElement.videoWidth || 1280,
        height: videoElement.videoHeight || 720,
      });
      
      this.isInitialized = true;
      this.logger.info('✅ Hand Tracker initialized');
      
    } catch (error) {
      this.logger.error('Hand Tracker initialization failed:', error);
      throw error;
    }
  }

  /**
   * Démarre le tracking
   */
  async start(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Hand Tracker must be initialized before starting');
    }
    
    if (this.isTracking) {
      this.logger.warn('Hand Tracker already tracking');
      return;
    }
    
    try {
      this.logger.info('Starting Hand Tracker...');
      
      if (!this.camera) {
        throw new Error('Camera not initialized');
      }
      
      await this.camera.start();
      this.isTracking = true;
      
      // Check hand lost periodically
      this.startHandLostCheck();
      
      this.logger.info('✅ Hand Tracker started');
      
    } catch (error) {
      this.logger.error('Failed to start Hand Tracker:', error);
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
    
    this.logger.info('Stopping Hand Tracker...');
    
    if (this.camera) {
      this.camera.stop();
    }
    
    this.isTracking = false;
    this.lastResults.clear();
    
    this.logger.info('✅ Hand Tracker stopped');
  }

  /**
   * Obtient le dernier résultat pour une main
   */
  getLastResult(handedness: 'Left' | 'Right'): HandTrackingResult | null {
    return this.lastResults.get(handedness) || null;
  }

  /**
   * Vérifie si une main est détectée
   */
  isHandDetected(handedness: 'Left' | 'Right'): boolean {
    const lastTime = this.lastHandDetectedTime.get(handedness);
    return lastTime !== undefined && 
           Date.now() - lastTime < this.handLostThreshold;
  }

  /**
   * Obtient le landmark wrist
   */
  getWristLandmark(handedness: 'Left' | 'Right'): HandLandmark | null {
    const result = this.getLastResult(handedness);
    if (!result) return null;
    
    return result.landmarks[HAND_LANDMARKS_INDICES.WRIST];
  }

  /**
   * Event: hand detected
   */
  on(
    event: 'handDetected',
    callback: (result: HandTrackingResult) => void
  ): void;
  on(
    event: 'handLost',
    callback: (handedness: 'Left' | 'Right') => void
  ): void;
  on(
    event: 'handDetected' | 'handLost',
    callback:
      | ((result: HandTrackingResult) => void)
      | ((handedness: 'Left' | 'Right') => void)
  ): void {
    if (event === 'handDetected') {
      this.onHandDetectedCallback = callback as any;
    } else if (event === 'handLost') {
      this.onHandLostCallback = callback as any;
    }
  }

  /**
   * Callback MediaPipe results
   */
  private onResults(results: HandsResults): void {
    // Pas de main détectée
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      return;
    }

    // Clear current detections
    const currentHands = new Set<'Left' | 'Right'>();
    
    // Process each detected hand
    for (let i = 0; i < results.multiHandLandmarks.length; i++) {
      const handLandmarks = results.multiHandLandmarks[i];
      const handedness = results.multiHandedness[i].label as 'Left' | 'Right';
      
      currentHands.add(handedness);
      
      // Convertir en format HandTrackingResult
      const landmarks: HandLandmark[] = handLandmarks.map(landmark => ({
        x: landmark.x,
        y: landmark.y,
        z: landmark.z,
      }));
      
      // Calculer transformation matrix
      const transform = this.calculateTransformMatrix(landmarks);
      
      // Calculer confidence
      const confidence = results.multiHandedness[i].score;
      
      const result: HandTrackingResult = {
        handedness,
        landmarks,
        transform,
        confidence,
        timestamp: Date.now(),
      };
      
      this.lastResults.set(handedness, result);
      this.lastHandDetectedTime.set(handedness, Date.now());
      
      // Emit event
      if (this.onHandDetectedCallback) {
        this.onHandDetectedCallback(result);
      }
    }
    
    // Log performance périodiquement
    if (this.frameCount % 60 === 0) {
      this.logger.debug(`Hands tracked: ${this.frameCount} frames, hands: ${currentHands.size}`);
    }
  }

  /**
   * Calcule la transformation matrix pour la main
   */
  private calculateTransformMatrix(landmarks: HandLandmark[]): THREE.Matrix4 {
    // Utiliser wrist et middle finger pour orientation
    const wrist = landmarks[HAND_LANDMARKS_INDICES.WRIST];
    const middleMCP = landmarks[HAND_LANDMARKS_INDICES.MIDDLE_FINGER_MCP];
    
    if (!wrist || !middleMCP) {
      return new THREE.Matrix4();
    }
    
    // Position (wrist comme centre)
    const position = new THREE.Vector3(
      wrist.x - 0.5, // Centrer
      -(wrist.y - 0.5), // Inverser Y
      wrist.z
    );
    
    // Direction de la main (wrist → middle finger)
    const direction = new THREE.Vector3(
      middleMCP.x - wrist.x,
      middleMCP.y - wrist.y,
      middleMCP.z - wrist.z
    ).normalize();
    
    // Créer quaternion depuis direction
    const quaternion = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    quaternion.setFromUnitVectors(up, direction);
    
    // Échelle (wrist size estimation)
    const scale = 1.0;
    
    // Composer matrix
    const matrix = new THREE.Matrix4();
    matrix.compose(position, quaternion, new THREE.Vector3(scale, scale, scale));
    
    return matrix;
  }

  /**
   * Check périodique si une main est perdue
   */
  private startHandLostCheck(): void {
    const checkInterval = setInterval(() => {
      if (!this.isTracking) {
        clearInterval(checkInterval);
        return;
      }
      
      for (const [handedness, lastTime] of this.lastHandDetectedTime.entries()) {
        if (Date.now() - lastTime > this.handLostThreshold) {
          // Main perdue
          this.logger.warn(`${handedness} hand lost (timeout)`);
          this.lastResults.delete(handedness);
          this.lastHandDetectedTime.delete(handedness);
          
          if (this.onHandLostCallback) {
            this.onHandLostCallback(handedness);
          }
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
    leftHandDetected: boolean;
    rightHandDetected: boolean;
  } {
    return {
      frameCount: this.frameCount,
      isTracking: this.isTracking,
      leftHandDetected: this.isHandDetected('Left'),
      rightHandDetected: this.isHandDetected('Right'),
    };
  }
}

