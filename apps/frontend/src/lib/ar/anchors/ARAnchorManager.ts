/**
 * Local XR anchor management: create, remove, update poses.
 * @module ar/anchors/ARAnchorManager
 */

import { logger } from '@/lib/logger';

export interface ManagedAnchor {
  id: string;
  anchor: XRAnchor;
  createdAt: number;
}

/**
 * Manages XR anchors for the current session.
 */
export class ARAnchorManager {
  private session: XRSession | null = null;
  private referenceSpace: XRReferenceSpace | null = null;
  private readonly anchors = new Map<string, ManagedAnchor>();
  private idCounter = 0;

  /**
   * Initialize with session and reference space (e.g. from WorldTracker).
   */
  async initialize(session: XRSession, referenceSpace: XRReferenceSpace): Promise<void> {
    this.session = session;
    this.referenceSpace = referenceSpace;
  }

  /**
   * Create an XR anchor at the given pose.
   * @param pose - Transform in reference space
   * @param frame - Current XRFrame (for APIs that need it)
   * @returns Anchor id or null if creation failed
   */
  async createAnchor(pose: XRRigidTransform, frame: XRFrame): Promise<string | null> {
    if (!this.referenceSpace || !this.session) return null;
    const createAnchorFn = (this.session as XRSession & { createAnchor?(p: XRRigidTransform, s: XRSpace): Promise<XRAnchor> }).createAnchor;
    if (typeof createAnchorFn !== 'function') return null;
    try {
      const anchor = await createAnchorFn.call(this.session, pose, this.referenceSpace);
      const id = `anchor-${++this.idCounter}`;
      this.anchors.set(id, { id, anchor, createdAt: Date.now() });
      return id;
    } catch (err) {
      logger.warn('ARAnchorManager: createAnchor failed', { error: String(err) });
      return null;
    }
  }

  /**
   * Remove an anchor by id.
   */
  removeAnchor(id: string): void {
    const managed = this.anchors.get(id);
    if (managed) {
      try {
        managed.anchor.delete();
      } catch {
        // ignore
      }
      this.anchors.delete(id);
    }
  }

  /**
   * Get all active anchors.
   */
  getAnchors(): ManagedAnchor[] {
    return Array.from(this.anchors.values());
  }

  /**
   * Update anchor poses from frame (e.g. getPose(anchor.anchorSpace, refSpace)).
   * Returns map of id -> pose for anchors that are still valid.
   */
  update(frame: XRFrame): Map<string, XRPose> {
    const poses = new Map<string, XRPose>();
    if (!this.referenceSpace) return poses;
    for (const [id, { anchor }] of this.anchors) {
      const pose = frame.getPose(anchor.anchorSpace, this.referenceSpace);
      if (pose) poses.set(id, pose);
    }
    return poses;
  }

  dispose(): void {
    for (const { anchor } of this.anchors.values()) {
      try {
        anchor.delete();
      } catch {
        // ignore
      }
    }
    this.anchors.clear();
    this.session = null;
    this.referenceSpace = null;
  }
}
