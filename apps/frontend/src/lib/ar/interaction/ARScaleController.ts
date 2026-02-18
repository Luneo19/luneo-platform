/**
 * Scale control: set scale, pinch-to-scale, snap to real size.
 * @module ar/interaction/ARScaleController
 */

import * as THREE from 'three';
import { logger } from '@/lib/logger';

const DEFAULT_MIN = 0.01;
const DEFAULT_MAX = 10;

/**
 * Controls scale of AR objects with limits and optional pinch/real-world size.
 */
export class ARScaleController {
  private minScale = DEFAULT_MIN;
  private maxScale = DEFAULT_MAX;
  private pinchScaleObject: THREE.Object3D | null = null;
  private lastPinchScale = 1;

  /**
   * Set scale of an object with optional min/max clamp.
   */
  setScale(
    object: THREE.Object3D,
    scale: number,
    options?: { min?: number; max?: number }
  ): void {
    const min = options?.min ?? this.minScale;
    const max = options?.max ?? this.maxScale;
    const s = Math.max(min, Math.min(max, scale));
    object.scale.setScalar(s);
  }

  /**
   * Set global min/max scale limits.
   */
  setLimits(min: number, max: number): void {
    this.minScale = min;
    this.maxScale = max;
  }

  /**
   * Enable pinch-to-scale for the given object (call from ARGestureHandler onPinch).
   */
  enablePinchScale(object: THREE.Object3D): void {
    this.pinchScaleObject = object;
    this.lastPinchScale = object.scale.x;
  }

  /**
   * Apply pinch delta (scale factor). Call from gesture handler.
   */
  applyPinchScale(scaleFactor: number): void {
    if (!this.pinchScaleObject) return;
    const next = this.lastPinchScale * scaleFactor;
    const s = Math.max(this.minScale, Math.min(this.maxScale, next));
    this.pinchScaleObject.scale.setScalar(s);
    this.lastPinchScale = s;
  }

  /**
   * Commit current scale as new baseline for next pinch (e.g. on touch end).
   */
  commitPinchScale(): void {
    if (this.pinchScaleObject) this.lastPinchScale = this.pinchScaleObject.scale.x;
  }

  /**
   * Scale object so its bounding box matches the given real-world size (in meters).
   */
  snapToRealSize(object: THREE.Object3D, realWorldSize: number): void {
    const box = new THREE.Box3().setFromObject(object);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const s = realWorldSize / maxDim;
    this.setScale(object, s);
    logger.debug('ARScaleController: snapToRealSize', { realWorldSize, scale: s });
  }

  disablePinchScale(): void {
    this.pinchScaleObject = null;
  }

  dispose(): void {
    this.pinchScaleObject = null;
  }
}
