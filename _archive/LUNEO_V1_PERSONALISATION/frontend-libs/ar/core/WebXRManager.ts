/**
 * Main WebXR session manager.
 * Handles session lifecycle, render loop, and reference space.
 * @module ar/core/WebXRManager
 */

import { logger } from '@/lib/logger';

/** Events emitted by WebXRManager */
export type WebXRManagerEvent = 'sessionStarted' | 'sessionEnded' | 'error';

/** Listener type for manager events */
export type WebXRManagerEventListener =
  | ((session: XRSession) => void)
  | ((error: Error) => void)
  | (() => void);

/** Optional session features for immersive-ar */
export type WebXRSessionFeature =
  | 'hit-test'
  | 'plane-detection'
  | 'light-estimation'
  | 'anchors'
  | 'depth-sensing'
  | 'hand-tracking'
  | 'local-floor';

const DEFAULT_FEATURES: WebXRSessionFeature[] = ['local-floor'];

/**
 * WebXR session manager with event emitter pattern.
 * Use initialize() then startSession() to enter AR.
 */
export class WebXRManager {
  private session: XRSession | null = null;
  private referenceSpace: XRReferenceSpace | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;
  private frameCallback: ((time: number, frame: XRFrame) => void) | null = null;
  private animationFrameId: number | null = null;
  private readonly listeners: Map<WebXRManagerEvent, Set<WebXRManagerEventListener>> = new Map([
    ['sessionStarted', new Set()],
    ['sessionEnded', new Set()],
    ['error', new Set()],
  ]);

  /**
   * Check WebXR support and prepare for session.
   * @returns true if immersive-ar is supported
   */
  async initialize(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !navigator.xr) {
      logger.warn('WebXRManager: navigator.xr not available');
      return false;
    }
    try {
      const supported = await navigator.xr.isSessionSupported('immersive-ar');
      if (!supported) {
        logger.warn('WebXRManager: immersive-ar not supported');
      }
      return supported;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('WebXRManager: initialize failed', { error: error.message });
      this.emit('error', error);
      return false;
    }
  }

  /**
   * Request an immersive-ar XR session.
   * @param features - Optional/required session features
   * @param canvas - Canvas to use for XR rendering (optional; can be set later)
   */
  async startSession(
    features: {
      required?: WebXRSessionFeature[];
      optional?: WebXRSessionFeature[];
    } = {},
    canvas?: HTMLCanvasElement
  ): Promise<XRSession | null> {
    if (this.session) {
      logger.warn('WebXRManager: session already active');
      return this.session;
    }

    if (typeof navigator === 'undefined' || !navigator.xr) {
      this.emit('error', new Error('WebXR not available'));
      return null;
    }

    const required = features.required ?? [];
    const optional = features.optional ?? DEFAULT_FEATURES;
    const requiredSet = new Set([...required, 'local-floor']);

    try {
      this.session = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: Array.from(requiredSet),
        optionalFeatures: optional,
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('WebXRManager: requestSession failed', { error: error.message });
      this.emit('error', error);
      return null;
    }

    try {
      this.referenceSpace = await this.session.requestReferenceSpace('local-floor');
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('WebXRManager: requestReferenceSpace failed', { error: error.message });
      await this.session.end();
      this.session = null;
      this.emit('error', error);
      return null;
    }

    if (canvas) {
      this.canvas = canvas;
      this.gl = canvas.getContext('webgl', { xrCompatible: true }) ?? canvas.getContext('webgl2', { xrCompatible: true });
    }

    this.session.addEventListener('end', this.handleSessionEnd);
    this.emit('sessionStarted', this.session);
    logger.info('WebXRManager: session started');
    return this.session;
  }

  /**
   * End the current XR session and cleanup.
   */
  async stopSession(): Promise<void> {
    if (!this.session) return;

    if (this.animationFrameId != null) {
      this.session.cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.frameCallback = null;
    this.session.removeEventListener('end', this.handleSessionEnd);
    try {
      await this.session.end();
    } catch (err) {
      logger.warn('WebXRManager: session.end() error', { error: String(err) });
    }
    this.session = null;
    this.referenceSpace = null;
    this.canvas = null;
    this.gl = null;
    this.emit('sessionEnded');
    logger.info('WebXRManager: session stopped');
  }

  private handleSessionEnd = (): void => {
    this.session = null;
    this.referenceSpace = null;
    this.animationFrameId = null;
    this.frameCallback = null;
    this.emit('sessionEnded');
  };

  /**
   * Register callback for XR render loop. Call once; loop runs until session ends.
   */
  onFrame(callback: (time: number, frame: XRFrame) => void): void {
    this.frameCallback = callback;
    if (!this.session || !this.referenceSpace) return;

    const loop = (time: number, frame: XRFrame): void => {
      this.animationFrameId = this.session!.requestAnimationFrame(loop);
      this.frameCallback?.(time, frame);
    };
    this.animationFrameId = this.session.requestAnimationFrame(loop);
  }

  /** Current XRSession or null */
  getSession(): XRSession | null {
    return this.session;
  }

  /** Current XRReferenceSpace (local-floor) or null */
  getReferenceSpace(): XRReferenceSpace | null {
    return this.referenceSpace;
  }

  /** Canvas bound to session (if set) */
  getCanvas(): HTMLCanvasElement | null {
    return this.canvas;
  }

  /** WebGL context (if set) */
  getGL(): WebGLRenderingContext | WebGL2RenderingContext | null {
    return this.gl;
  }

  /** Bind canvas and GL context for this session */
  setCanvas(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl', { xrCompatible: true }) ?? canvas.getContext('webgl2', { xrCompatible: true });
  }

  on(event: WebXRManagerEvent, listener: WebXRManagerEventListener): void {
    this.listeners.get(event)?.add(listener);
  }

  off(event: WebXRManagerEvent, listener: WebXRManagerEventListener): void {
    this.listeners.get(event)?.delete(listener);
  }

  private emit(event: 'sessionStarted', session: XRSession): void;
  private emit(event: 'sessionEnded'): void;
  private emit(event: 'error', error: Error): void;
  private emit(event: WebXRManagerEvent, payload?: XRSession | Error): void {
    const set = this.listeners.get(event);
    if (!set) return;
    set.forEach((fn) => {
      try {
        if (event === 'sessionStarted' && payload instanceof Object && 'requestReferenceSpace' in payload) {
          (fn as (s: XRSession) => void)(payload as XRSession);
        } else if (event === 'error' && payload instanceof Error) {
          (fn as (e: Error) => void)(payload);
        } else if (event === 'sessionEnded') {
          (fn as () => void)();
        }
      } catch (e) {
        logger.error('WebXRManager: listener error', { event, error: String(e) });
      }
    });
  }
}
