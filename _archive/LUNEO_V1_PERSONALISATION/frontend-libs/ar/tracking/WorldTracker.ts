/**
 * World tracking (SLAM): viewer pose and spatial anchors.
 * @module ar/tracking/WorldTracker
 */

import { logger } from '@/lib/logger';

/**
 * World tracking: local-floor reference space, viewer pose, and anchor creation.
 */
export class WorldTracker {
  private session: XRSession | null = null;
  private referenceSpace: XRReferenceSpace | null = null;

  /**
   * Initialize world tracking with local-floor reference space.
   */
  async initialize(session: XRSession): Promise<boolean> {
    try {
      this.referenceSpace = await session.requestReferenceSpace('local-floor');
      this.session = session;
      return true;
    } catch (err) {
      logger.warn('WorldTracker: initialize failed', { error: String(err) });
      return false;
    }
  }

  /**
   * Update: no per-frame state to update; use getViewerPose(frame) for pose.
   */
  update(_frame: XRFrame): void {
    // Optional: cache last viewer pose if needed
  }

  /**
   * Create a spatial anchor at the given pose in the reference space.
   * @param position - Position in reference space (e.g. from hit test)
   * @param frame - Current XRFrame (used if createAnchor requires it)
   * @returns XRAnchor or null if not supported
   */
  async createAnchor(
    position: { x: number; y: number; z: number },
    frame: XRFrame
  ): Promise<XRAnchor | null> {
    if (!this.referenceSpace || !this.session) return null;
    const createAnchorFn = (this.session as XRSession & { createAnchor?(pose: XRRigidTransform, space: XRSpace): Promise<XRAnchor> }).createAnchor;
    if (typeof createAnchorFn !== 'function') return null;
    const transform = new XRRigidTransform(
      new DOMPointReadOnly(position.x, position.y, position.z),
      new DOMPointReadOnly(0, 0, 0, 1)
    );
    try {
      return await createAnchorFn.call(this.session, transform, this.referenceSpace);
    } catch (err) {
      logger.warn('WorldTracker: createAnchor failed', { error: String(err) });
      return null;
    }
  }

  /**
   * Get current viewer (camera) pose in the reference space.
   */
  getViewerPose(frame: XRFrame): XRViewerPose | null {
    if (!this.referenceSpace) return null;
    return frame.getViewerPose(this.referenceSpace);
  }

  /**
   * Get reference space (e.g. for hit test or anchor creation).
   */
  getReferenceSpace(): XRReferenceSpace | null {
    return this.referenceSpace;
  }

  dispose(): void {
    this.session = null;
    this.referenceSpace = null;
  }
}
