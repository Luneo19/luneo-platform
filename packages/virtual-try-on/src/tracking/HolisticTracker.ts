/**
 * @luneo/virtual-try-on - Holistic Tracker professionnel
 * Tracking combiné Face + Hands + Pose avec MediaPipe Holistic
 */

import { Holistic, Results as HolisticResults } from '@mediapipe/holistic';
import { Camera } from '@mediapipe/camera_utils';
import type { Logger } from '../utils/Logger';

/**
 * Configuration du Holistic Tracker
 */
export interface HolisticTrackerConfig {
  /** Complexité du modèle (0=lite, 1=full, 2=heavy) */
  modelComplexity?: 0 | 1 | 2;
  
  /** Refiner les landmarks faciaux */
  refineFaceLandmarks?: boolean;
  
  /** Smoothing des landmarks */
  smoothLandmarks?: boolean;
  
  /** Activer segmentation */
  enableSegmentation?: boolean;
  
  /** Smoothing de la segmentation */
  smoothSegmentation?: boolean;
  
  /** Confidence minimum pour détection */
  minDetectionConfidence?: number;
  
  /** Confidence minimum pour tracking */
  minTrackingConfidence?: number;
}

/**
 * Résultat combiné du tracking holistic
 */
export interface HolisticTrackingResult {
  detected: boolean;
  face?: {
    detected: boolean;
    landmarks: any[];
    confidence: number;
  };
  hands?: {
    left?: {
      detected: boolean;
      landmarks: any[];
      confidence: number;
    };
    right?: {
      detected: boolean;
      landmarks: any[];
      confidence: number;
    };
  };
  pose?: {
    detected: boolean;
    keypoints: any[];
    confidence: number;
  };
  segmentation?: ImageData | null;
  timestamp: number;
}

/**
 * Holistic Tracker professionnel avec MediaPipe
 * 
 * Features:
 * - Face tracking (468 landmarks)
 * - Hand tracking (21 landmarks par main)
 * - Pose tracking (33 keypoints)
 * - Segmentation optionnelle
 * - Tracking temps réel combiné
 * 
 * @example
 * ```typescript
 * const tracker = new HolisticTracker({
 *   modelComplexity: 1,
 *   refineFaceLandmarks: true,
 *   minDetectionConfidence: 0.5
 * }, logger);
 * 
 * await tracker.init(videoElement);
 * 
 * tracker.on('holisticDetected', (result) => {
 *   if (result.face?.detected) {
 *     console.log('Face detected');
 *   }
 *   if (result.hands?.left?.detected) {
 *     console.log('Left hand detected');
 *   }
 *   if (result.pose?.detected) {
 *     console.log('Pose detected');
 *   }
 * });
 * 
 * await tracker.start();
 * ```
 */
export class HolisticTracker {
  private holistic: Holistic | null = null;
  private camera: Camera | null = null;
  private config: Required<HolisticTrackerConfig>;
  private videoElement: HTMLVideoElement | null = null;
  
  // État
  private isInitialized: boolean = false;
  private isTracking: boolean = false;
  private lastResult: HolisticTrackingResult | null = null;
  
  // Event callbacks
  private onHolisticDetectedCallback: ((result: HolisticTrackingResult) => void) | null = null;
  private onHolisticLostCallback: (() => void) | null = null;
  
  // Performance
  private frameCount: number = 0;
  private lastHolisticDetectedTime: number = 0;
  private holisticLostThreshold: number = 500; // ms
  
  // FPS tracking
  private frameTimestamps: number[] = [];
  private fpsWindowSize: number = 30;

  constructor(
    config: HolisticTrackerConfig = {},
    private logger: Logger
  ) {
    this.config = {
      modelComplexity: config.modelComplexity ?? 1,
      refineFaceLandmarks: config.refineFaceLandmarks ?? true,
      smoothLandmarks: config.smoothLandmarks !== false,
      enableSegmentation: config.enableSegmentation ?? false,
      smoothSegmentation: config.smoothSegmentation ?? false,
      minDetectionConfidence: config.minDetectionConfidence ?? 0.5,
      minTrackingConfidence: config.minTrackingConfidence ?? 0.5,
    };
    
    this.logger.debug('HolisticTracker created', this.config);
  }

