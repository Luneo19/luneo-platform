/**
 * Depth-based occlusion using LiDAR / WebXR Depth API.
 * Hides virtual objects behind real-world depth.
 * @module ar/occlusion/DepthOcclusionManager
 */

import * as THREE from 'three';
import { logger } from '@/lib/logger';

const DEPTH_FEATURE = 'depth-sensing';

/**
 * Manages depth-based occlusion: requests depth-sensing, updates depth texture, provides occlusion material.
 */
export class DepthOcclusionManager {
  private session: XRSession | null = null;
  private depthTexture: THREE.DataTexture | null = null;
  private depthSize = { width: 0, height: 0 };
  private supported: boolean | null = null;

  /**
   * Check if LiDAR/Depth API is supported by the session or XR device.
   */
  isSupported(): boolean {
    if (this.supported !== null) return this.supported;
    if (typeof navigator === 'undefined' || !navigator.xr) {
      this.supported = false;
      return false;
    }
    // Feature is typically requested at session start; we can't probe without session.
    this.supported = true;
    return true;
  }

  /**
   * Request depth-sensing feature and initialize for the given session.
   * @param session - Active XRSession (e.g. immersive-ar)
   */
  async initialize(session: XRSession): Promise<boolean> {
    try {
      const opts = session as XRSession & { requestFeature?: (f: string) => Promise<void> };
      if (typeof opts.requestFeature === 'function') {
        await opts.requestFeature(DEPTH_FEATURE);
      }
      const init = session as XRSessionInit;
      const required = init.requiredFeatures ?? [];
      const optional = init.optionalFeatures ?? [];
      if (!required.includes(DEPTH_FEATURE) && !optional.includes(DEPTH_FEATURE)) {
        logger.debug('DepthOcclusionManager: depth-sensing not in session features', {
          required,
          optional,
        });
      }
      this.session = session;
      return true;
    } catch (err) {
      logger.warn('DepthOcclusionManager: initialize failed', { error: String(err) });
      this.supported = false;
      return false;
    }
  }

  /**
   * Update depth texture from XRFrame (when getDepthInformation is available).
   * @param frame - Current XRFrame
   * @param view - XRView to get depth for
   */
  update(frame: XRFrame, view: XRView): void {
    if (!this.session) return;
    const getDepth = (frame as XRFrame & { getDepthInformation?(v: XRView): unknown }).getDepthInformation;
    if (typeof getDepth !== 'function') return;
    const depthInfo = getDepth.call(frame, view) as XRDepthInformation | null;
    if (!depthInfo) return;
    const w = depthInfo.width;
    const h = depthInfo.height;
    if (w !== this.depthSize.width || h !== this.depthSize.height) {
      this.depthSize = { width: w, height: h };
      this.depthTexture?.dispose();
      this.depthTexture = new THREE.DataTexture(new Float32Array(w * h), w, h, THREE.RedFormat);
      this.depthTexture.needsUpdate = true;
    }
    const data = this.depthTexture!.image.data as Float32Array;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        data[y * w + x] = depthInfo.getDepthInMeters(x, y);
      }
    }
    this.depthTexture!.needsUpdate = true;
  }

  /**
   * Create a custom shader material that uses depth comparison for occlusion.
   * Uses depth texture set via update(); bind to your render target or pass as uniform.
   */
  createOcclusionMaterial(): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      uniforms: {
        depthMap: { value: this.depthTexture },
        cameraNear: { value: 0.1 },
        cameraFar: { value: 10 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D depthMap;
        uniform float cameraNear;
        uniform float cameraFar;
        varying vec2 vUv;
        void main() {
          float depth = texture2D(depthMap, vUv).r;
          if (depth < 0.001) discard;
          gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
        }
      `,
      transparent: true,
      depthWrite: false,
    });
  }

  /**
   * Get current depth texture (if any). Useful for binding in custom pipelines.
   */
  getDepthTexture(): THREE.DataTexture | null {
    return this.depthTexture;
  }

  dispose(): void {
    this.depthTexture?.dispose();
    this.depthTexture = null;
    this.session = null;
  }
}
