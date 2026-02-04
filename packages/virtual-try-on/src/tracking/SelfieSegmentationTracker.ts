/**
 * @luneo/virtual-try-on - Selfie Segmentation Tracker professionnel
 * Segmentation selfie avec MediaPipe Selfie Segmentation (masque)
 */

import { SelfieSegmentation, Results as SelfieSegmentationResults } from '@mediapipe/selfie_segmentation';
import { Camera } from '@mediapipe/camera_utils';
import type { Logger } from '../utils/Logger';

/**
 * Configuration du Selfie Segmentation Tracker
 */
export interface SelfieSegmentationConfig {
  /** Sélection du modèle (0=general, 1=landscape) */
  modelSelection?: 0 | 1;
}

/**
 * Résultat de la segmentation
 */
export interface SelfieSegmentationResult {
  detected: boolean;
  mask: ImageData | null;
  confidence: number;
  timestamp: number;
}

/**
 * Selfie Segmentation Tracker professionnel avec MediaPipe
 * 
 * Features:
 * - Masque de segmentation précis
 * - Deux modèles (general, landscape)
 * - Tracking temps réel
 * - Confidence scoring
 * 
 * @example
 * ```typescript
 * const tracker = new SelfieSegmentationTracker({
 *   modelSelection: 1, // landscape
 * }, logger);
 * 
 * await tracker.init(videoElement);
 * 
 * tracker.on('segmentationDetected', (result) => {
 *   console.log('Segmentation mask:', result.mask);
 * });
 * 
 * await tracker.start();
 * ```
 */
export class SelfieSegmentationTracker {
  private segmentation: SelfieSegmentation | null = null;
  private camera: Camera | null = null;
  private config: Required<SelfieSegmentationConfig>;
  private videoElement: HTMLVideoElement | null = null;
  
  // État
  private isInitialized: boolean = false;
  private isTracking: boolean = false;
  private lastResult: SelfieSegmentationResult | null = null;
  
  // Event callbacks
  private onSegmentationDetectedCallback: ((result: SelfieSegmentationResult) => void) | null = null;
  private onSegmentationLostCallback: (() => void) | null = null;
  
  // Performance
  private frameCount: number = 0;
  private lastSegmentationDetectedTime: number = 0;
  private segmentationLostThreshold: number = 500; // ms
  
  // FPS tracking
  private frameTimestamps: number[] = [];
  private fpsWindowSize: number = 30;

  constructor(
    config: SelfieSegmentationConfig = {},
    private logger: Logger
  ) {
    this.config = {
      modelSelection: config.modelSelection ?? 1, // Default landscape
    };
    
    this.logger.debug('SelfieSegmentationTracker created', this.config);
  }

