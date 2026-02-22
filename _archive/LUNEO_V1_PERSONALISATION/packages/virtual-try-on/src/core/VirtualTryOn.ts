/**
 * @luneo/virtual-try-on - Classe principale
 * Virtual Try-On professionnel avec architecture propre
 */

import type {
  VirtualTryOnConfig,
  VirtualTryOnState,
  VirtualTryOnEvents,
  PerformanceMetrics,
  ScreenshotOptions,
  ScreenshotResult,
} from './types';

import { CameraManager } from './CameraManager';
import { Logger } from '../utils/Logger';
import { ErrorHandler } from '../utils/ErrorHandler';
import { PerformanceMonitor } from '../utils/PerformanceMonitor';
import { ModelLoader } from '../rendering/ModelLoader';
import { ThreeRenderer } from '../rendering/ThreeRenderer';
import { FaceTracker } from '../tracking/FaceTracker';
import { HandTracker } from '../tracking/HandTracker';
import * as THREE from 'three';

/**
 * Classe principale Virtual Try-On
 * 
 * Architecture:
 * - Camera Management
 * - Face/Hand Tracking
 * - 3D Rendering
 * - Performance Monitoring
 * 
 * @example
 * ```typescript
 * const tryOn = new VirtualTryOn({
 *   container: document.getElementById('container'),
 *   category: 'glasses',
 *   model3dUrl: '/models/sunglasses.glb'
 * });
 * 
 * await tryOn.init();
 * await tryOn.start();
 * ```
 */
export class VirtualTryOn {
  // État
  private state: VirtualTryOnState = 'idle';
  private config: VirtualTryOnConfig;
  
  // Managers
  private cameraManager: CameraManager;
  private logger: Logger;
  private errorHandler: ErrorHandler;
  private performanceMonitor: PerformanceMonitor;
  
  // Rendering & Tracking
  private modelLoader: ModelLoader;
  private threeRenderer: ThreeRenderer | null = null;
  private faceTracker: FaceTracker;
  private handTracker: HandTracker;
  private currentModel: THREE.Group | null = null;
  
  // Event listeners
  private eventListeners: Map<keyof VirtualTryOnEvents, Function[]> = new Map();
  
  // Animation frame
  private animationFrameId: number | null = null;

  /**
   * Constructeur
   * @param config Configuration du Virtual Try-On
   */
  constructor(config: VirtualTryOnConfig) {
    this.config = {
      debug: false,
      ...config,
    };
    
    // Initialize logger
    this.logger = new Logger({
      level: this.config.debug ? 'debug' : 'info',
      prefix: '[VirtualTryOn]',
      timestamp: true,
    });
    
    this.logger.info('VirtualTryOn instance created', {
      category: this.config.category,
      debug: this.config.debug,
    });
    
    // Initialize error handler
    this.errorHandler = new ErrorHandler(this.logger);
    
    // Initialize performance monitor
    this.performanceMonitor = new PerformanceMonitor({
      sampleSize: 60,
      warningThreshold: 30, // FPS warning
      criticalThreshold: 15, // FPS critical
    });
    
    // Initialize camera manager
    this.cameraManager = new CameraManager({
      facingMode: config.cameraOptions?.facingMode || 'user',
      width: config.cameraOptions?.width || 1280,
      height: config.cameraOptions?.height || 720,
      frameRate: config.cameraOptions?.frameRate || 30,
    }, this.logger);
    
    // Initialize model loader
    this.modelLoader = new ModelLoader(this.logger);
    
    // Initialize trackers
    this.faceTracker = new FaceTracker({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    }, this.logger);
    
    this.handTracker = new HandTracker({
      maxNumHands: 2,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    }, this.logger);
    
    // Validate container
    if (!this.config.container) {
      throw this.errorHandler.createError(
        'Container element is required',
        'INVALID_CONTAINER',
        'camera',
        false
      );
    }
  }

