/**
 * @luneo/virtual-try-on - Pose Tracker professionnel
 * Tracking corps entier avec MediaPipe Pose (33 keypoints)
 */

import { Pose, Results as PoseResults } from '@mediapipe/pose';
import { Camera } from '@mediapipe/camera_utils';
import * as THREE from 'three';
import type { Logger } from '../utils/Logger';

/**
 * Configuration du Pose Tracker
 */
export interface PoseTrackerConfig {
  /** Complexité du modèle (0=lite, 1=full, 2=heavy) */
  modelComplexity?: 0 | 1 | 2;
  
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
 * Résultat du tracking pose
 */
export interface PoseTrackingResult {
  detected: boolean;
  keypoints: PoseKeypoint[];
  confidence: number;
  segmentation?: ImageData | null;
  timestamp: number;
}

/**
 * Keypoint de pose (33 keypoints MediaPipe)
 */
export interface PoseKeypoint {
  x: number;
  y: number;
  z: number;
  visibility?: number;
  name: string;
}

/**
 * Indices des keypoints MediaPipe Pose
 */
export const POSE_KEYPOINTS_INDICES = {
  // Visage
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  
  // Torse
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  
  // Corps inférieur
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
} as const;

/**
 * Noms des keypoints
 */
const POSE_KEYPOINT_NAMES = [
  'nose', 'left_eye_inner', 'left_eye', 'left_eye_outer',
  'right_eye_inner', 'right_eye', 'right_eye_outer',
  'left_ear', 'right_ear', 'mouth_left', 'mouth_right',
  'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
  'left_wrist', 'right_wrist', 'left_pinky', 'right_pinky',
  'left_index', 'right_index', 'left_thumb', 'right_thumb',
  'left_hip', 'right_hip', 'left_knee', 'right_knee',
  'left_ankle', 'right_ankle', 'left_heel', 'right_heel',
  'left_foot_index', 'right_foot_index',
];

/**
 * Pose Tracker professionnel avec MediaPipe
 * 
 * Features:
 * - 33 pose keypoints
 * - Tracking temps réel
 * - Segmentation optionnelle
 * - Confidence scoring
 * 
 * @example
 * ```typescript
 * const tracker = new PoseTracker({
 *   modelComplexity: 1,
 *   smoothLandmarks: true,
 *   minDetectionConfidence: 0.5
 * }, logger);
 * 
 * await tracker.init(videoElement);
 * 
 * tracker.on('poseDetected', (result) => {
 *   console.log(`Pose detected: ${result.keypoints.length} keypoints`);
 * });
 * 
 * await tracker.start();
 * ```
 */
export class PoseTracker {
  private pose: Pose | null = null;
  private camera: Camera | null = null;
  private config: Required<PoseTrackerConfig>;
  private videoElement: HTMLVideoElement | null = null;
  
  // État
  private isInitialized: boolean = false;
  private isTracking: boolean = false;
  private lastResult: PoseTrackingResult | null = null;
  
  // Event callbacks
  private onPoseDetectedCallback: ((result: PoseTrackingResult) => void) | null = null;
  private onPoseLostCallback: (() => void) | null = null;
  
  // Performance
  private frameCount: number = 0;
  private lastPoseDetectedTime: number = 0;
  private poseLostThreshold: number = 500; // ms

  constructor(
    config: PoseTrackerConfig = {},
    private logger: Logger
  ) {
    this.config = {
      modelComplexity: config.modelComplexity ?? 1,
      smoothLandmarks: config.smoothLandmarks !== false,
      enableSegmentation: config.enableSegmentation ?? false,
      smoothSegmentation: config.smoothSegmentation ?? false,
      minDetectionConfidence: config.minDetectionConfidence ?? 0.5,
      minTrackingConfidence: config.minTrackingConfidence ?? 0.5,
    };
    
    this.logger.debug('PoseTracker created', this.config);
  }

