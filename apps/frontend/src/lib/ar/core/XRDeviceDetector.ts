/**
 * Detect device XR capabilities (WebXR, AR session, optional features).
 * Handles browser-specific behavior (Chrome, Safari).
 * @module ar/core/XRDeviceDetector
 */

import { logger } from '@/lib/logger';

export type XRFeatureName =
  | 'hit-test'
  | 'plane-detection'
  | 'light-estimation'
  | 'anchors'
  | 'depth-sensing'
  | 'hand-tracking';

export interface XRDeviceCapabilities {
  webxr: boolean;
  arSession: boolean;
  features: XRFeatureName[];
  browser: 'chrome' | 'safari' | 'firefox' | 'edge' | 'unknown';
  platform: 'ios' | 'android' | 'desktop';
  /** Safari/iOS specific limitations */
  safariLimitations?: string[];
  /** Chrome/Android specific notes */
  chromeNotes?: string[];
}

/**
 * Detect WebXR and AR capabilities for the current device/browser.
 */
export async function detectCapabilities(): Promise<XRDeviceCapabilities> {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const platform = getPlatform(ua);
  const browser = getBrowser(ua);

  let webxr = false;
  let arSession = false;
  const features: XRFeatureName[] = [];
  const safariLimitations: string[] = [];
  const chromeNotes: string[] = [];

  if (typeof navigator === 'undefined' || !navigator.xr) {
    return {
      webxr: false,
      arSession: false,
      features: [],
      browser,
      platform,
    };
  }

  try {
    webxr = true;
    arSession = await navigator.xr.isSessionSupported('immersive-ar');
  } catch (err) {
    logger.warn('XRDeviceDetector: isSessionSupported failed', { error: String(err) });
    return {
      webxr: true,
      arSession: false,
      features: [],
      browser,
      platform,
    };
  }

  if (!arSession) {
    return { webxr, arSession, features: [], browser, platform };
  }

  // Feature detection: requestSession with optional features and see what we get
  // We don't actually start a session; we infer from browser/platform what's typically supported.
  if (browser === 'safari' && platform === 'ios') {
    safariLimitations.push('Hit-test and plane detection may require iOS 15+');
    safariLimitations.push('Light estimation support varies by device');
    features.push('hit-test', 'plane-detection', 'light-estimation');
  }

  if (browser === 'chrome' && platform === 'android') {
    chromeNotes.push('ARCore required for hit-test and plane detection');
    features.push('hit-test', 'plane-detection', 'light-estimation', 'anchors');
  }

  if (browser === 'chrome' && platform === 'desktop') {
    chromeNotes.push('Immersive AR may not be available on desktop');
  }

  // Hand-tracking is optional and not universally available
  if (platform === 'android' && browser === 'chrome') {
    features.push('hand-tracking');
  }

  // Depth-sensing is rare; include only when we know it's supported (simplified: omit by default)
  // Could be extended with actual session request and feature check.

  return {
    webxr,
    arSession,
    features: [...new Set(features)],
    browser,
    platform,
    safariLimitations: safariLimitations.length ? safariLimitations : undefined,
    chromeNotes: chromeNotes.length ? chromeNotes : undefined,
  };
}

function getPlatform(ua: string): 'ios' | 'android' | 'desktop' {
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'desktop';
}

function getBrowser(ua: string): XRDeviceCapabilities['browser'] {
  if (/Safari/.test(ua) && !/Chrome|Chromium/.test(ua)) return 'safari';
  if (/Chrome|Chromium/.test(ua)) return 'chrome';
  if (/Firefox/.test(ua)) return 'firefox';
  if (/Edg/.test(ua)) return 'edge';
  return 'unknown';
}

/**
 * Check if a specific feature is likely supported (heuristic).
 * For definitive check, request a session with that optional feature.
 */
export function isFeatureLikelySupported(
  capabilities: XRDeviceCapabilities,
  feature: XRFeatureName
): boolean {
  return capabilities.features.includes(feature);
}
