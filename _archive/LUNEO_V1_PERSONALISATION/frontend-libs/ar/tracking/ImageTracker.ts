/**
 * Track image markers via WebXR Image Tracking.
 * @module ar/tracking/ImageTracker
 */

import { logger } from '@/lib/logger';

export interface ImageTarget {
  index: number;
  image?: HTMLImageElement | ImageBitmap;
  widthInMeters?: number;
}

export interface ImageTrackingResult {
  index: number;
  tracked: boolean;
  getPose(baseSpace: XRSpace): XRPose | null;
}

type TargetFoundCallback = (result: ImageTrackingResult) => void;
type TargetLostCallback = (index: number) => void;

/**
 * Tracks images (markers) using WebXR image-tracking feature.
 */
export class ImageTracker {
  private session: XRSession | null = null;
  private referenceSpace: XRReferenceSpace | null = null;
  private targets: ImageTarget[] = [];
  private lastTracked = new Map<number, boolean>();
  private onTargetFoundCallback: TargetFoundCallback | null = null;
  private onTargetLostCallback: TargetLostCallback | null = null;

  /**
   * Initialize image tracking with given targets.
   * @param session - XRSession
   * @param targetsList - Array of image targets (index + optional image/width)
   */
  async initialize(session: XRSession, targetsList: ImageTarget[]): Promise<boolean> {
    try {
      this.referenceSpace = await session.requestReferenceSpace('local-floor');
      this.session = session;
      this.targets = targetsList.slice();
      const init = session as XRSessionInit;
      const optional = init.optionalFeatures ?? [];
      if (!optional.includes('image-tracking')) {
        (init.optionalFeatures = optional.concat('image-tracking'));
      }
      return true;
    } catch (err) {
      logger.warn('ImageTracker: initialize failed', { error: String(err) });
      return false;
    }
  }

  /**
   * Update: check tracked images and fire onTargetFound/onTargetLost.
   */
  update(frame: XRFrame): void {
    const getResults = (frame as XRFrame & { getImageTrackingResults?(): unknown }).getImageTrackingResults;
    if (typeof getResults !== 'function') return;
    const results = (getResults.call(frame) ?? []) as ImageTrackingResult[];
    const nowTracked = new Set<number>();
    for (const r of results) {
      const res = r as ImageTrackingResult;
      nowTracked.add(res.index);
      const wasTracked = this.lastTracked.get(res.index);
      if (!wasTracked && res.tracked) {
        this.onTargetFoundCallback?.(res);
      }
      this.lastTracked.set(res.index, res.tracked);
    }
    for (const [index, tracked] of this.lastTracked) {
      if (tracked && !nowTracked.has(index)) {
        this.onTargetLostCallback?.(index);
        this.lastTracked.set(index, false);
      }
    }
  }

  /**
   * Register callback when an image target is found (tracked).
   */
  onTargetFound(callback: TargetFoundCallback): void {
    this.onTargetFoundCallback = callback;
  }

  /**
   * Register callback when an image target is lost.
   */
  onTargetLost(callback: TargetLostCallback): void {
    this.onTargetLostCallback = callback;
  }

  dispose(): void {
    this.session = null;
    this.referenceSpace = null;
    this.targets = [];
    this.lastTracked.clear();
    this.onTargetFoundCallback = null;
    this.onTargetLostCallback = null;
  }
}
