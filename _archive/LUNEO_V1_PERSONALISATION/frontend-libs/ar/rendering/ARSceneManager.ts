/**
 * Three.js scene manager for AR.
 * Sets up scene, camera, renderer and syncs with XR frame loop.
 * @module ar/rendering/ARSceneManager
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { logger } from '@/lib/logger';

export interface ARSceneManagerConfig {
  session: XRSession;
  gl: WebGLRenderingContext | WebGL2RenderingContext;
  canvas: HTMLCanvasElement;
  /** Clear color */
  clearColor?: THREE.ColorRepresentation;
}

const loader = new GLTFLoader();

/**
 * Manages Three.js scene for WebXR AR: scene, camera, renderer, models.
 */
export class ARSceneManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private session: XRSession;
  private referenceSpace: XRReferenceSpace | null = null;
  private readonly models: Map<string, THREE.Group> = new Map();
  private gl: WebGLRenderingContext | WebGL2RenderingContext;

  constructor(config: ARSceneManagerConfig) {
    this.session = config.session;
    this.gl = config.gl;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(70, 1, 0.01, 100);
    this.renderer = new THREE.WebGLRenderer({
      canvas: config.canvas,
      context: config.gl,
      antialias: true,
      alpha: true,
    });
    this.renderer.xr.enabled = true;
    this.renderer.xr.setSession(config.session);
    this.renderer.setClearColor(
      config.clearColor ?? 0x000000,
      config.clearColor != null ? 1 : 0
    );
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;
  }

  /** Initialize async part (reference space). Prefer this over `new ARSceneManager()`. */
  static async create(config: ARSceneManagerConfig): Promise<ARSceneManager> {
    const manager = new ARSceneManager(config);
    try {
      manager.referenceSpace = await manager.session.requestReferenceSpace('local-floor');
    } catch (err) {
      logger.warn('ARSceneManager: local-floor failed, using viewer', { error: String(err) });
      manager.referenceSpace = await manager.session.requestReferenceSpace('viewer');
    }
    return manager;
  }

  /**
   * Load and add glTF model to scene.
   * @returns Model id for removal
   */
  async addModel(gltfUrl: string, id?: string): Promise<string> {
    const modelId = id ?? `model-${Date.now()}`;
    return new Promise((resolve, reject) => {
      loader.load(
        gltfUrl,
        (gltf) => {
          const root = gltf.scene;
          this.scene.add(root);
          this.models.set(modelId, root);
          resolve(modelId);
        },
        undefined,
        (err) => reject(err)
      );
    });
  }

  /**
   * Remove model by id.
   */
  removeModel(id: string): boolean {
    const model = this.models.get(id);
    if (!model) return false;
    this.scene.remove(model);
    this.models.delete(id);
    return true;
  }

  /**
   * Get model by id.
   */
  getModel(id: string): THREE.Group | undefined {
    return this.models.get(id);
  }

  /**
   * Call from XR frame loop to render.
   * Uses the renderer's XR camera (updated by Three.js from the frame).
   */
  onXRFrame(_time: number, frame: XRFrame): void {
    if (!this.referenceSpace) return;

    const xrCamera = this.renderer.xr.getCamera() as THREE.PerspectiveCamera;
    if (xrCamera) {
      this.renderer.render(this.scene, xrCamera);
    }
  }

  getScene(): THREE.Scene {
    return this.scene;
  }

  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  getReferenceSpace(): XRReferenceSpace | null {
    return this.referenceSpace;
  }

  dispose(): void {
    this.models.forEach((m) => this.scene.remove(m));
    this.models.clear();
    this.renderer.dispose();
  }
}
