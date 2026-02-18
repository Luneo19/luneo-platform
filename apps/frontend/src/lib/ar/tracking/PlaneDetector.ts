/**
 * Detect planes via WebXR (horizontal/vertical surfaces).
 * @module ar/tracking/PlaneDetector
 */

import { logger } from '@/lib/logger';

export interface DetectedPlaneInfo {
  orientation: 'horizontal' | 'vertical';
  polygon: DOMPointReadOnly[];
  lastChangedTime: number;
  plane: XRPlane;
}

type PlaneDetectedCallback = (plane: DetectedPlaneInfo) => void;

/**
 * Detects planes using WebXR plane-detection feature.
 */
export class PlaneDetector {
  private session: XRSession | null = null;
  private referenceSpace: XRReferenceSpace | null = null;
  private readonly planes: DetectedPlaneInfo[] = [];
  private onPlaneDetectedCallback: PlaneDetectedCallback | null = null;
  private readonly seenPlanes = new Set<XRPlane>();

  /**
   * Initialize plane detection: request plane-detection feature and reference space.
   */
  async initialize(session: XRSession): Promise<boolean> {
    try {
      this.referenceSpace = await session.requestReferenceSpace('local-floor');
      this.session = session;
      const init = session as XRSessionInit;
      const optional = init.optionalFeatures ?? [];
      if (!optional.includes('plane-detection')) {
        (init.optionalFeatures = optional.concat('plane-detection'));
      }
      return true;
    } catch (err) {
      logger.warn('PlaneDetector: initialize failed', { error: String(err) });
      return false;
    }
  }

  /**
   * Update detected planes from current frame.
   */
  update(frame: XRFrame): void {
    if (!this.session) return;
    const session = frame.session as XRSession & { getDetectedPlanes?: () => Set<XRPlane> };
    const set = session.getDetectedPlanes?.();
    if (!set) return;
    for (const plane of set) {
      const info: DetectedPlaneInfo = {
        orientation: plane.orientation,
        polygon: plane.polygon ?? [],
        lastChangedTime: plane.lastChangedTime,
        plane,
      };
      const idx = this.planes.findIndex((p) => p.plane === plane);
      if (idx >= 0) {
        this.planes[idx] = info;
      } else {
        this.planes.push(info);
        this.seenPlanes.add(plane);
        this.onPlaneDetectedCallback?.(info);
      }
    }
    // Remove stale planes no longer in set
    for (let i = this.planes.length - 1; i >= 0; i--) {
      if (!set.has(this.planes[i].plane)) {
        this.planes.splice(i, 1);
      }
    }
  }

  /**
   * Get current detected planes with orientation.
   */
  getPlanes(): DetectedPlaneInfo[] {
    return this.planes.slice();
  }

  /**
   * Register callback when a new plane is found.
   */
  onPlaneDetected(callback: PlaneDetectedCallback): void {
    this.onPlaneDetectedCallback = callback;
  }

  dispose(): void {
    this.session = null;
    this.referenceSpace = null;
    this.planes.length = 0;
    this.seenPlanes.clear();
    this.onPlaneDetectedCallback = null;
  }
}
