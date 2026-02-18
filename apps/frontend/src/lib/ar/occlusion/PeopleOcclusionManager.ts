/**
 * People occlusion (e.g. iOS 13+ people segmentation).
 * Hides virtual content behind detected people using segmentation mask.
 * @module ar/occlusion/PeopleOcclusionManager
 */

import * as THREE from 'three';
import { logger } from '@/lib/logger';

const PEOPLE_OCCLUSION_FEATURE = 'person-segmentation';

/**
 * Manages people occlusion: requests person segmentation and applies mask to occlude 3D objects.
 */
export class PeopleOcclusionManager {
  private session: XRSession | null = null;
  private segmentationTexture: THREE.DataTexture | null = null;
  private maskSize = { width: 0, height: 0 };
  private enabled = false;

  /**
   * Initialize people occlusion for the given session.
   * Requests person-segmentation if available (e.g. ARKit).
   */
  async initialize(session: XRSession): Promise<boolean> {
    try {
      const init = session as XRSessionInit;
      const optional = init.optionalFeatures ?? [];
      if (!optional.includes(PEOPLE_OCCLUSION_FEATURE)) {
        const opts = session as XRSession & { requestFeature?: (f: string) => Promise<void> };
        if (typeof opts.requestFeature === 'function') {
          await opts.requestFeature(PEOPLE_OCCLUSION_FEATURE);
        } else {
          logger.debug('PeopleOcclusionManager: person-segmentation not requested in session');
        }
      }
      this.session = session;
      this.enabled = true;
      return true;
    } catch (err) {
      logger.warn('PeopleOcclusionManager: initialize failed', { error: String(err) });
      this.enabled = false;
      return false;
    }
  }

  /**
   * Update people segmentation mask from frame.
   * Uses getDepthInformation or platform-specific segmentation when available.
   */
  update(frame: XRFrame): void {
    if (!this.enabled || !this.session) return;
    const viewerPose = frame.getViewerPose(
      (this.session as XRSession & { _refSpace?: XRReferenceSpace })._refSpace as XRReferenceSpace
    );
    if (!viewerPose?.views?.length) return;
    const view = viewerPose.views[0];
    const frameExt = frame as XRFrame & { getDepthInformation?(v: XRView): unknown };
    if (typeof frameExt.getDepthInformation !== 'function') return;
    const depthInfo = frameExt.getDepthInformation(view) as XRDepthInformation | null;
    if (!depthInfo) return;
    const w = depthInfo.width;
    const h = depthInfo.height;
    if (w !== this.maskSize.width || h !== this.maskSize.height) {
      this.maskSize = { width: w, height: h };
      this.segmentationTexture?.dispose();
      this.segmentationTexture = new THREE.DataTexture(new Uint8Array(w * h), w, h, THREE.RedFormat);
      this.segmentationTexture.needsUpdate = true;
    }
    // Placeholder: real implementation would use platform segmentation buffer
    const data = this.segmentationTexture!.image.data as Uint8Array;
    data.fill(0);
    this.segmentationTexture!.needsUpdate = true;
  }

  /**
   * Apply occlusion to 3D objects in the scene (e.g. set stencil or use mask in material).
   * @param scene - Three.js scene to apply people occlusion to
   */
  applyToScene(scene: THREE.Scene): void {
    if (!this.segmentationTexture) return;
    scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        const mat = mesh.material as THREE.Material & { uniforms?: Record<string, { value: unknown }> };
        if (mat.uniforms) mat.uniforms.peopleMask = { value: this.segmentationTexture };
      }
    });
  }

  /**
   * Get current segmentation mask texture.
   */
  getSegmentationTexture(): THREE.DataTexture | null {
    return this.segmentationTexture;
  }

  dispose(): void {
    this.segmentationTexture?.dispose();
    this.segmentationTexture = null;
    this.session = null;
    this.enabled = false;
  }
}
