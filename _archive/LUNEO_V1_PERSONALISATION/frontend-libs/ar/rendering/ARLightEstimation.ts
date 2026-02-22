/**
 * WebXR light estimation for AR.
 * Reads XRLightEstimate and exposes intensity, direction, spherical harmonics.
 * @module ar/rendering/ARLightEstimation
 */

import * as THREE from 'three';
import { logger } from '@/lib/logger';

/** Light estimate state */
export interface ARLightState {
  ambientIntensity: number;
  lightDirection: THREE.Vector3;
  lightIntensity: number;
  sphericalHarmonics: Float32Array | null;
}

/**
 * WebXR light estimation: request light probe and update from XRFrame.
 */
export class ARLightEstimation {
  private xrLightProbe: XRLightProbe | null = null;
  private lightProbe: THREE.LightProbe | null = null;
  private directionalLight: THREE.DirectionalLight | null = null;
  private ambientIntensity = 0;
  private lightDirection = new THREE.Vector3(0, 1, 0);
  private lightIntensity = 0;
  private sphericalHarmonics: Float32Array | null = null;
  private initialized = false;

  /**
   * Request light-estimation: get XRLightProbe from session.
   * Ensure 'light-estimation' is in session optionalFeatures when requesting the session.
   */
  async initialize(session: XRSession): Promise<boolean> {
    if (this.initialized) return true;

    if (typeof session.requestLightProbe !== 'function') {
      logger.warn('ARLightEstimation: requestLightProbe not available');
      return false;
    }

    try {
      this.xrLightProbe = await session.requestLightProbe?.();
    } catch (err) {
      logger.warn('ARLightEstimation: requestLightProbe failed', { error: String(err) });
      return false;
    }

    this.lightProbe = new THREE.LightProbe();
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    this.initialized = true;
    return true;
  }

  /**
   * Update from XR frame. Call each frame.
   */
  update(frame: XRFrame): void {
    if (!this.initialized || !this.xrLightProbe || !frame.getLightEstimate) return;

    const lightEstimate = frame.getLightEstimate(this.xrLightProbe);
    if (!lightEstimate) return;

    this.ambientIntensity = lightEstimate.primaryLightIntensity?.x ?? 0;
    this.lightIntensity = this.ambientIntensity;
    if (lightEstimate.primaryLightDirection) {
      this.lightDirection.set(
        lightEstimate.primaryLightDirection.x,
        lightEstimate.primaryLightDirection.y,
        lightEstimate.primaryLightDirection.z
      );
    }
    if (lightEstimate.sphericalHarmonicsCoefficients) {
      this.sphericalHarmonics = lightEstimate.sphericalHarmonicsCoefficients;
    }
  }

  /** Current ambient intensity (from primary light) */
  getAmbientIntensity(): number {
    return this.ambientIntensity;
  }

  /** Primary light direction in viewer space */
  getLightDirection(): THREE.Vector3 {
    return this.lightDirection.clone();
  }

  /** Spherical harmonics coefficients if available */
  getSphericalHarmonics(): Float32Array | null {
    return this.sphericalHarmonics;
  }

  /** Full state snapshot */
  getState(): ARLightState {
    return {
      ambientIntensity: this.ambientIntensity,
      lightDirection: this.lightDirection.clone(),
      lightIntensity: this.lightIntensity,
      sphericalHarmonics: this.sphericalHarmonics,
    };
  }

  /**
   * Apply estimated lighting to a Three.js scene.
   * Adds/updates LightProbe and optional DirectionalLight.
   */
  applyToScene(scene: THREE.Scene): void {
    if (this.lightProbe) {
      if (this.sphericalHarmonics && this.sphericalHarmonics.length >= 9) {
        const sh = new THREE.SphericalHarmonics3();
        const coef = this.sphericalHarmonics;
        sh.set([
          new THREE.Vector3(coef[0], coef[1], coef[2]),
          new THREE.Vector3(coef[3], coef[4], coef[5]),
          new THREE.Vector3(coef[6], coef[7], coef[8]),
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(0, 0, 0)
        ]);
        this.lightProbe.sh.copy(sh);
        this.lightProbe.intensity = Math.min(1, this.ambientIntensity);
      }
      if (!scene.children.includes(this.lightProbe)) {
        scene.add(this.lightProbe);
      }
    }
    if (this.directionalLight) {
      this.directionalLight.position.copy(this.lightDirection);
      this.directionalLight.intensity = Math.min(2, this.lightIntensity);
      if (!scene.children.includes(this.directionalLight)) {
        scene.add(this.directionalLight);
      }
    }
  }

  dispose(): void {
    this.xrLightProbe = null;
    this.lightProbe = null;
    this.directionalLight = null;
    this.sphericalHarmonics = null;
    this.initialized = false;
  }
}
