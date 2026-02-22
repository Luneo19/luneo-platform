/**
 * WebXR Core module.
 * @module ar/core
 */

export { WebXRManager } from './WebXRManager';
export type { WebXRManagerEvent, WebXRManagerEventListener, WebXRSessionFeature } from './WebXRManager';

export { ARSession } from './ARSession';
export type {
  ARSessionState,
  ARSessionEvent,
  ARSessionEventListener,
  ARFeatureInfo,
  ARSessionMetrics,
} from './ARSession';

export { detectCapabilities, isFeatureLikelySupported } from './XRDeviceDetector';
export type { XRDeviceCapabilities, XRFeatureName } from './XRDeviceDetector';

export {
  requestCameraPermission,
  requestMotionPermission,
  checkAllPermissions,
  onPermissionGranted,
  onPermissionDenied,
} from './XRPermissionManager';
export type {
  XRPermissionType,
  XRPermissionEvent,
  XRPermissionStatus,
  XRPermissionResult,
} from './XRPermissionManager';
