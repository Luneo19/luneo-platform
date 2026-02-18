/**
 * AR session lifecycle and state machine.
 * Tracks session duration, features, and state transitions.
 * @module ar/core/ARSession
 */

import { logger } from '@/lib/logger';

/** AR session state */
export type ARSessionState = 'idle' | 'initializing' | 'active' | 'paused' | 'ended';

/** Session lifecycle events */
export type ARSessionEvent = 'stateChanged' | 'featureDetected';

export type ARSessionEventListener =
  | ((state: ARSessionState, prev: ARSessionState) => void)
  | ((feature: string) => void);

/** Detected AR feature (e.g. from session or environment) */
export interface ARFeatureInfo {
  name: string;
  available: boolean;
  source?: 'session' | 'environment';
}

export interface ARSessionMetrics {
  startTime: number | null;
  endTime: number | null;
  durationMs: number;
  featuresUsed: string[];
}

/**
 * AR session lifecycle with state machine and metrics.
 */
export class ARSession {
  private state: ARSessionState = 'idle';
  private startTime: number | null = null;
  private endTime: number | null = null;
  private featuresUsed: Set<string> = new Set();
  private readonly listeners: Map<ARSessionEvent, Set<ARSessionEventListener>> = new Map([
    ['stateChanged', new Set()],
    ['featureDetected', new Set()],
  ]);

  /** Current state */
  getState(): ARSessionState {
    return this.state;
  }

  /** Transition to initializing (e.g. before requesting XR session) */
  start(): void {
    if (this.state !== 'idle' && this.state !== 'ended') {
      logger.warn('ARSession: start() called in state', { state: this.state });
      return;
    }
    this.setState('initializing');
    this.startTime = null;
    this.endTime = null;
    this.featuresUsed.clear();
  }

  /** Mark session as active (e.g. after XR session started) */
  resume(): void {
    if (this.state === 'initializing' || this.state === 'paused') {
      if (this.startTime == null) this.startTime = performance.now();
      this.setState('active');
    }
  }

  /** Pause session (e.g. app in background) */
  pause(): void {
    if (this.state === 'active') {
      this.setState('paused');
    }
  }

  /** End session and record duration */
  end(): void {
    if (this.state === 'active' || this.state === 'paused' || this.state === 'initializing') {
      this.endTime = performance.now();
      this.setState('ended');
    }
  }

  /** Record that a feature was used */
  recordFeature(feature: string): void {
    this.featuresUsed.add(feature);
    this.emit('featureDetected', feature);
  }

  /** Get session metrics */
  getMetrics(): ARSessionMetrics {
    const start = this.startTime ?? 0;
    const end = this.endTime ?? performance.now();
    const durationMs = this.state === 'active' || this.state === 'paused' ? end - start : 0;
    return {
      startTime: this.startTime,
      endTime: this.endTime,
      durationMs,
      featuresUsed: Array.from(this.featuresUsed),
    };
  }

  /** Reset to idle (e.g. for a new session) */
  reset(): void {
    this.state = 'idle';
    this.startTime = null;
    this.endTime = null;
    this.featuresUsed.clear();
  }

  private setState(next: ARSessionState): void {
    const prev = this.state;
    this.state = next;
    logger.debug('ARSession: state', { prev, next });
    this.emit('stateChanged', next, prev);
  }

  on(event: 'stateChanged', listener: (state: ARSessionState, prev: ARSessionState) => void): void;
  on(event: 'featureDetected', listener: (feature: string) => void): void;
  on(event: ARSessionEvent, listener: ARSessionEventListener): void {
    this.listeners.get(event)?.add(listener);
  }

  off(event: ARSessionEvent, listener: ARSessionEventListener): void {
    this.listeners.get(event)?.delete(listener);
  }

  private emit(event: 'stateChanged', state: ARSessionState, prev: ARSessionState): void;
  private emit(event: 'featureDetected', feature: string): void;
  private emit(event: ARSessionEvent, a?: ARSessionState | string, b?: ARSessionState): void {
    const set = this.listeners.get(event);
    if (!set) return;
    set.forEach((fn) => {
      try {
        if (event === 'stateChanged') {
          (fn as (state: ARSessionState, prev: ARSessionState) => void)(a as ARSessionState, b!);
        } else {
          (fn as (feature: string) => void)(a as string);
        }
      } catch (e) {
        logger.error('ARSession: listener error', { event, error: String(e) });
      }
    });
  }
}
