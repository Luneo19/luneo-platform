/**
 * WebXR Config Service
 * Determines required/optional XR features and generates session config based on device capabilities.
 * Used for WebXR AR sessions (Android Chrome/Firefox, desktop Chrome with VR).
 */

import { Injectable, Logger } from '@nestjs/common';
import type { ARFeatures } from '../platform-detector.service';

/** Required vs optional XR features for session creation */
export interface XRFeatureConfig {
  required: string[];
  optional: string[];
}

/** WebXR session configuration for navigator.xr.requestSession() */
export interface WebXRSessionConfig {
  /** Session mode: 'inline' | 'immersive-vr' | 'immersive-ar' */
  mode: 'inline' | 'immersive-vr' | 'immersive-ar';
  /** Required features (e.g. 'hit-test', 'light-estimation') */
  requiredFeatures?: string[];
  /** Optional features */
  optionalFeatures?: string[];
  /** Optional reference space type */
  referenceSpaceType?: 'viewer' | 'local' | 'local-floor' | 'bounded-floor' | 'unbounded';
}

/** Input: device/browser hints and desired AR features */
export interface WebXRConfigInput {
  /** Platform-detected features (planeDetection, lightEstimation, etc.) */
  features?: ARFeatures;
  /** Prefer immersive-ar when available */
  preferImmersiveAr?: boolean;
  /** Request hit-test for placement */
  requestHitTest?: boolean;
}

@Injectable()
export class WebxrConfigService {
  private readonly logger = new Logger(WebxrConfigService.name);

  /**
   * Determines required and optional XR features from platform features and options.
   *
   * @param input - features from platform detector and options
   * @returns required and optional feature strings for requestSession
   */
  getFeatureConfig(input: WebXRConfigInput): XRFeatureConfig {
    const { features = {}, requestHitTest = true } = input;

    const required: string[] = [];
    const optional: string[] = [];

    if (requestHitTest && features.hitTest) {
      required.push('hit-test');
    }
    if (features.lightEstimation) {
      optional.push('light-estimation');
    }
    if (features.planeDetection) {
      optional.push('plane-detection');
    }
    if (features.anchors) {
      optional.push('anchors');
    }
    if (features.imageTracking) {
      optional.push('image-tracking');
    }

    return { required, optional };
  }

  /**
   * Generates session config for WebXR based on device capabilities and desired mode.
   * Use with navigator.xr.requestSession(config).
   *
   * @param input - features and preferences
   * @returns WebXRSessionConfig for requestSession
   */
  getSessionConfig(input: WebXRConfigInput): WebXRSessionConfig {
    const { preferImmersiveAr = true } = input;
    const { required, optional } = this.getFeatureConfig(input);

    const mode: WebXRSessionConfig['mode'] = preferImmersiveAr ? 'immersive-ar' : 'inline';

    return {
      mode,
      requiredFeatures: required.length > 0 ? required : undefined,
      optionalFeatures: optional.length > 0 ? optional : undefined,
      referenceSpaceType: 'local-floor',
    };
  }

  /**
   * Returns a minimal inline session config (no AR, for 3D preview only).
   */
  getInlineSessionConfig(): WebXRSessionConfig {
    return {
      mode: 'inline',
      referenceSpaceType: 'viewer',
    };
  }
}
