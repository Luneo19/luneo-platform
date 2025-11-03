/**
 * @luneo/virtual-try-on - Model Loader professionnel
 * Chargement de modèles 3D (GLB/GLTF) avec cache
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import type { Logger } from '../utils/Logger';

/**
 * Options de chargement
 */
export interface LoadOptions {
  /** Scale du modèle */
  scale?: number | THREE.Vector3;
  
  /** Position du modèle */
  position?: THREE.Vector3;
  
  /** Rotation du modèle (Euler angles) */
  rotation?: THREE.Euler;
  
  /** Activer Draco compression */
  useDraco?: boolean;
  
  /** URL du Draco decoder */
  dracoPath?: string;
}

/**
 * Model Loader professionnel
 * 
 * Features:
 * - GLB/GLTF loading
 * - Draco compression support
 * - Model caching
 * - Progress tracking
 * - Error recovery
 * 
 * @example
 * ```typescript
 * const loader = new ModelLoader(logger);
 * 
 * const model = await loader.load('/models/glasses.glb', {
 *   scale: 0.1,
 *   position: new THREE.Vector3(0, 0, 0),
 *   useDraco: true
 * });
 * 
 * scene.add(model);
 * ```
 */
export class ModelLoader {
  private gltfLoader: GLTFLoader;
  private dracoLoader: DRACOLoader | null = null;
  private cache: Map<string, THREE.Group> = new Map();
  private loadingPromises: Map<string, Promise<THREE.Group>> = new Map();

  constructor(private logger: Logger) {
    this.gltfLoader = new GLTFLoader();
    this.logger.debug('ModelLoader created');
  }

  /**
   * Charge un modèle 3D
   */
  async load(
    url: string,
    options: LoadOptions = {}
  ): Promise<THREE.Group> {
    // Check cache
    if (this.cache.has(url)) {
      this.logger.debug('Model loaded from cache', { url });
      return this.cache.get(url)!.clone();
    }
    
    // Check if already loading
    if (this.loadingPromises.has(url)) {
      this.logger.debug('Model already loading, waiting...', { url });
      return this.loadingPromises.get(url)!;
    }
    
    // Start loading
    const loadPromise = this.loadModel(url, options);
    this.loadingPromises.set(url, loadPromise);
    
    try {
      const model = await loadPromise;
      
      // Cache model
      this.cache.set(url, model);
      this.logger.info('✅ Model loaded and cached', { url });
      
      return model.clone();
      
    } finally {
      this.loadingPromises.delete(url);
    }
  }

  /**
   * Charge un modèle (interne)
   */
  private async loadModel(
    url: string,
    options: LoadOptions
  ): Promise<THREE.Group> {
    this.logger.info('Loading model...', { url });
    
    // Setup Draco if requested
    if (options.useDraco && !this.dracoLoader) {
      this.setupDraco(options.dracoPath);
    }
    
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        url,
        
        // onLoad
        (gltf) => {
          const model = gltf.scene;
          
          // Apply transforms
          if (options.scale !== undefined) {
            if (typeof options.scale === 'number') {
              model.scale.setScalar(options.scale);
            } else {
              model.scale.copy(options.scale);
            }
          }
          
          if (options.position) {
            model.position.copy(options.position);
          }
          
          if (options.rotation) {
            model.rotation.copy(options.rotation);
          }
          
          // Enable shadows on all meshes
          model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          
          resolve(model);
        },
        
        // onProgress
        (progress) => {
          if (progress.lengthComputable) {
            const percentComplete = (progress.loaded / progress.total) * 100;
            this.logger.debug(`Loading progress: ${percentComplete.toFixed(1)}%`, { url });
          }
        },
        
        // onError
        (error) => {
          this.logger.error('Model loading failed', { url, error });
          reject(new Error(`Failed to load model: ${error.message || error}`));
        }
      );
    });
  }

  /**
   * Setup Draco loader
   */
  private setupDraco(dracoPath?: string): void {
    this.dracoLoader = new DRACOLoader();
    
    const path = dracoPath || 'https://www.gstatic.com/draco/versioned/decoders/1.5.6/';
    this.dracoLoader.setDecoderPath(path);
    
    this.gltfLoader.setDRACOLoader(this.dracoLoader);
    
    this.logger.debug('Draco loader configured', { path });
  }

  /**
   * Précharge plusieurs modèles
   */
  async preload(urls: string[], options: LoadOptions = {}): Promise<void> {
    this.logger.info(`Preloading ${urls.length} models...`);
    
    const promises = urls.map(url => this.load(url, options));
    await Promise.all(promises);
    
    this.logger.info('✅ All models preloaded');
  }

  /**
   * Vide le cache
   */
  clearCache(): void {
    this.cache.forEach((model) => {
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => mat.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    });
    
    this.cache.clear();
    this.logger.info('Model cache cleared');
  }

  /**
   * Obtient les modèles en cache
   */
  getCachedModels(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Nettoie les ressources
   */
  dispose(): void {
    this.clearCache();
    
    if (this.dracoLoader) {
      this.dracoLoader.dispose();
    }
    
    this.logger.info('ModelLoader disposed');
  }
}

