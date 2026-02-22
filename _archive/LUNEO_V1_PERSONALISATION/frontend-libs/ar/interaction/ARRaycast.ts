/**
 * Raycast on detected surfaces (WebXR hit-test).
 * @module ar/interaction/ARRaycast
 */

import { logger } from '@/lib/logger';

export type XRHitTestResultPose = XRPose;

/**
 * AR raycast (hit-test) on detected surfaces.
 */
export class ARRaycast {
  private session: XRSession | null = null;
  private referenceSpace: XRReferenceSpace | null = null;
  private hitTestSource: XRHitTestSource | null = null;

  /**
   * Initialize hit-test source for the given session.
   */
  async initialize(session: XRSession): Promise<boolean> {
    try {
      this.referenceSpace = await session.requestReferenceSpace('viewer');
      this.session = session;
      const req = (session as XRSession & { requestHitTestSource?(opts: XRHitTestOptionsInit): Promise<XRHitTestSource> }).requestHitTestSource;
      if (typeof req !== 'function') return false;
      this.hitTestSource = await req.call(session, { space: this.referenceSpace });
      return true;
    } catch (err) {
      logger.warn('ARRaycast: initialize failed', { error: String(err) });
      return false;
    }
  }

  /**
   * Perform hit test from viewer; returns first hit or null.
   */
  hitTest(frame: XRFrame): XRHitTestResult[] {
    if (!this.hitTestSource || !this.referenceSpace) return [];
    const hitTestResults = (frame as XRFrame & { getHitTestResults?(source: XRHitTestSource): XRHitTestResult[] }).getHitTestResults;
    if (typeof hitTestResults !== 'function') return [];
    return hitTestResults.call(frame, this.hitTestSource) ?? [];
  }

  /**
   * Get pose from a hit test result in the given base space.
   */
  getHitPose(result: XRHitTestResult, baseSpace: XRSpace): XRPose | null {
    return result.getPose(baseSpace);
  }

  dispose(): void {
    this.hitTestSource?.cancel();
    this.hitTestSource = null;
    this.session = null;
    this.referenceSpace = null;
  }
}
