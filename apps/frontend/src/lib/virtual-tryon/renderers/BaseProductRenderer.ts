import * as THREE from 'three';
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import type { HandLandmarks } from '../HandTracker';
import type { FaceLandmarks } from '../FaceTracker';
import { logger } from '@/lib/logger';

export type LODLevel = 'high' | 'medium' | 'low';

export interface RendererConfig {
  modelUrl?: string;
  lodLevels?: { high?: string; medium?: string; low?: string };
  scaleFactor?: number;
  defaultPosition?: { x: number; y: number; z: number };
  defaultRotation?: { x: number; y: number; z: number };
  enableOcclusion?: boolean;
  enableShadows?: boolean;
}

/**
 * Base class for all product 3D renderers.
 * Handles common functionality: model loading (glTF), scene management, LOD.
 */
export abstract class BaseProductRenderer {
  protected model: THREE.Group | null = null;
  protected scene: THREE.Scene | null = null;
  protected config: RendererConfig;
  protected isVisible = false;
  protected currentLOD: LODLevel = 'high';
  protected lodModels: Map<LODLevel, THREE.Group> = new Map();

  // Loader (shared)
  private static gltfLoader: GLTFLoader | null = null;
  private static dracoLoader: DRACOLoader | null = null;

  constructor(config: RendererConfig) {
    this.config = config;
  }

  /**
   * Get or create the shared GLTF loader (with Draco support).
   */
  protected static getLoader(): GLTFLoader {
    if (!BaseProductRenderer.gltfLoader) {
      BaseProductRenderer.dracoLoader = new DRACOLoader();
      BaseProductRenderer.dracoLoader.setDecoderPath(
        'https://www.gstatic.com/draco/versioned/decoders/1.5.6/',
      );

      BaseProductRenderer.gltfLoader = new GLTFLoader();
      BaseProductRenderer.gltfLoader.setDRACOLoader(
        BaseProductRenderer.dracoLoader,
      );
    }
    return BaseProductRenderer.gltfLoader;
  }

  /**
   * Attach this renderer's model to a Three.js scene.
   */
  attachToScene(scene: THREE.Scene): void {
    this.scene = scene;
    if (this.model) {
      scene.add(this.model);
    }
  }

  /**
   * Load a glTF/GLB model from URL.
   */
  async loadModel(url?: string): Promise<THREE.Group> {
    const modelUrl = url || this.config.modelUrl;
    if (!modelUrl) {
      throw new Error('No model URL provided');
    }

    const loader = BaseProductRenderer.getLoader();

    return new Promise<THREE.Group>((resolve, reject) => {
      loader.load(
        modelUrl,
        (gltf: GLTF) => {
          const group = gltf.scene;

          // Apply default transforms
          if (this.config.scaleFactor) {
            const s = this.config.scaleFactor;
            group.scale.set(s, s, s);
          }

          if (this.config.defaultPosition) {
            const p = this.config.defaultPosition;
            group.position.set(p.x, p.y, p.z);
          }

          if (this.config.defaultRotation) {
            const r = this.config.defaultRotation;
            group.rotation.set(
              THREE.MathUtils.degToRad(r.x),
              THREE.MathUtils.degToRad(r.y),
              THREE.MathUtils.degToRad(r.z),
            );
          }

          // Enable shadows on meshes
          if (this.config.enableShadows) {
            group.traverse((child) => {
              if ((child as THREE.Mesh).isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
              }
            });
          }

          // Initially hidden
          group.visible = false;

          this.model = group;
          if (this.scene) {
            this.scene.add(group);
          }

          logger.info('3D model loaded', { url: modelUrl });
          resolve(group);
        },
        undefined,
        (error: unknown) => {
          logger.error('Failed to load 3D model', {
            url: modelUrl,
            error: error instanceof Error ? error.message : 'Unknown',
          });
          reject(error);
        },
      );
    });
  }

