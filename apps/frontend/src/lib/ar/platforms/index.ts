/**
 * AR Platforms module.
 * @module ar/platforms
 */

export {
  detect,
  getLaunchMethod,
  getPlatformConfig,
} from './PlatformRouter';
export type {
  ARLaunchMethod,
  ARPlatform,
  ARModelFormat,
  ARPlatformConfig,
} from './PlatformRouter';

export { launch as launchARQuickLook, isSupported as isARQuickLookSupported, parseCallbackFromHash } from './ARQuickLookProvider';
export type { ARQuickLookOptions } from './ARQuickLookProvider';

export { launch as launchSceneViewer, isSupported as isSceneViewerSupported, buildIntentUrl } from './SceneViewerProvider';
export type { SceneViewerOptions } from './SceneViewerProvider';

export { launch as launchWebXR, isSupported as isWebXRSupported } from './WebXRProvider';
export type { WebXRLaunchOptions } from './WebXRProvider';

export { showViewer as showDesktopViewer, showQRCode } from './DesktopFallback';
export type { DesktopViewerOptions, QRCodeOptions } from './DesktopFallback';
