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
      // TODO: Implémenter dans ModelLoader
      this.logger.info('✅ Model loaded (TODO)');
      
      // 3. Initialize tracking
      this.logger.debug('Step 3/4: Initializing tracking...');
      // TODO: Implémenter dans FaceTracker/HandTracker
      this.logger.info('✅ Tracking initialized (TODO)');
      
      // 4. Setup rendering
      this.logger.debug('Step 4/4: Setting up rendering...');
      // TODO: Implémenter dans ThreeRenderer
      this.logger.info('✅ Rendering ready (TODO)');
      
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
    
    // TODO: Implémenter capture depuis Three.js renderer
    throw new Error('Screenshot not implemented yet');
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
   * Boucle de rendu principale
   */
  private startRenderLoop(): void {
    const render = () => {
      if (this.state !== 'running') return;
      
      // Start performance measurement
      this.performanceMonitor.startFrame();
      
      try {
        // TODO: Render loop implementation
        // 1. Get camera frame
        // 2. Run tracking (face/hand)
        // 3. Update 3D overlay position
        // 4. Render scene
        
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

