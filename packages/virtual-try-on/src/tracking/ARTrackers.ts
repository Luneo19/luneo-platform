/**
 * ★★★ AR TRACKERS STRUCTURE ★★★
 * Structure centralisée pour tous les trackers MediaPipe AR
 * 
 * ✅ Implémenté:
 * - Face detection (468 landmarks)
 * - Hand detection (21 landmarks par main)
 * - Pose detection (33 keypoints)
 * - Selfie segmentation (masque)
 * - Holistic (face + hands + pose combinés)
 * 
 * Dépendances requises:
 * - @mediapipe/face_mesh ✅
 * - @mediapipe/hands ✅
 * - @mediapipe/pose ✅
 * - @mediapipe/selfie_segmentation ✅
 * - @mediapipe/holistic ✅
 */

import { FaceTracker, FaceTrackerConfig } from './FaceTracker';
import { HandTracker, HandTrackerConfig } from './HandTracker';
import { PoseTracker, PoseTrackerConfig, PoseTrackingResult } from './PoseTracker';
import { SelfieSegmentationTracker, SelfieSegmentationConfig, SelfieSegmentationResult } from './SelfieSegmentationTracker';
import { HolisticTracker, HolisticTrackerConfig, HolisticTrackingResult } from './HolisticTracker';
import type { Logger } from '../utils/Logger';

/**
 * Configuration pour tous les trackers AR
 */
export interface ARTrackersConfig {
  face?: FaceTrackerConfig;
  hands?: HandTrackerConfig;
  pose?: PoseTrackerConfig;
  selfieSegmentation?: SelfieSegmentationConfig;
  holistic?: HolisticTrackerConfig;
}

/**
 * Résultats combinés de tous les trackers
 */
export interface ARTrackingResults {
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
  selfieSegmentation?: {
    mask: ImageData | null;
    confidence: number;
  };
}

/**
 * Classe principale pour gérer tous les trackers AR MediaPipe
 * 
 * @example
 * ```typescript
 * const trackers = new ARTrackers({
 *   face: { maxNumFaces: 1, refineLandmarks: true },
 *   hands: { maxNumHands: 2 },
 *   enablePose: true,
 * }, logger);
 * 
 * await trackers.initialize(videoElement);
 * 
 * trackers.onResults((results) => {
 *   if (results.face?.detected) {
 *     console.log('Face detected');
 *   }
 *   if (results.hands?.left?.detected) {
 *     console.log('Left hand detected');
 *   }
 * });
 * 
 * await trackers.start();
 * ```
 */
export class ARTrackers {
  private faceTracker: FaceTracker | null = null;
  private handTracker: HandTracker | null = null;
  private poseTracker: PoseTracker | null = null;
  private selfieSegmentationTracker: SelfieSegmentationTracker | null = null;
  private holisticTracker: HolisticTracker | null = null;

  private config: ARTrackersConfig;
  private logger: Logger;
  private videoElement: HTMLVideoElement | null = null;

  private onResultsCallback: ((results: ARTrackingResults) => void) | null = null;

  constructor(config: ARTrackersConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
  }

  /**
   * Initialise tous les trackers activés
   */
  async initialize(videoElement: HTMLVideoElement): Promise<void> {
    this.videoElement = videoElement;
    this.logger.info('Initializing AR Trackers...');

    try {
      // Face Tracker
      if (this.config.face) {
        this.faceTracker = new FaceTracker(this.config.face, this.logger);
        await this.faceTracker.init(videoElement);
        this.faceTracker.on('faceDetected', (result) => {
          this.onFaceDetected(result);
        });
        this.logger.info('✅ Face Tracker initialized');
      }

      // Hand Tracker
      if (this.config.hands) {
        this.handTracker = new HandTracker(this.config.hands, this.logger);
        await this.handTracker.init(videoElement);
        this.handTracker.on('handDetected', (result) => {
          this.onHandDetected(result);
        });
        this.logger.info('✅ Hand Tracker initialized');
      }

      // Pose Tracker
      if (this.config.pose) {
        this.poseTracker = new PoseTracker(this.config.pose, this.logger);
        await this.poseTracker.init(videoElement);
        this.poseTracker.on('poseDetected', (result) => {
          this.onPoseDetected(result);
        });
        this.logger.info('✅ Pose Tracker initialized');
      }

      // Selfie Segmentation Tracker
      if (this.config.selfieSegmentation) {
        this.selfieSegmentationTracker = new SelfieSegmentationTracker(this.config.selfieSegmentation, this.logger);
        await this.selfieSegmentationTracker.init(videoElement);
        this.selfieSegmentationTracker.on('segmentationDetected', (result) => {
          this.onSelfieSegmentationDetected(result);
        });
        this.logger.info('✅ Selfie Segmentation Tracker initialized');
      }

      // Holistic Tracker (Face + Hands + Pose combinés)
      if (this.config.holistic) {
        this.holisticTracker = new HolisticTracker(this.config.holistic, this.logger);
        await this.holisticTracker.init(videoElement);
        this.holisticTracker.on('holisticDetected', (result) => {
          this.onHolisticDetected(result);
        });
        this.logger.info('✅ Holistic Tracker initialized');
      }

      this.logger.info('✅ All AR Trackers initialized');
    } catch (error) {
      this.logger.error('Failed to initialize AR Trackers:', error);
      throw error;
    }
  }

