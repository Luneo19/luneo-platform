/**
 * Minimal WebXR type declarations for AR module.
 * For full typings, install @types/webxr.
 * @see https://www.w3.org/TR/webxr/
 */

declare global {
  interface Navigator {
    xr?: XRSystem;
  }

  interface XRSystem {
    isSessionSupported(mode: XRSessionMode): Promise<boolean>;
    requestSession(mode: XRSessionMode, options?: XRSessionInit): Promise<XRSession>;
  }

  type XRSessionMode = 'inline' | 'immersive-vr' | 'immersive-ar';

  interface XRSessionInit {
    optionalFeatures?: string[];
    requiredFeatures?: string[];
  }

  interface XRSession extends EventTarget {
    readonly mode: XRSessionMode;
    readonly enabled: boolean;
    readonly visibilityState: XRVisibilityState;
    requestReferenceSpace(type: XRReferenceSpaceType): Promise<XRReferenceSpace>;
    requestAnimationFrame(callback: XRFrameRequestCallback): number;
    cancelAnimationFrame(id: number): void;
    end(): Promise<void>;
    requestLightProbe?(options?: XRLightProbeInit): Promise<XRLightProbe>;
    addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
  }

  interface XRLightProbeInit {
    reflectionFormat?: 'srgba8' | 'rgba16f';
  }

  interface XRLightProbe {
    readonly probeSpace: XRSpace;
  }

  interface XRLightEstimate {
    readonly sphericalHarmonicsCoefficients: Float32Array;
    readonly primaryLightDirection: DOMPointReadOnly;
    readonly primaryLightIntensity: DOMPointReadOnly;
  }

  type XRVisibilityState = 'visible' | 'visible-blurred' | 'hidden';

  type XRReferenceSpaceType =
    | 'viewer'
    | 'local'
    | 'local-floor'
    | 'bounded-floor'
    | 'unbounded';

  interface XRReferenceSpace extends XRSpace {
    getOffsetReferenceSpace(originOffset: XRRigidTransform): XRReferenceSpace;
  }

  interface XRSpace {}

  interface XRRigidTransform {
    position: DOMPointReadOnly;
    orientation: DOMPointReadOnly;
    matrix: Float32Array;
    inverse: XRRigidTransform;
  }

  /** Constructor for XRRigidTransform (browser-provided). */
  const XRRigidTransform: {
    new (position?: DOMPointInit, orientation?: DOMPointInit): XRRigidTransform;
  };

  type XRFrameRequestCallback = (time: number, frame: XRFrame) => void;

  interface XRFrame {
    readonly session: XRSession;
    getViewerPose(referenceSpace: XRReferenceSpace): XRViewerPose | null;
    getPose(space: XRSpace, baseSpace: XRSpace): XRPose | null;
    getLightEstimate?(lightProbe: XRLightProbe): XRLightEstimate | null;
  }

  interface XRViewerPose extends XRPose {
    readonly views: readonly XRView[];
  }

  interface XRPose {
    readonly transform: XRRigidTransform;
    readonly emulatedPosition: boolean;
  }

  interface XRView {
    readonly eye: XREye;
    readonly projectionMatrix: Float32Array;
    readonly viewMatrix: Float32Array;
    readonly transform: XRRigidTransform;
  }

  type XREye = 'none' | 'left' | 'right';

  interface XRWebGLBinding {
    createProjectionLayer(init?: XRProjectionLayerInit): XRProjectionLayer;
    getViewerPose(referenceSpace: XRReferenceSpace, frame: XRFrame): XRViewerPose | null;
    getSubImage(baseLayer: XRCompositionLayer, frame: XRFrame, view: XRView): XRSubImage;
  }

  interface XRProjectionLayerInit {
    textureType?: 'texture' | 'texture-array';
    colorFormat?: number;
    depthFormat?: number;
    scaleFactor?: number;
  }

  interface XRProjectionLayer extends XRCompositionLayer {}

  interface XRCompositionLayer {}

  interface XRSubImage {
    readonly viewport: XRViewport;
  }

  interface XRViewport {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  }

  interface XRHitTestSource {
    cancel(): void;
  }

  interface XRHitTestResult {
    getPose(baseSpace: XRSpace): XRPose | null;
  }

  // Extended WebXR features (depth, planes, image tracking, anchors, hit test)
  interface XRFrame {
    getDepthInformation?(view: XRView): XRDepthInformation | undefined;
    getImageTrackingResults?(): XRImageTrackingResult[];
    getDetectedPlaneData?(plane: XRPlane): XRPlaneData | undefined;
    getHitTestResults?(source: XRHitTestSource): XRHitTestResult[];
  }

  interface XRDepthInformation {
    width: number;
    height: number;
    normDepthBufferFromNormView: Float32Array;
    getDepthInMeters(x: number, y: number): number;
  }

  interface XRPlane {
    orientation: 'horizontal' | 'vertical';
    polygon: DOMPointReadOnly[];
    lastChangedTime: number;
  }

  interface XRPlaneData {
    polygon: DOMPointReadOnly[];
  }

  interface XRImageTrackingResult {
    index: number;
    tracked: boolean;
    getPose(baseSpace: XRSpace): XRPose | null;
  }

  interface XRSession {
    requestHitTestSource?(options: XRHitTestOptionsInit): Promise<XRHitTestSource>;
    requestHitTestSourceForTransientInput?(
      options: XRTransientInputHitTestOptionsInit
    ): Promise<XRTransientInputHitTestSource>;
    createAnchor?(pose: XRRigidTransform, space: XRSpace): Promise<XRAnchor>;
  }

  interface XRHitTestOptionsInit {
    space: XRSpace;
    offsetRay?: XRRay;
  }

  interface XRTransientInputHitTestOptionsInit {
    profile: string;
    offsetRay?: XRRay;
  }

  interface XRRay {
    origin: DOMPointReadOnly;
    direction: DOMPointReadOnly;
  }

  interface XRTransientInputHitTestSource {
    cancel(): void;
  }

  interface XRAnchor {
    anchorSpace: XRSpace;
    delete(): void;
  }

  interface XRAnchorSet extends Set<XRAnchor> {}

  interface XRFrame {
    trackedAnchors?: XRAnchorSet;
  }
}

export {};
