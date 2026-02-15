'use client';

import * as THREE from 'three';
import { HandTracker, HandLandmarks } from './HandTracker';
import { FaceTracker, FaceLandmarks } from './FaceTracker';
import type { BaseProductRenderer } from './renderers/BaseProductRenderer';
import { FPSOptimizer, QualityLevel } from './FPSOptimizer';
import { logger } from '@/lib/logger';

export type TryOnCategory =
  | 'watch'
  | 'ring'
  | 'bracelet'
  | 'earring'
  | 'necklace'
  | 'eyewear';

export type TrackerType = 'hand' | 'face';

export interface TryOnEngineConfig {
  category: TryOnCategory;
  videoElement: HTMLVideoElement;
  canvasElement: HTMLCanvasElement;
  modelUrl?: string;
  lodLevels?: { high?: string; medium?: string; low?: string };
  enableOcclusion?: boolean;
  enableShadows?: boolean;
  enableFPSOptimizer?: boolean;
  scaleFactor?: number;
  defaultPosition?: { x: number; y: number; z: number };
  defaultRotation?: { x: number; y: number; z: number };
}

export interface TryOnEngineCallbacks {
  onTracking?: (isTracking: boolean) => void;
  onFPSChange?: (fps: number) => void;
  onError?: (error: Error) => void;
  onQualityChange?: (quality: QualityLevel) => void;
  onPerformanceMetric?: (metric: {
    fps: number;
    detectionLatencyMs: number;
    renderLatencyMs: number;
  }) => void;
}

const CATEGORY_TO_TRACKER: Record<TryOnCategory, TrackerType> = {
  watch: 'hand',
  ring: 'hand',
  bracelet: 'hand',
  earring: 'face',
  necklace: 'face',
  eyewear: 'face',
};

/**
 * TryOnEngine - Core orchestrator for MediaPipe tracking + Three.js 3D rendering.
 * Manages the complete lifecycle of a Virtual Try-On session.
 */
export class TryOnEngine {
  private handTracker: HandTracker | null = null;
  private faceTracker: FaceTracker | null = null;
  private renderer: BaseProductRenderer | null = null;

  // Three.js
  private threeRenderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;

  // State
  private isRunning = false;
  private isPaused = false;
  private animationFrameId: number | null = null;
  private lastTrackingTime = 0;
  private isTracking = false;

  // FPS
  private fpsOptimizer: FPSOptimizer | null = null;
  private frameCount = 0;
  private lastFpsTime = 0;
  private currentFps = 0;

  // Config
  private config: TryOnEngineConfig;
  private callbacks: TryOnEngineCallbacks;
  private trackerType: TrackerType;

  constructor(config: TryOnEngineConfig, callbacks: TryOnEngineCallbacks = {}) {
    this.config = config;
    this.callbacks = callbacks;
    this.trackerType = CATEGORY_TO_TRACKER[config.category];
  }

  /**
   * Initialize all subsystems: tracker, Three.js scene, renderer.
   */
  async initialize(): Promise<void> {
    try {
      // Initialize Three.js scene
      this.initThreeScene();

      // Initialize MediaPipe tracker
      if (this.trackerType === 'hand') {
        this.handTracker = new HandTracker();
        this.handTracker.onResults(this.handleHandResults.bind(this));
        this.handTracker.onPerformanceMetric((latency) => {
          this.callbacks.onPerformanceMetric?.({
            fps: this.currentFps,
            detectionLatencyMs: latency,
            renderLatencyMs: 0, // Set during render
          });
        });
        await this.handTracker.initialize(this.config.videoElement);
      } else {
        this.faceTracker = new FaceTracker();
        this.faceTracker.onResults(this.handleFaceResults.bind(this));
        this.faceTracker.onPerformanceMetric((latency) => {
          this.callbacks.onPerformanceMetric?.({
            fps: this.currentFps,
            detectionLatencyMs: latency,
            renderLatencyMs: 0,
          });
        });
        await this.faceTracker.initialize(this.config.videoElement);
      }

      // Initialize FPS optimizer
      if (this.config.enableFPSOptimizer !== false) {
        this.fpsOptimizer = new FPSOptimizer({
          onQualityChange: (quality) => {
            this.applyQuality(quality);
            this.callbacks.onQualityChange?.(quality);
          },
        });
      }

      logger.info('TryOnEngine initialized', {
        category: this.config.category,
        tracker: this.trackerType,
      });
    } catch (error) {
      const err =
        error instanceof Error
          ? error
          : new Error('Failed to initialize TryOnEngine');
      this.callbacks.onError?.(err);
      throw err;
    }
  }

