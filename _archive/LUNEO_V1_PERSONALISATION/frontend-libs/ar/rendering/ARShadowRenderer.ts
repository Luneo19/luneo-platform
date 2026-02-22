/**
 * Real-time AR shadows from light estimation.
 * Shadow-casting directional light and optional ground plane.
 * @module ar/rendering/ARShadowRenderer
 */

import * as THREE from 'three';
import { logger } from '@/lib/logger';

export type ShadowQuality = 'low' | 'medium' | 'high';

const SHADOW_MAP_SIZES: Record<ShadowQuality, number> = {
  low: 512,
  medium: 1024,
  high: 2048,
};

/**
 * Renders real-time shadows in AR using a directional light and optional ground plane.
 */
export class ARShadowRenderer {
  private light: THREE.DirectionalLight | null = null;
  private groundPlane: THREE.Mesh | null = null;
  private quality: ShadowQuality = 'medium';
  private scene: THREE.Scene | null = null;

  /**
   * Initialize shadow renderer: create directional light and add to scene.
   */
  initialize(scene: THREE.Scene): void {
    this.scene = scene;
    this.light = new THREE.DirectionalLight(0xffffff, 1);
    this.light.castShadow = true;
    this.light.position.set(0, 5, 0);
    this.light.target.position.set(0, 0, 0);
    this.updateShadowQuality(this.quality);
    scene.add(this.light);
    scene.add(this.light.target);
    logger.debug('ARShadowRenderer: initialized');
  }

  /**
   * Update light direction and intensity from light estimate (e.g. each frame).
   */
  update(lightDirection: THREE.Vector3, intensity: number): void {
    if (!this.light) return;
    this.light.position.copy(lightDirection).multiplyScalar(5);
    this.light.intensity = Math.min(2, Math.max(0.1, intensity));
    this.light.target.position.set(0, 0, 0);
  }

  /**
   * Create an invisible ground plane that receives shadows.
   */
  createGroundPlane(size = 10): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(size, size);
    const material = new THREE.ShadowMaterial({ opacity: 0.3 });
    material.transparent = true;
    const plane = new THREE.Mesh(geometry, material);
    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true;
    this.groundPlane = plane;
    if (this.scene) this.scene.add(plane);
    return plane;
  }

  /**
   * Set shadow map resolution.
   */
  setShadowQuality(quality: ShadowQuality): void {
    this.quality = quality;
    this.updateShadowQuality(quality);
  }

  private updateShadowQuality(quality: ShadowQuality): void {
    if (!this.light) return;
    const size = SHADOW_MAP_SIZES[quality];
    this.light.shadow.mapSize.width = size;
    this.light.shadow.mapSize.height = size;
    this.light.shadow.bias = -0.0001;
    this.light.shadow.normalBias = 0.02;
    this.light.shadow.camera.near = 0.5;
    this.light.shadow.camera.far = 50;
    this.light.shadow.camera.left = -10;
    this.light.shadow.camera.right = 10;
    this.light.shadow.camera.top = 10;
    this.light.shadow.camera.bottom = -10;
  }

  /**
   * Enable shadow casting on the renderer (call once when setting up WebGL).
   */
  static enableShadowMap(renderer: THREE.WebGLRenderer): void {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  getLight(): THREE.DirectionalLight | null {
    return this.light;
  }

  getGroundPlane(): THREE.Mesh | null {
    return this.groundPlane;
  }

  dispose(): void {
    if (this.groundPlane && this.scene) this.scene.remove(this.groundPlane);
    if (this.light && this.scene) {
      this.scene.remove(this.light);
      this.scene.remove(this.light.target);
    }
    this.groundPlane = null;
    this.light = null;
    this.scene = null;
  }
}