  /**
   * Initialise MediaPipe Pose
   */
  async init(videoElement: HTMLVideoElement): Promise<void> {
    try {
      this.videoElement = videoElement;
      this.logger.info('Initializing Pose Tracker...');

      // Créer instance Pose
      this.pose = new Pose({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        },
      });

      // Configurer options
      this.pose.setOptions({
        modelComplexity: this.config.modelComplexity,
        smoothLandmarks: this.config.smoothLandmarks,
        enableSegmentation: this.config.enableSegmentation,
        smoothSegmentation: this.config.smoothSegmentation,
        minDetectionConfidence: this.config.minDetectionConfidence,
        minTrackingConfidence: this.config.minTrackingConfidence,
      });

      // Callback pour résultats
      this.pose.onResults((results: PoseResults) => {
        this.handleResults(results);
      });

      // Initialiser caméra
      this.camera = new Camera(videoElement, {
        onFrame: async () => {
          if (this.pose) {
            await this.pose.send({ image: videoElement });
          }
        },
        width: 1280,
        height: 720,
      });

      this.isInitialized = true;
      this.logger.info('✅ Pose Tracker initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Pose Tracker', error);
      throw error;
    }
  }

  /**
   * Traite les résultats MediaPipe
   */
  private handleResults(results: PoseResults): void {
    this.frameCount++;

    if (results.poseLandmarks && results.poseLandmarks.length > 0) {
      const keypoints = this.convertLandmarksToKeypoints(results.poseLandmarks);
      const confidence = this.calculateConfidence(results.poseLandmarks);

      const result: PoseTrackingResult = {
        detected: true,
        keypoints,
        confidence,
        segmentation: results.segmentationMask || null,
        timestamp: Date.now(),
      };

      this.lastResult = result;
      this.lastPoseDetectedTime = Date.now();

      if (this.onPoseDetectedCallback) {
        this.onPoseDetectedCallback(result);
      }
    } else {
      // Pose perdue
      const timeSinceLastDetection = Date.now() - this.lastPoseDetectedTime;
      if (timeSinceLastDetection > this.poseLostThreshold && this.lastResult?.detected) {
        this.lastResult = { ...this.lastResult, detected: false };
        if (this.onPoseLostCallback) {
          this.onPoseLostCallback();
        }
      }
    }
  }

  /**
   * Convertit les landmarks MediaPipe en keypoints
   */
  private convertLandmarksToKeypoints(landmarks: any[]): PoseKeypoint[] {
    return landmarks.map((landmark, index) => ({
      x: landmark.x,
      y: landmark.y,
      z: landmark.z || 0,
      visibility: landmark.visibility,
      name: POSE_KEYPOINT_NAMES[index] || `keypoint_${index}`,
    }));
  }

  /**
   * Calcule la confidence moyenne
   */
  private calculateConfidence(landmarks: any[]): number {
    if (landmarks.length === 0) return 0;
    
    const visibilities = landmarks
      .map((l) => l.visibility || 0)
      .filter((v) => v > 0);
    
    if (visibilities.length === 0) return 0;
    
    return visibilities.reduce((sum, v) => sum + v, 0) / visibilities.length;
  }

  /**
   * Démarre le tracking
   */
  async start(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('PoseTracker not initialized. Call init() first.');
    }

    if (this.isTracking) {
      this.logger.warn('Pose Tracker already started');
      return;
    }

    try {
      if (this.camera) {
        await this.camera.start();
        this.isTracking = true;
        this.logger.info('✅ Pose Tracker started');
      }
    } catch (error) {
      this.logger.error('Failed to start Pose Tracker', error);
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
        this.logger.info('✅ Pose Tracker stopped');
      }
    } catch (error) {
      this.logger.error('Failed to stop Pose Tracker', error);
      throw error;
    }
  }

  /**
   * Event listeners
   */
  on(event: 'poseDetected', callback: (result: PoseTrackingResult) => void): void;
  on(event: 'poseLost', callback: () => void): void;
  on(event: string, callback: any): void {
    if (event === 'poseDetected') {
      this.onPoseDetectedCallback = callback;
    } else if (event === 'poseLost') {
      this.onPoseLostCallback = callback;
    }
  }

  /**
   * Obtient le dernier résultat
   */
  getLastResult(): PoseTrackingResult | null {
    return this.lastResult;
  }

  /**
   * Obtient les statistiques de performance
   */
  getStats(): { frameCount: number; fps: number } {
    return {
      frameCount: this.frameCount,
      fps: 0, // TODO: Calculer FPS réel
    };
  }

  /**
   * Nettoie les ressources
   */
  async dispose(): Promise<void> {
    await this.stop();
    this.pose = null;
    this.camera = null;
    this.videoElement = null;
    this.isInitialized = false;
    this.logger.info('✅ Pose Tracker disposed');
  }
}