  /**
   * Set the product renderer (loaded dynamically based on category).
   */
  setRenderer(renderer: BaseProductRenderer): void {
    this.renderer = renderer;
    if (this.scene) {
      renderer.attachToScene(this.scene);
    }
  }

  /**
   * Start the try-on experience (tracking + rendering loop).
   */
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;

    // Start tracker
    if (this.handTracker) this.handTracker.start();
    if (this.faceTracker) this.faceTracker.start();

    // Start render loop
    this.lastFpsTime = performance.now();
    this.frameCount = 0;
    this.renderLoop();
  }

  /**
   * Stop completely (releases camera).
   */
  stop(): void {
    this.isRunning = false;
    this.isPaused = false;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.handTracker) this.handTracker.stop();
    if (this.faceTracker) this.faceTracker.stop();
  }

  /**
   * Pause rendering without releasing camera.
   */
  pause(): void {
    this.isPaused = true;
  }

  /**
   * Resume from pause.
   */
  resume(): void {
    if (this.isRunning) {
      this.isPaused = false;
    }
  }

  /**
   * Clean up all resources.
   */
  destroy(): void {
    this.stop();

    if (this.handTracker) {
      this.handTracker.destroy();
      this.handTracker = null;
    }

    if (this.faceTracker) {
      this.faceTracker.destroy();
      this.faceTracker = null;
    }

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }

    if (this.threeRenderer) {
      this.threeRenderer.dispose();
      this.threeRenderer = null;
    }

    this.scene = null;
    this.camera = null;
    this.fpsOptimizer = null;

    logger.info('TryOnEngine destroyed');
  }

  /**
   * Capture a composite screenshot (video + 3D overlay).
   */
  captureScreenshot(): string | null {
    if (!this.threeRenderer || !this.config.canvasElement) return null;

    const compositeCanvas = document.createElement('canvas');
    const ctx = compositeCanvas.getContext('2d');
    if (!ctx) return null;

    const { videoElement, canvasElement } = this.config;
    compositeCanvas.width = canvasElement.width;
    compositeCanvas.height = canvasElement.height;

    // Draw video frame
    ctx.drawImage(
      videoElement,
      0,
      0,
      compositeCanvas.width,
      compositeCanvas.height,
    );

    // Draw Three.js overlay on top
    ctx.drawImage(
      canvasElement,
      0,
      0,
      compositeCanvas.width,
      compositeCanvas.height,
    );

    return compositeCanvas.toDataURL('image/png');
  }

  /**
   * Get current FPS.
   */
  getFps(): number {
    return this.currentFps;
  }

  /**
   * Check if tracking is active (hand/face detected).
   */
  getIsTracking(): boolean {
    return this.isTracking;
  }

  // ========================================
  // Private methods
  // ========================================

  private initThreeScene(): void {
    const { canvasElement, videoElement } = this.config;

    // Match canvas to video dimensions
    canvasElement.width = videoElement.videoWidth || 1280;
    canvasElement.height = videoElement.videoHeight || 720;

    // Create WebGL renderer with transparency
    this.threeRenderer = new THREE.WebGLRenderer({
      canvas: canvasElement,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true, // Needed for screenshots
    });
    this.threeRenderer.setSize(canvasElement.width, canvasElement.height);
    this.threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.threeRenderer.outputColorSpace = THREE.SRGBColorSpace;
    this.threeRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.threeRenderer.toneMappingExposure = 1.0;

    if (this.config.enableShadows) {
      this.threeRenderer.shadowMap.enabled = true;
      this.threeRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    // Scene
    this.scene = new THREE.Scene();

    // Camera (orthographic-like perspective for AR overlay)
    const aspect = canvasElement.width / canvasElement.height;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    this.camera.position.set(0, 0, 5);
    this.camera.lookAt(0, 0, 0);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(2, 3, 5);
    if (this.config.enableShadows) {
      directionalLight.castShadow = true;
      directionalLight.shadow.mapSize.width = 1024;
      directionalLight.shadow.mapSize.height = 1024;
    }
    this.scene.add(directionalLight);

    // Fill light
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-2, 1, 3);
    this.scene.add(fillLight);
  }

  private renderLoop(): void {
    if (!this.isRunning) return;

    this.animationFrameId = requestAnimationFrame(() => this.renderLoop());

    if (this.isPaused) return;

    // FPS calculation
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFpsTime >= 1000) {
      this.currentFps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsTime = now;
      this.callbacks.onFPSChange?.(this.currentFps);
      this.fpsOptimizer?.recordFps(this.currentFps);
    }

    // Render Three.js scene
    if (this.threeRenderer && this.scene && this.camera) {
      const renderStart = performance.now();
      this.threeRenderer.render(this.scene, this.camera);
      const renderTime = performance.now() - renderStart;

      // Track render latency for performance metrics
      if (renderTime > 0 && this.callbacks.onPerformanceMetric) {
        // Only emit periodically to avoid flooding
        if (this.frameCount % 30 === 0) {
          this.callbacks.onPerformanceMetric({
            fps: this.currentFps,
            detectionLatencyMs: now - this.lastTrackingTime,
            renderLatencyMs: renderTime,
          });
        }
      }
    }
  }

  private handleHandResults(hands: HandLandmarks[]): void {
    this.lastTrackingTime = performance.now();
    const wasTracking = this.isTracking;
    this.isTracking = hands.length > 0;

    if (wasTracking !== this.isTracking) {
      this.callbacks.onTracking?.(this.isTracking);
    }

    if (this.renderer && this.isTracking) {
      this.renderer.updateFromHandTracking(hands);
    } else if (this.renderer) {
      this.renderer.setVisibility(false);
    }
  }

  private handleFaceResults(face: FaceLandmarks | null): void {
    this.lastTrackingTime = performance.now();
    const wasTracking = this.isTracking;
    this.isTracking = face !== null;

    if (wasTracking !== this.isTracking) {
      this.callbacks.onTracking?.(this.isTracking);
    }

    if (this.renderer && face) {
      this.renderer.updateFromFaceTracking(face);
    } else if (this.renderer) {
      this.renderer.setVisibility(false);
    }
  }

  private applyQuality(quality: QualityLevel): void {
    // Adjust Three.js renderer
    if (this.threeRenderer) {
      switch (quality) {
        case 'high':
          this.threeRenderer.setPixelRatio(
            Math.min(window.devicePixelRatio, 2),
          );
          break;
        case 'medium':
          this.threeRenderer.setPixelRatio(1);
          break;
        case 'low':
          this.threeRenderer.setPixelRatio(0.75);
          break;
        case '2d_fallback':
          this.threeRenderer.setPixelRatio(0.5);
          break;
      }
    }

    // Adjust tracker quality
    const trackerQuality =
      quality === '2d_fallback'
        ? ('low' as const)
        : (quality as 'high' | 'medium' | 'low');
    if (this.handTracker) this.handTracker.setQuality(trackerQuality);
    if (this.faceTracker) this.faceTracker.setQuality(trackerQuality);

    // Adjust renderer LOD
    if (this.renderer) {
      this.renderer.setLOD(quality === 'high' ? 'high' : quality === 'medium' ? 'medium' : 'low');
    }

    logger.info(`TryOnEngine quality changed to: ${quality}`);
  }
}