  /**
   * Initialise MediaPipe Selfie Segmentation
   */
  async init(videoElement: HTMLVideoElement): Promise<void> {
    try {
      this.videoElement = videoElement;
      this.logger.info('Initializing Selfie Segmentation Tracker...');

      // Créer instance SelfieSegmentation
      this.segmentation = new SelfieSegmentation({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
        },
      });

      // Configurer options
      this.segmentation.setOptions({
        modelSelection: this.config.modelSelection,
      });

      // Callback pour résultats
      this.segmentation.onResults((results: SelfieSegmentationResults) => {
        this.handleResults(results);
      });

      // Initialiser caméra
      this.camera = new Camera(videoElement, {
        onFrame: async () => {
          if (this.segmentation) {
            await this.segmentation.send({ image: videoElement });
          }
        },
        width: 1280,
        height: 720,
      });

      this.isInitialized = true;
      this.logger.info('✅ Selfie Segmentation Tracker initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Selfie Segmentation Tracker', error);
      throw error;
    }
  }

  /**
   * Traite les résultats MediaPipe
   */
  private handleResults(results: SelfieSegmentationResults): void {
    this.frameCount++;

    if (results.segmentationMask) {
      const mask = this.convertMaskToImageData(results.segmentationMask);
      const confidence = this.calculateConfidence(results.segmentationMask);

      const result: SelfieSegmentationResult = {
        detected: true,
        mask,
        confidence,
        timestamp: Date.now(),
      };

      this.lastResult = result;
      this.lastSegmentationDetectedTime = Date.now();

      if (this.onSegmentationDetectedCallback) {
        this.onSegmentationDetectedCallback(result);
      }
    } else {
      // Segmentation perdue
      const timeSinceLastDetection = Date.now() - this.lastSegmentationDetectedTime;
      if (timeSinceLastDetection > this.segmentationLostThreshold && this.lastResult?.detected) {
        this.lastResult = { ...this.lastResult, detected: false };
        if (this.onSegmentationLostCallback) {
          this.onSegmentationLostCallback();
        }
      }
    }
  }

  /**
   * Convertit le masque MediaPipe en ImageData
   */
  private convertMaskToImageData(mask: any): ImageData | null {
    try {
      // MediaPipe retourne un canvas ou ImageData
      if (mask instanceof ImageData) {
        return mask;
      }
      
      if (mask instanceof HTMLCanvasElement) {
        const ctx = mask.getContext('2d');
        if (ctx) {
          return ctx.getImageData(0, 0, mask.width, mask.height);
        }
      }
      
      // Si c'est un array, créer ImageData
      if (Array.isArray(mask) || mask.data) {
        const width = mask.width || this.videoElement?.videoWidth || 640;
        const height = mask.height || this.videoElement?.videoHeight || 480;
        const data = mask.data || mask;
        
        return new ImageData(
          new Uint8ClampedArray(data),
          width,
          height
        );
      }
      
      return null;
    } catch (error) {
      this.logger.error('Failed to convert mask to ImageData', error);
      return null;
    }
  }

  /**
   * Calcule la confidence moyenne du masque
   */
  private calculateConfidence(mask: any): number {
    try {
      if (mask instanceof ImageData) {
        const data = mask.data;
        let sum = 0;
        let count = 0;
        
        // Prendre un échantillon pour performance
        for (let i = 0; i < data.length; i += 4) {
          const alpha = data[i + 3];
          sum += alpha / 255;
          count++;
        }
        
        return count > 0 ? sum / count : 0;
      }
      
      return 0.8; // Default confidence
    } catch (error) {
      this.logger.error('Failed to calculate confidence', error);
      return 0;
    }
  }

  /**
   * Démarre le tracking
   */
  async start(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('SelfieSegmentationTracker not initialized. Call init() first.');
    }

    if (this.isTracking) {
      this.logger.warn('Selfie Segmentation Tracker already started');
      return;
    }

    try {
      if (this.camera) {
        await this.camera.start();
        this.isTracking = true;
        this.logger.info('✅ Selfie Segmentation Tracker started');
      }
    } catch (error) {
      this.logger.error('Failed to start Selfie Segmentation Tracker', error);
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
        this.logger.info('✅ Selfie Segmentation Tracker stopped');
      }
    } catch (error) {
      this.logger.error('Failed to stop Selfie Segmentation Tracker', error);
      throw error;
    }
  }

  /**
   * Event listeners
   */
  on(event: 'segmentationDetected', callback: (result: SelfieSegmentationResult) => void): void;
  on(event: 'segmentationLost', callback: () => void): void;
  on(event: string, callback: any): void {
    if (event === 'segmentationDetected') {
      this.onSegmentationDetectedCallback = callback;
    } else if (event === 'segmentationLost') {
      this.onSegmentationLostCallback = callback;
    }
  }

  /**
   * Obtient le dernier résultat
   */
  getLastResult(): SelfieSegmentationResult | null {
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
    this.segmentation = null;
    this.camera = null;
    this.videoElement = null;
    this.isInitialized = false;
    this.logger.info('✅ Selfie Segmentation Tracker disposed');
  }
}
