/**
 * Environment reflections for AR (envMap from session/capture).
 * @module ar/rendering/ARReflectionProbe
 */

import * as THREE from 'three';
import { logger } from '@/lib/logger';

/**
 * Capture environment and apply as reflection to materials.
 * Uses WebXR session when available; otherwise can use a default env map or placeholder.
 */
export class ARReflectionProbe {
  private envMap: THREE.CubeTexture | THREE.Texture | null = null;
  private session: XRSession | null = null;

  /**
   * Capture environment from session/frame if the API supports it.
   * WebXR reflection API is not universally available; this is a placeholder for when it is.
   */
  capture(_session: XRSession, _frame: XRFrame): void {
    this.session = _session;
    // WebXR does not yet expose a standard "environment map" capture;
    // when it does (e.g. getEnvironmentImage?), we would create a THREE.CubeTexture here.
    if (!this.envMap) {
      logger.debug('ARReflectionProbe: no env capture API, using default');
    }
  }

  /**
   * Apply current env map to a material (sets envMap and envMapIntensity).
   */
  applyToMaterial(material: THREE.Material, intensity = 1): void {
    if (!this.envMap) return;
    if ('envMap' in material) {
      (material as THREE.MeshStandardMaterial).envMap = this.envMap;
      (material as THREE.MeshStandardMaterial).envMapIntensity = intensity;
      (material as THREE.MeshStandardMaterial).needsUpdate = true;
    }
  }

  /**
   * Set a pre-made environment map (e.g. from asset or external capture).
   */
  setEnvironmentMap(map: THREE.CubeTexture | THREE.Texture): void {
    this.envMap = map;
  }

  /**
   * Update per frame (e.g. re-capture or blend). No-op if no capture API.
   */
  update(): void {
    // Optional: blend or refresh env map each frame when API exists.
  }

  getEnvMap(): THREE.CubeTexture | THREE.Texture | null {
    return this.envMap;
  }

  dispose(): void {
    this.envMap = null;
    this.session = null;
  }
}
