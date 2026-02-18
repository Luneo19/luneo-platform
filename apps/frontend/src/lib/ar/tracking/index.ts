/**
 * AR Tracking module: planes, images, world (SLAM).
 * FaceTracker and HandTracker live in trackers/.
 * @module ar/tracking
 */

export { PlaneDetector } from './PlaneDetector';
export type { DetectedPlaneInfo } from './PlaneDetector';
export { ImageTracker } from './ImageTracker';
export type { ImageTarget, ImageTrackingResult } from './ImageTracker';
export { WorldTracker } from './WorldTracker';