  /**
   * Initialise le Virtual Try-On
   * - Accès caméra
   * - Chargement modèle 3D
   * - Initialisation tracking
   */
  async init(): Promise<void> {
    try {
      this.state = 'initializing';
      this.logger.info('Initializing Virtual Try-On...');
      
      // 1. Initialize camera
      this.logger.debug('Step 1/4: Initializing camera...');
      await this.cameraManager.init();
      this.emit('camera:ready');
      this.logger.info('✅ Camera ready');
      
      // 2. Load 3D model
      this.logger.debug('Step 2/4: Loading 3D model...');
      if (this.config.model3dUrl) {
        await this.modelLoader.load(this.config.model3dUrl, {
          scale: this.config.modelScale || 1,
          useDraco: true,
        });
        this.logger.info('✅ Model loaded');
      } else {
        this.logger.warn('No 3D model URL provided, skipping model loading');
      }
      
      // 3. Initialize tracking based on category
      this.logger.debug('Step 3/4: Initializing tracking...');
      const videoElement = this.cameraManager.getVideoElement();
      if (videoElement) {
        if (this.config.category === 'watches' || this.config.category === 'bracelets' || this.config.category === 'rings') {
          // Hand tracking for wrist/hand jewelry
          await this.handTracker.init(videoElement);
          this.logger.info('✅ Hand tracking initialized');
        } else {
          // Face tracking for glasses, earrings, etc.
          await this.faceTracker.init(videoElement);
          this.logger.info('✅ Face tracking initialized');
        }
      }
      
      // 4. Setup rendering
      this.logger.debug('Step 4/4: Setting up rendering...');
      const container = this.config.container;
      if (container && videoElement) {
        this.threeRenderer = new ThreeRenderer({
          container,
          videoElement,
          width: videoElement.videoWidth || 1280,
          height: videoElement.videoHeight || 720,
          antialias: true,
          shadows: true,
        }, this.logger);
        this.threeRenderer.init();
        
        // Add loaded model to scene
        if (this.config.model3dUrl) {
          const model = await this.modelLoader.load(this.config.model3dUrl);
          this.threeRenderer.addToScene(model);
          this.currentModel = model;
        }
        
        this.logger.info('✅ Rendering ready');
      }
      
      this.state = 'ready';
      this.logger.info('🎉 Virtual Try-On initialized successfully');
      
    } catch (error) {
      this.state = 'error';
      const handledError = this.errorHandler.handleError(error as Error, 'camera');
      this.emit('error', handledError);
      throw handledError;
    }
  }

  /**
   * Démarre le Virtual Try-On
   */
  async start(): Promise<void> {
    if (this.state !== 'ready' && this.state !== 'paused') {
      throw this.errorHandler.createError(
        'Virtual Try-On must be initialized before starting',
        'INVALID_STATE',
        'camera',
        true
      );
    }
    
    try {
      this.logger.info('Starting Virtual Try-On...');
      this.state = 'running';
      
      // Start camera stream
      await this.cameraManager.start();
      
      // Start render loop
      this.startRenderLoop();
      
      this.logger.info('✅ Virtual Try-On started');
      
    } catch (error) {
      this.state = 'error';
      const handledError = this.errorHandler.handleError(error as Error, 'camera');
      this.emit('error', handledError);
      throw handledError;
    }
  }

  /**
   * Met en pause le Virtual Try-On
   */
  pause(): void {
    if (this.state !== 'running') return;
    
    this.logger.info('Pausing Virtual Try-On...');
    this.state = 'paused';
    
    // Stop render loop
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // Pause camera (keep stream alive)
    // Camera pause implementation if needed
    
    this.logger.info('✅ Virtual Try-On paused');
  }

  /**
   * Reprend le Virtual Try-On après pause
   */
  resume(): void {
    if (this.state !== 'paused') return;
    
    this.logger.info('Resuming Virtual Try-On...');
    this.state = 'running';
    
    // Resume render loop
    this.startRenderLoop();
    
    this.logger.info('✅ Virtual Try-On resumed');
  }

  /**
   * Arrête et nettoie le Virtual Try-On
   */
  async stop(): Promise<void> {
    this.logger.info('Stopping Virtual Try-On...');
    
    // Stop render loop
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // Stop camera
    await this.cameraManager.stop();
    
    this.state = 'idle';
    this.logger.info('✅ Virtual Try-On stopped');
  }

