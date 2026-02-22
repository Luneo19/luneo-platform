/**
 * Object placement: start placement, confirm, cancel, reticle.
 * @module ar/interaction/ARPlacementController
 */

import * as THREE from 'three';
import { logger } from '@/lib/logger';

export type HitResult = { pose: XRPose; position: THREE.Vector3; normal?: THREE.Vector3 };

/**
 * Controls placement of a 3D model in AR with reticle and confirm/cancel.
 */
export class ARPlacementController {
  private placementObject: THREE.Object3D | null = null;
  private scene: THREE.Scene | null = null;
  private reticle: THREE.Mesh | null = null;
  private isPlacing = false;
  private referenceSpace: XRReferenceSpace | null = null;

  /**
   * Start placement mode: show object following hit results until confirmed.
   * @param model - Object to place (will be added to scene on confirm)
   * @param scene - Three.js scene
   */
  startPlacement(model: THREE.Object3D, scene: THREE.Scene): void {
    this.cancelPlacement();
    this.placementObject = model;
    this.scene = scene;
    this.isPlacing = true;
    this.createReticle();
    if (this.scene && this.reticle) this.scene.add(this.reticle);
    logger.debug('ARPlacementController: startPlacement');
  }

  private createReticle(): void {
    if (this.reticle) return;
    const geom = new THREE.RingGeometry(0.08, 0.12, 32);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      side: THREE.DoubleSide,
    });
    this.reticle = new THREE.Mesh(geom, mat);
    this.reticle.visible = false;
    this.reticle.name = 'ARPlacementReticle';
  }

  /**
   * Update reticle (and placement object) position from hit result.
   */
  showReticle(hitResult: HitResult): void {
    if (!this.reticle) return;
    const pos = hitResult.position;
    this.reticle.position.copy(pos);
    if (hitResult.normal) {
      this.reticle.lookAt(pos.clone().add(hitResult.normal));
    }
    this.reticle.visible = true;
    if (this.placementObject) {
      this.placementObject.position.copy(pos);
      if (hitResult.normal) this.placementObject.lookAt(pos.clone().add(hitResult.normal));
    }
  }

  /**
   * Lock object at current position and exit placement mode.
   */
  confirmPlacement(): THREE.Object3D | null {
    if (!this.isPlacing || !this.placementObject || !this.scene) return null;
    this.scene.add(this.placementObject);
    const obj = this.placementObject;
    this.placementObject = null;
    this.isPlacing = false;
    this.hideReticle();
    logger.debug('ARPlacementController: confirmPlacement');
    return obj;
  }

  /**
   * Cancel placement and remove temporary object/reticle.
   */
  cancelPlacement(): void {
    this.isPlacing = false;
    this.placementObject = null;
    this.hideReticle();
    if (this.reticle && this.scene) this.scene.remove(this.reticle);
    logger.debug('ARPlacementController: cancelPlacement');
  }

  private hideReticle(): void {
    if (this.reticle) this.reticle.visible = false;
  }

  /**
   * Set reference space for pose conversion (optional).
   */
  setReferenceSpace(space: XRReferenceSpace): void {
    this.referenceSpace = space;
  }

  isPlacementActive(): boolean {
    return this.isPlacing;
  }

  dispose(): void {
    this.cancelPlacement();
    this.reticle?.geometry?.dispose();
    (this.reticle?.material as THREE.Material)?.dispose();
    this.reticle = null;
    this.scene = null;
    this.referenceSpace = null;
  }
}
