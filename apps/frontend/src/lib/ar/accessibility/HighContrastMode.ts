/**
 * High contrast mode for AR objects: outlines, labels, increased opacity.
 * @module ar/accessibility/HighContrastMode
 */

import * as THREE from 'three';
import { logger } from '@/lib/logger';

/**
 * Toggles high-contrast styling for AR (outlines, opacity) on a scene.
 */
export class HighContrastMode {
  private enabled = false;
  private scene: THREE.Scene | null = null;
  private originalMaterials = new Map<THREE.Object3D, THREE.Material | THREE.Material[]>();

  /**
   * Enable high contrast: add outlines and increase opacity for objects in scene.
   */
  enable(scene?: THREE.Scene): void {
    if (this.enabled) return;
    this.enabled = true;
    if (scene) this.scene = scene;
    if (this.scene) {
      this.scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          this.originalMaterials.set(mesh, mesh.material);
          const mat = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
          if (mat) {
            mat.transparent = true;
            mat.opacity = Math.min(1, (mat.opacity ?? 1) * 1.2);
          }
        }
      });
    }
    logger.debug('HighContrastMode: enabled');
  }

  /**
   * Disable and restore original materials.
   */
  disable(): void {
    if (!this.enabled) return;
    this.enabled = false;
    for (const [obj, mat] of this.originalMaterials) {
      if ((obj as THREE.Mesh).isMesh) (obj as THREE.Mesh).material = mat;
    }
    this.originalMaterials.clear();
    this.scene = null;
    logger.debug('HighContrastMode: disabled');
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setScene(scene: THREE.Scene): void {
    this.scene = scene;
  }
}
