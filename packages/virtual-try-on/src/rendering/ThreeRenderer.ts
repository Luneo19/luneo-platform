/**
 * @luneo/virtual-try-on - Three.js Renderer professionnel
 * Rendu 3D overlay sur vidéo avec performance optimisée
 */

import * as THREE from 'three';
import type { RenderOptions } from '../core/types';
import type { Logger } from '../utils/Logger';

/**
 * Configuration du renderer
 */
export interface ThreeRendererConfig extends RenderOptions {
  /** Container pour le canvas */
  container: HTMLElement;
  
  /** Video element (background) */
  videoElement: HTMLVideoElement;
  
  /** Width */
  width: number;
  
  /** Height */
  height: number;
}

/**
 * Three.js Renderer professionnel
 * 
 * Features:
 * - Overlay transparent sur vidéo
 * - Performance optimisée (60 FPS)
 * - Lighting professionnel
 * - Post-processing ready
 * 
 * @example
 * ```typescript
 * const renderer = new ThreeRenderer({
 *   container: document.getElementById('container'),
 *   videoElement: videoElement,
 *   width: 1280,
 *   height: 720,
 *   antialias: true,
 *   shadows: true
 * }, logger);
 * 
 * renderer.init();
 * 
 * // Add 3D model
 * renderer.addToScene(glassesModel);
 * 
 * // Render loop
 * renderer.render();
 * ```
 */
export class ThreeRenderer {
  // Three.js objects
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private canvas: HTMLCanvasElement;
  
  // Configuration
  private config: Required<ThreeRendererConfig>;
  
  // État
  private isInitialized: boolean = false;
  private animationFrameId: number | null = null;
  
  // Lighting
  private ambientLight: THREE.AmbientLight;
  private directionalLight: THREE.DirectionalLight;
  private hemisphereLight: THREE.HemisphereLight;

  constructor(
    config: ThreeRendererConfig,
    private logger: Logger
  ) {
    this.config = {
      container: config.container,
      videoElement: config.videoElement,
      width: config.width,
      height: config.height,
      antialias: config.antialias !== false, // Default true
      shadows: config.shadows !== false, // Default true
      ambientLightIntensity: config.ambientLightIntensity || 0.5,
    };
    
    // Create scene
    this.scene = new THREE.Scene();
    
    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      45, // FOV
      this.config.width / this.config.height, // Aspect ratio
      0.1, // Near
      1000 // Far
    );
    this.camera.position.set(0, 0, 5);
    
    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.pointerEvents = 'none'; // Transparent to clicks
    
    // Create renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true, // Transparent background
      antialias: this.config.antialias,
      preserveDrawingBuffer: true, // For screenshots
      powerPreference: 'high-performance',
    });
    
    this.renderer.setSize(this.config.width, this.config.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Enable shadows if configured
    if (this.config.shadows) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    
    // Tone mapping for realistic rendering
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    
    // Output color space
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    // Setup lighting
    this.ambientLight = new THREE.AmbientLight(
      0xffffff, 
      this.config.ambientLightIntensity
    );
    this.scene.add(this.ambientLight);
    
    // Directional light (sun)
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    this.directionalLight.position.set(5, 5, 5);
    if (this.config.shadows) {
      this.directionalLight.castShadow = true;
      this.directionalLight.shadow.mapSize.width = 1024;
      this.directionalLight.shadow.mapSize.height = 1024;
    }
    this.scene.add(this.directionalLight);
    
    // Hemisphere light (ambient from sky/ground)
    this.hemisphereLight = new THREE.HemisphereLight(
      0xffffff, // Sky color
      0x444444, // Ground color
      0.6
    );
    this.scene.add(this.hemisphereLight);
    
    this.logger.debug('ThreeRenderer created', {
      width: this.config.width,
      height: this.config.height,
      antialias: this.config.antialias,
      shadows: this.config.shadows,
    });
  }

  /**
   * Initialise le renderer
   */
  init(): void {
    if (this.isInitialized) {
      this.logger.warn('ThreeRenderer already initialized');
      return;
    }
    
    // Append canvas to container
    this.config.container.appendChild(this.canvas);
    
    // Position video element
    const video = this.config.videoElement;
    video.style.position = 'absolute';
    video.style.top = '0';
    video.style.left = '0';
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.objectFit = 'cover';
    
    // Insert video before canvas (background)
    this.config.container.insertBefore(video, this.canvas);
    
    // Container setup
    this.config.container.style.position = 'relative';
    this.config.container.style.overflow = 'hidden';
    
    this.isInitialized = true;
    this.logger.info('✅ ThreeRenderer initialized');
  }

  /**
   * Render une frame
   */
  render(): void {
    if (!this.isInitialized) {
      this.logger.warn('Cannot render: ThreeRenderer not initialized');
      return;
    }
    
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Démarre le render loop
   */
  startRenderLoop(callback?: () => void): void {
    if (this.animationFrameId !== null) {
      this.logger.warn('Render loop already running');
      return;
    }
    
    const animate = () => {
      if (callback) {
        callback();
      }
      
      this.render();
      this.animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
    this.logger.info('✅ Render loop started');
  }

  /**
   * Arrête le render loop
   */
  stopRenderLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
      this.logger.info('Render loop stopped');
    }
  }

  /**
   * Ajoute un objet à la scène
   */
  addToScene(object: THREE.Object3D): void {
    this.scene.add(object);
    this.logger.debug('Object added to scene', { name: object.name });
  }

  /**
   * Retire un objet de la scène
   */
  removeFromScene(object: THREE.Object3D): void {
    this.scene.remove(object);
    this.logger.debug('Object removed from scene', { name: object.name });
  }

  /**
   * Obtient la scène
   */
  getScene(): THREE.Scene {
    return this.scene;
  }

  /**
   * Obtient la caméra
   */
  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  /**
   * Obtient le renderer
   */
  getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  /**
   * Redimensionne le renderer
   */
  resize(width: number, height: number): void {
    this.config.width = width;
    this.config.height = height;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    this.renderer.setSize(width, height);
    
    this.logger.debug('Renderer resized', { width, height });
  }

  /**
   * Prend un screenshot
   */
  screenshot(format: 'png' | 'jpeg' = 'png', quality: number = 1.0): string {
    return this.canvas.toDataURL(`image/${format}`, quality);
  }

  /**
   * Change l'intensité de la lumière ambiante
   */
  setAmbientLightIntensity(intensity: number): void {
    this.ambientLight.intensity = intensity;
    this.logger.debug('Ambient light intensity changed', { intensity });
  }

  /**
   * Change l'intensité de la lumière directionnelle
   */
  setDirectionalLightIntensity(intensity: number): void {
    this.directionalLight.intensity = intensity;
    this.logger.debug('Directional light intensity changed', { intensity });
  }

  /**
   * Nettoie les ressources
   */
  dispose(): void {
    this.stopRenderLoop();
    
    // Dispose scene objects
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
    
    // Dispose renderer
    this.renderer.dispose();
    
    // Remove canvas
    if (this.canvas.parentElement) {
      this.canvas.parentElement.removeChild(this.canvas);
    }
    
    this.isInitialized = false;
    this.logger.info('ThreeRenderer disposed');
  }
}