  /**
   * Preload LOD variants of the model.
   */
  async preloadLOD(): Promise<void> {
    if (!this.config.lodLevels) return;

    const levels: LODLevel[] = ['high', 'medium', 'low'];
    for (const level of levels) {
      const url = this.config.lodLevels[level];
      if (url) {
        try {
          const model = await this.loadModelFromUrl(url);
          model.visible = false;
          this.lodModels.set(level, model);
          if (this.scene) {
            this.scene.add(model);
          }
        } catch (err) {
          logger.warn(`Failed to preload LOD ${level}`, { error: err });
        }
      }
    }
  }

  /**
   * Switch to a different LOD level.
   */
  setLOD(level: LODLevel): void {
    if (level === this.currentLOD) return;
    this.currentLOD = level;

    // Hide all LOD models
    this.lodModels.forEach((model) => {
      model.visible = false;
    });

    // Show the target LOD
    const targetModel = this.lodModels.get(level);
    if (targetModel) {
      targetModel.visible = this.isVisible;
      this.model = targetModel;
    } else if (this.model) {
      // Fallback to primary model
      this.model.visible = this.isVisible;
    }
  }

  /**
   * Update the model position/rotation from hand tracking data.
   * Override in subclasses for specific behavior.
   */
  abstract updateFromHandTracking(hands: HandLandmarks[]): void;

  /**
   * Update the model position/rotation from face tracking data.
   * Override in subclasses for specific behavior.
   */
  abstract updateFromFaceTracking(face: FaceLandmarks): void;

  /**
   * Show or hide the model.
   */
  setVisibility(visible: boolean): void {
    this.isVisible = visible;
    if (this.model) {
      this.model.visible = visible;
    }
  }

  /**
   * Set model scale.
   */
  setScale(scale: number): void {
    if (this.model) {
      this.model.scale.set(scale, scale, scale);
    }
  }

  /**
   * Clean up resources.
   */
  dispose(): void {
    if (this.model && this.scene) {
      this.scene.remove(this.model);
    }

    this.lodModels.forEach((model) => {
      if (this.scene) {
        this.scene.remove(model);
      }
      this.disposeModel(model);
    });

    if (this.model) {
      this.disposeModel(this.model);
    }

    this.model = null;
    this.scene = null;
    this.lodModels.clear();
  }

  // ========================================
  // Helpers
  // ========================================

  /**
   * Convert normalized MediaPipe coordinates (0-1) to Three.js world coordinates.
   */
  protected normalizedToWorld(
    x: number,
    y: number,
    z: number,
    canvasWidth = 1280,
    canvasHeight = 720,
  ): THREE.Vector3 {
    // Map from normalized [0,1] to centered coordinates
    const worldX = (x - 0.5) * 10; // Scale to Three.js units
    const worldY = -(y - 0.5) * 10; // Y is inverted
    const worldZ = -z * 5; // Depth

    return new THREE.Vector3(worldX, worldY, worldZ);
  }

  /**
   * Smoothly interpolate position to avoid jitter.
   */
  protected lerpPosition(
    current: THREE.Vector3,
    target: THREE.Vector3,
    factor = 0.3,
  ): THREE.Vector3 {
    return current.lerp(target, factor);
  }

  /**
   * Smoothly interpolate rotation to avoid jitter.
   */
  protected lerpRotation(
    current: THREE.Euler,
    target: THREE.Euler,
    factor = 0.3,
  ): THREE.Euler {
    return new THREE.Euler(
      current.x + (target.x - current.x) * factor,
      current.y + (target.y - current.y) * factor,
      current.z + (target.z - current.z) * factor,
    );
  }

  private async loadModelFromUrl(url: string): Promise<THREE.Group> {
    const loader = BaseProductRenderer.getLoader();
    return new Promise<THREE.Group>((resolve, reject) => {
      loader.load(
        url,
        (gltf: GLTF) => resolve(gltf.scene),
        undefined,
        reject,
      );
    });
  }

  private disposeModel(model: THREE.Group): void {
    model.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.geometry?.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else if (mesh.material) {
          mesh.material.dispose();
        }
      }
    });
  }
}