  /**
   * Prend un screenshot
   */
  async takeScreenshot(options?: ScreenshotOptions): Promise<ScreenshotResult> {
    if (this.state !== 'running') {
      throw this.errorHandler.createError(
        'Virtual Try-On must be running to take screenshot',
        'INVALID_STATE',
        'rendering',
        true
      );
    }
    
    this.logger.debug('Taking screenshot...', options);
    
    try {
      // Get the container canvas element
      const container = this.config.container;
      const canvas = container.querySelector('canvas');
      
      if (!canvas) {
        throw new Error('No canvas element found in container');
      }
      
      // Create output canvas with requested dimensions
      const outputCanvas = document.createElement('canvas');
      const outputCtx = outputCanvas.getContext('2d');
      
      if (!outputCtx) {
        throw new Error('Failed to create output canvas context');
      }
      
      const width = options?.width || canvas.width;
      const height = options?.height || canvas.height;
      const quality = options?.quality || 0.92;
      const format = options?.format || 'image/png';
      
      outputCanvas.width = width;
      outputCanvas.height = height;
      
      // Draw the source canvas to output canvas (handles resizing)
      outputCtx.drawImage(canvas, 0, 0, width, height);
      
      // Convert to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        outputCanvas.toBlob(
          (b) => {
            if (b) resolve(b);
            else reject(new Error('Failed to create screenshot blob'));
          },
          format,
          quality
        );
      });
      
      // Generate data URL if needed
      const dataUrl = outputCanvas.toDataURL(format, quality);
      
      this.logger.info('Screenshot captured successfully', { width, height, format });
      
      return {
        blob,
        dataUrl,
        width,
        height,
        timestamp: Date.now(),
      };
    } catch (error) {
      this.logger.error('Screenshot capture failed', error);
      throw error;
    }
  }

  /**
   * Obtient les métriques de performance
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return this.performanceMonitor.getMetrics();
  }

  /**
   * Obtient l'état actuel
   */
  getState(): VirtualTryOnState {
    return this.state;
  }

  /**
   * Vérifie si le Virtual Try-On est en cours d'exécution
   */
  isRunning(): boolean {
    return this.state === 'running';
  }

  /**
   * Ajoute un event listener
   */
  on<K extends keyof VirtualTryOnEvents>(
    event: K,
    callback: VirtualTryOnEvents[K]
  ): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * Retire un event listener
   */
  off<K extends keyof VirtualTryOnEvents>(
    event: K,
    callback: VirtualTryOnEvents[K]
  ): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Émet un événement
   */
  private emit<K extends keyof VirtualTryOnEvents>(
    event: K,
    ...args: Parameters<VirtualTryOnEvents[K]>
  ): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          (callback as any)(...args);
        } catch (error) {
          this.logger.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Update model position/rotation from face tracking data
   */
  private updateModelFromFaceTracking(faceResult: import('../core/types').FaceTrackingResult): void {
    if (!this.currentModel) return;
    
    // Apply the transformation matrix from face tracking
    const transform = faceResult.transform;
    if (transform) {
      // Decompose matrix into position, rotation, scale
      const position = new THREE.Vector3();
      const quaternion = new THREE.Quaternion();
      const scale = new THREE.Vector3();
      transform.decompose(position, quaternion, scale);
      
      // Apply transforms based on category
      switch (this.config.category) {
        case 'glasses':
          // Position at nose bridge, offset for glasses
          this.currentModel.position.set(
            position.x,
            position.y + 0.05, // Slight offset up for glasses
            position.z - 0.1   // Slight offset forward
          );
          this.currentModel.quaternion.copy(quaternion);
          this.currentModel.scale.setScalar(scale.x * (this.config.modelScale || 1));
          break;
          
        case 'earrings':
          // Position at ear landmarks
          const earOffset = 0.15;
          this.currentModel.position.set(
            position.x + (this.config.side === 'left' ? -earOffset : earOffset),
            position.y - 0.05,
            position.z
          );
          this.currentModel.quaternion.copy(quaternion);
          this.currentModel.scale.setScalar(scale.x * (this.config.modelScale || 0.5));
          break;
          
        case 'necklaces':
          // Position below chin
          this.currentModel.position.set(
            position.x,
            position.y - 0.2,
            position.z + 0.05
          );
          this.currentModel.quaternion.copy(quaternion);
          this.currentModel.scale.setScalar(scale.x * (this.config.modelScale || 0.8));
          break;
          
        default:
          this.currentModel.position.copy(position);
          this.currentModel.quaternion.copy(quaternion);
          this.currentModel.scale.setScalar(scale.x * (this.config.modelScale || 1));
      }
    }
  }

  /**
   * Update model position/rotation from hand tracking data
   */
  private updateModelFromHandTracking(handResult: import('./types').HandTrackingResult): void {
    if (!this.currentModel) return;
    
    // Hand landmark indices (MediaPipe)
    const WRIST = 0;
    const MIDDLE_FINGER_MCP = 9;
    const RING_FINGER_MCP = 13;
    
    // Get wrist position for watches/bracelets
    const wrist = handResult.landmarks[WRIST];
    if (!wrist) return;
    
    // Convert normalized coordinates to scene space
    const position = new THREE.Vector3(
      (wrist.x - 0.5) * 2,   // Map 0-1 to -1 to 1
      -(wrist.y - 0.5) * 2,  // Invert Y and map
      wrist.z * 0.5          // Z depth
    );
    
    switch (this.config.category) {
      case 'watches':
      case 'bracelets':
        // Position at wrist
        this.currentModel.position.copy(position);
        
        // Calculate rotation from wrist to middle finger base
        const middleMcp = handResult.landmarks[MIDDLE_FINGER_MCP];
        if (middleMcp) {
          const direction = new THREE.Vector3(
            middleMcp.x - wrist.x,
            middleMcp.y - wrist.y,
            middleMcp.z - wrist.z
          ).normalize();
          
          // Create rotation to align with hand direction
          const up = new THREE.Vector3(0, 1, 0);
          const quaternion = new THREE.Quaternion();
          quaternion.setFromUnitVectors(up, direction);
          this.currentModel.quaternion.copy(quaternion);
        }
        
        this.currentModel.scale.setScalar(this.config.modelScale || 0.3);
        break;
        
      case 'rings':
        // Position at ring finger
        const ringMcp = handResult.landmarks[RING_FINGER_MCP];
        if (ringMcp) {
          this.currentModel.position.set(
            (ringMcp.x - 0.5) * 2,
            -(ringMcp.y - 0.5) * 2,
            ringMcp.z * 0.5
          );
        } else {
          this.currentModel.position.copy(position);
        }
        this.currentModel.scale.setScalar(this.config.modelScale || 0.1);
        break;
        
      default:
        this.currentModel.position.copy(position);
        this.currentModel.scale.setScalar(this.config.modelScale || 0.3);
    }
  }

  /**
   * Boucle de rendu principale
   */
  private startRenderLoop(): void {
    const render = () => {
      if (this.state !== 'running') return;
      
      // Start performance measurement
      this.performanceMonitor.startFrame();
      
      try {
        // 1. Get tracking data based on category
        if (this.config.category === 'watches' || this.config.category === 'bracelets' || this.config.category === 'rings') {
          // Hand tracking for wrist/hand jewelry - try right hand first, then left
          const rightHandResult = this.handTracker.getLastResult('Right');
          const leftHandResult = this.handTracker.getLastResult('Left');
          const handResult = rightHandResult || leftHandResult;
          if (handResult && this.currentModel) {
            this.updateModelFromHandTracking(handResult);
          }
        } else {
          // Face tracking for glasses, earrings, etc.
          const faceResult = this.faceTracker.getLastResult();
          if (faceResult && this.currentModel) {
            this.updateModelFromFaceTracking(faceResult);
          }
        }
        
        // 2. Render the scene
        if (this.threeRenderer) {
          this.threeRenderer.render();
        }
        
      } catch (error) {
        this.logger.error('Render loop error:', error);
      }
      
      // End performance measurement
      this.performanceMonitor.endFrame();
      
      // Emit FPS if significant change
      const metrics = this.performanceMonitor.getMetrics();
      this.emit('performance:fps', metrics.averageFPS);
      
      // Schedule next frame
      this.animationFrameId = requestAnimationFrame(render);
    };
    
    // Start loop
    this.animationFrameId = requestAnimationFrame(render);
  }
}

