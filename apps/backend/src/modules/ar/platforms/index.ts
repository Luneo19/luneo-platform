/**
 * AR platforms barrel: platform detection, iOS (AR Quick Look, USDZ), Android (Scene Viewer),
 * Web (WebXR, model-viewer), Desktop (QR redirect).
 */

export * from './platform-detector.service';
export * from './ios/ar-quick-look.service';
export * from './ios/usdz-generator.service';
export * from './android/scene-viewer.service';
export * from './web/webxr-config.service';
export * from './web/model-viewer-config.service';
export * from './desktop/qr-code-redirect.service';
