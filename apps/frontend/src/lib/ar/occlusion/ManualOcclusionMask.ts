/**
 * Manual configurable occlusion mask (universal fallback).
 * Define occlusion area manually via geometry; no XR depth/planes required.
 * @module ar/occlusion/ManualOcclusionMask
 */

import * as THREE from 'three';
import { logger } from '@/lib/logger';

/**
 * Manual occlusion mask: user-defined geometry that occludes virtual content.
 */
export class ManualOcclusionMask {
  private maskMesh: THREE.Mesh | null = null;
  private scene: THREE.Scene | null = null;

  /**
   * Set the occlusion mask from a Three.js geometry.
   * Objects behind this mesh (in depth) will be occluded when depth write is used.
   * @param geometry - Geometry defining the occlusion area (e.g. plane, box)
   */
  setMask(geometry: THREE.BufferGeometry): void {
    this.maskMesh?.geometry?.dispose();
    const mat = new THREE.MeshBasicMaterial({
      colorWrite: false,
      depthWrite: true,
      visible: false,
    });
    this.maskMesh = new THREE.Mesh(geometry, mat);
    this.maskMesh.name = 'ManualOcclusionMask';
    this.maskMesh.renderOrder = -1;
    if (this.scene && !this.scene.getObjectByName('ManualOcclusionMask')) {
      this.scene.add(this.maskMesh);
    }
    logger.debug('ManualOcclusionMask: mask set', { vertices: geometry.attributes.position?.count });
  }

  /**
   * Attach the mask to a scene so it participates in rendering.
   */
  attachToScene(scene: THREE.Scene): void {
    if (this.scene) this.scene.remove(this.maskMesh!);
    this.scene = scene;
    if (this.maskMesh) scene.add(this.maskMesh);
  }

  /**
   * Update mask (e.g. sync position/rotation from external controller).
   * No-op if no custom update logic; override or call from game loop if needed.
   */
  update(): void {
    // Optional: animate or update mask transform
  }

  /**
   * Get the mask mesh for direct transform control.
   */
  getMesh(): THREE.Mesh | null {
    return this.maskMesh;
  }

  /**
   * Remove the mask from scene and dispose resources.
   */
  clear(): void {
    if (this.maskMesh && this.scene) this.scene.remove(this.maskMesh);
    this.maskMesh?.geometry?.dispose();
    (this.maskMesh?.material as THREE.Material)?.dispose();
    this.maskMesh = null;
    this.scene = null;
    logger.debug('ManualOcclusionMask: cleared');
  }

  dispose(): void {
    this.clear();
  }
}
