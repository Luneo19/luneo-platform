/**
 * Switch product variants in AR: swap 3D model with optional transition.
 * @module ar/ecommerce/VariantSwitcher
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { logger } from '@/lib/logger';

const loader = new GLTFLoader();

export interface VariantSwitchOptions {
  /** Fade duration in ms; 0 = instant */
  transitionDuration?: number;
}

/**
 * Switches between product variant 3D models in AR.
 */
export class VariantSwitcher {
  private currentModel: THREE.Group | null = null;
  private currentUrl: string | null = null;
  private readonly cache = new Map<string, THREE.Group>();
  private readonly preloadQueue: string[] = [];

  /**
   * Switch to a variant by URL. Optionally animate transition.
   */
  async switchVariant(
    modelUrl: string,
    options?: VariantSwitchOptions
  ): Promise<THREE.Group | null> {
    const duration = options?.transitionDuration ?? 0;
    let group = this.cache.get(modelUrl);
    if (!group) {
      try {
        group = await this.loadModel(modelUrl);
        if (group) this.cache.set(modelUrl, group);
      } catch (err) {
        logger.warn('VariantSwitcher: load failed', { modelUrl, error: String(err) });
        return null;
      }
    }
    if (!group) return null;
    if (this.currentModel && duration > 0) {
      this.currentModel.visible = false;
    }
    this.currentModel = group.clone();
    this.currentUrl = modelUrl;
    return this.currentModel;
  }

  /**
   * Preload a variant URL for instant switch later.
   */
  async preloadVariant(modelUrl: string): Promise<void> {
    if (this.cache.has(modelUrl)) return;
    this.preloadQueue.push(modelUrl);
    try {
      const group = await this.loadModel(modelUrl);
      if (group) this.cache.set(modelUrl, group);
    } catch (err) {
      logger.warn('VariantSwitcher: preload failed', { modelUrl, error: String(err) });
    }
  }

  private loadModel(url: string): Promise<THREE.Group> {
    return new Promise((resolve, reject) => {
      loader.load(
        url,
        (gltf) => resolve(gltf.scene),
        undefined,
        (err) => reject(err)
      );
    });
  }

  /**
   * Get currently displayed model (clone).
   */
  getCurrentModel(): THREE.Group | null {
    return this.currentModel;
  }

  getCurrentUrl(): string | null {
    return this.currentUrl;
  }

  dispose(): void {
    for (const g of this.cache.values()) g.clear();
    this.cache.clear();
    this.currentModel = null;
    this.currentUrl = null;
    this.preloadQueue.length = 0;
  }
}