  /**
   * Démarre le tracking
   */
  async start(): Promise<void> {
    this.logger.info('Starting AR Trackers...');

    const promises: Promise<void>[] = [];

    if (this.faceTracker) {
      promises.push(this.faceTracker.start());
    }

    if (this.handTracker) {
      promises.push(this.handTracker.start());
    }

    if (this.poseTracker) {
      promises.push(this.poseTracker.start());
    }

    if (this.selfieSegmentationTracker) {
      promises.push(this.selfieSegmentationTracker.start());
    }

    if (this.holisticTracker) {
      promises.push(this.holisticTracker.start());
    }

    await Promise.all(promises);
    this.logger.info('✅ All AR Trackers started');
  }

  /**
   * Arrête le tracking
   */
  async stop(): Promise<void> {
    this.logger.info('Stopping AR Trackers...');

    const promises: Promise<void>[] = [];

    if (this.faceTracker) {
      promises.push(this.faceTracker.stop());
    }

    if (this.handTracker) {
      promises.push(this.handTracker.stop());
    }

    if (this.poseTracker) {
      promises.push(this.poseTracker.stop());
    }

    if (this.selfieSegmentationTracker) {
      promises.push(this.selfieSegmentationTracker.stop());
    }

    if (this.holisticTracker) {
      promises.push(this.holisticTracker.stop());
    }

    await Promise.all(promises);
    this.logger.info('✅ All AR Trackers stopped');
  }

  /**
   * Callback pour les résultats combinés
   */
  onResults(callback: (results: ARTrackingResults) => void): void {
    this.onResultsCallback = callback;
  }

  /**
   * Récupère les résultats actuels de tous les trackers
   */
  getResults(): ARTrackingResults {
    const results: ARTrackingResults = {};

    if (this.faceTracker) {
      const faceResult = this.faceTracker.getLastResult();
      if (faceResult) {
        results.face = {
          detected: true,
          landmarks: faceResult.landmarks,
          confidence: faceResult.confidence || 0.9,
        };
      }
    }

    if (this.handTracker) {
      results.hands = {};

      const leftResult = this.handTracker.getLastResult('Left');
      if (leftResult) {
        results.hands.left = {
          detected: true,
          landmarks: leftResult.landmarks,
          confidence: leftResult.confidence || 0.9,
        };
      }

      const rightResult = this.handTracker.getLastResult('Right');
      if (rightResult) {
        results.hands.right = {
          detected: true,
          landmarks: rightResult.landmarks,
          confidence: rightResult.confidence || 0.9,
        };
      }
    }

    // Pose Tracker results
    if (this.poseTracker) {
      const poseResult = this.poseTracker.getLastResult();
      if (poseResult && poseResult.detected) {
        results.pose = {
          detected: true,
          keypoints: poseResult.keypoints,
          confidence: poseResult.confidence,
        };
      }
    }

    // Selfie Segmentation results
    if (this.selfieSegmentationTracker) {
      const segmentationResult = this.selfieSegmentationTracker.getLastResult();
      if (segmentationResult && segmentationResult.detected) {
        results.selfieSegmentation = {
          mask: segmentationResult.mask,
          confidence: segmentationResult.confidence,
        };
      }
    }

    // Holistic Tracker results (remplace les autres si activé)
    if (this.holisticTracker) {
      const holisticResult = this.holisticTracker.getLastResult();
      if (holisticResult && holisticResult.detected) {
        // Holistic combine tout, donc on utilise ses résultats
        if (holisticResult.face) {
          results.face = holisticResult.face;
        }
        if (holisticResult.hands) {
          results.hands = holisticResult.hands;
        }
        if (holisticResult.pose) {
          results.pose = holisticResult.pose;
        }
        if (holisticResult.segmentation) {
          results.selfieSegmentation = {
            mask: holisticResult.segmentation,
            confidence: 0.9, // Default confidence
          };
        }
      }
    }

    return results;
  }

  /**
   * Nettoie les ressources
   */
  async dispose(): Promise<void> {
    await this.stop();

    const disposePromises: Promise<void>[] = [];

    if (this.faceTracker && typeof (this.faceTracker as any).dispose === 'function') {
      disposePromises.push((this.faceTracker as any).dispose());
    }

    if (this.handTracker && typeof (this.handTracker as any).dispose === 'function') {
      disposePromises.push((this.handTracker as any).dispose());
    }

    if (this.poseTracker) {
      disposePromises.push(this.poseTracker.dispose());
    }

    if (this.selfieSegmentationTracker) {
      disposePromises.push(this.selfieSegmentationTracker.dispose());
    }

    if (this.holisticTracker) {
      disposePromises.push(this.holisticTracker.dispose());
    }

    await Promise.all(disposePromises);
    this.logger.info('✅ AR Trackers disposed');
  }

  // ========================================
  // PRIVATE METHODS
  // ========================================

  private onFaceDetected(result: any): void {
    if (this.onResultsCallback) {
      const results = this.getResults();
      this.onResultsCallback(results);
    }
  }

  private onHandDetected(result: any): void {
    if (this.onResultsCallback) {
      const results = this.getResults();
      this.onResultsCallback(results);
    }
  }

  private onPoseDetected(result: PoseTrackingResult): void {
    if (this.onResultsCallback) {
      const results = this.getResults();
      this.onResultsCallback(results);
    }
  }

  private onSelfieSegmentationDetected(result: SelfieSegmentationResult): void {
    if (this.onResultsCallback) {
      const results = this.getResults();
      this.onResultsCallback(results);
    }
  }

  private onHolisticDetected(result: HolisticTrackingResult): void {
    if (this.onResultsCallback) {
      const results = this.getResults();
      this.onResultsCallback(results);
    }
  }
}