  /**
   * Initialise MediaPipe Holistic
   */
  async init(videoElement: HTMLVideoElement): Promise<void> {
    try {
      this.videoElement = videoElement;
      this.logger.info('Initializing Holistic Tracker...');

      // Créer instance Holistic
      this.holistic = new Holistic({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`;
        },
      });

      // Configurer options
      this.holistic.setOptions({
        modelComplexity: this.config.modelComplexity,
        refineFaceLandmarks: this.config.refineFaceLandmarks,
        smoothLandmarks: this.config.smoothLandmarks,
        enableSegmentation: this.config.enableSegmentation,
        smoothSegmentation: this.config.smoothSegmentation,
        minDetectionConfidence: this.config.minDetectionConfidence,
        minTrackingConfidence: this.config.minTrackingConfidence,
      });

      // Callback pour résultats
      this.holistic.onResults((results: HolisticResults) => {
        this.handleResults(results);
      });

      // Initialiser caméra
      this.camera = new Camera(videoElement, {
        onFrame: async () => {
          if (this.holistic) {
            await this.holistic.send({ image: videoElement });
          }
        },
        width: 1280,
        height: 720,
      });

      this.isInitialized = true;
      this.logger.info('✅ Holistic Tracker initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Holistic Tracker', error);
      throw error;
    }
  }

  /**
   * Traite les résultats MediaPipe
   */
  private handleResults(results: HolisticResults): void {
    this.frameCount++;

    const hasFace = results.faceLandmarks && results.faceLandmarks.length > 0;
    const hasHands = results.leftHandLandmarks || results.rightHandLandmarks;
    const hasPose = results.poseLandmarks && results.poseLandmarks.length > 0;
    const detected = hasFace || hasHands || hasPose;

    if (detected) {
      const result: HolisticTrackingResult = {
        detected: true,
        face: hasFace ? {
          detected: true,
          landmarks: results.faceLandmarks || [],
          confidence: this.calculateFaceConfidence(results.faceLandmarks),
        } : undefined,
        hands: {
          left: results.leftHandLandmarks ? {
            detected: true,
            landmarks: results.leftHandLandmarks,
            confidence: this.calculateHandConfidence(results.leftHandLandmarks),
          } : undefined,
          right: results.rightHandLandmarks ? {
            detected: true,
            landmarks: results.rightHandLandmarks,
            confidence: this.calculateHandConfidence(results.rightHandLandmarks),
          } : undefined,
        },
        pose: hasPose ? {
          detected: true,
          keypoints: this.convertPoseLandmarksToKeypoints(results.poseLandmarks || []),
          confidence: this.calculatePoseConfidence(results.poseLandmarks || []),
        } : undefined,
        segmentation: results.segmentationMask || null,
        timestamp: Date.now(),
      };

      this.lastResult = result;
      this.lastHolisticDetectedTime = Date.now();

      if (this.onHolisticDetectedCallback) {
        this.onHolisticDetectedCallback(result);
      }
    } else {
      // Holistic perdu
      const timeSinceLastDetection = Date.now() - this.lastHolisticDetectedTime;
      if (timeSinceLastDetection > this.holisticLostThreshold && this.lastResult?.detected) {
        this.lastResult = { ...this.lastResult, detected: false };
        if (this.onHolisticLostCallback) {
          this.onHolisticLostCallback();
        }
      }
    }
  }

  /**
   * Calcule la confidence faciale
   */
  private calculateFaceConfidence(landmarks: any[]): number {
    if (!landmarks || landmarks.length === 0) return 0;
    // MediaPipe Holistic ne retourne pas de visibility pour face
    return 0.9; // Default high confidence
  }

  /**
   * Calcule la confidence de la main
   */
  private calculateHandConfidence(landmarks: any[]): number {
    if (!landmarks || landmarks.length === 0) return 0;
    // MediaPipe Holistic ne retourne pas de visibility pour hands
    return 0.85; // Default high confidence
  }

  /**
   * Calcule la confidence de la pose
   */
  private calculatePoseConfidence(landmarks: any[]): number {
    if (!landmarks || landmarks.length === 0) return 0;
    
    const visibilities = landmarks
      .map((l) => l.visibility || 0)
      .filter((v) => v > 0);
    
    if (visibilities.length === 0) return 0;
    
    return visibilities.reduce((sum, v) => sum + v, 0) / visibilities.length;
  }

  /**
   * Convertit les landmarks de pose en keypoints
   */
  private convertPoseLandmarksToKeypoints(landmarks: any[]): any[] {
    return landmarks.map((landmark) => ({
      x: landmark.x,
      y: landmark.y,
      z: landmark.z || 0,
      visibility: landmark.visibility,
    }));
  }

  /**
   * Démarre le tracking
   */
  async start(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('HolisticTracker not initialized. Call init() first.');
    }

    if (this.isTracking) {
      this.logger.warn('Holistic Tracker already started');
      return;
    }

    try {
      if (this.camera) {
        await this.camera.start();
        this.isTracking = true;
        this.logger.info('✅ Holistic Tracker started');
      }
    } catch (error) {
      this.logger.error('Failed to start Holistic Tracker', error);
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

    try {
      if (this.camera) {
        this.camera.stop();
        this.isTracking = false;
        this.logger.info('✅ Holistic Tracker stopped');
      }
    } catch (error) {
      this.logger.error('Failed to stop Holistic Tracker', error);
      throw error;
    }
  }

  /**
   * Event listeners
   */
  on(event: 'holisticDetected', callback: (result: HolisticTrackingResult) => void): void;
  on(event: 'holisticLost', callback: () => void): void;
  on(event: string, callback: any): void {
    if (event === 'holisticDetected') {
      this.onHolisticDetectedCallback = callback;
    } else if (event === 'holisticLost') {
      this.onHolisticLostCallback = callback;
    }
  }

  /**
   * Obtient le dernier résultat
   */
  getLastResult(): HolisticTrackingResult | null {
    return this.lastResult;
  }

  /**
   * Obtient les statistiques de performance
   */
  getStats(): { frameCount: number; fps: number } {
    const now = performance.now();
    this.frameTimestamps.push(now);
    while (this.frameTimestamps.length > this.fpsWindowSize) {
      this.frameTimestamps.shift();
    }
    
    let fps = 0;
    if (this.frameTimestamps.length >= 2) {
      const duration = (this.frameTimestamps[this.frameTimestamps.length - 1] - this.frameTimestamps[0]) / 1000;
      if (duration > 0) {
        fps = Math.round((this.frameTimestamps.length - 1) / duration);
      }
    }
    
    return {
      frameCount: this.frameCount,
      fps,
    };
  }

  /**
   * Nettoie les ressources
   */
  async dispose(): Promise<void> {
    await this.stop();
    this.holistic = null;
    this.camera = null;
    this.videoElement = null;
    this.isInitialized = false;
    this.logger.info('✅ Holistic Tracker disposed');
  }
}
