/**
 * Auto-detect platform and route to the appropriate AR launch method.
 * @module ar/platforms/PlatformRouter
 */

import { logger } from '@/lib/logger';
import { detectCapabilities } from '../core/XRDeviceDetector';

export type ARLaunchMethod =
  | 'webxr'
  | 'ar-quick-look'
  | 'scene-viewer'
  | 'model-viewer'
  | 'qr-redirect';

export type ARPlatform = 'ios' | 'android' | 'desktop';

export type ARModelFormat = 'gltf' | 'glb' | 'usdz';

export interface ARPlatformConfig {
  platform: ARPlatform;
  method: ARLaunchMethod;
  format: ARModelFormat;
  features: string[];
  fallback: ARLaunchMethod | null;
  /** User agent summary for debugging */
  uaSummary: string;
}

/**
 * Detect current platform and return recommended AR config.
 */
export async function detect(): Promise<ARPlatformConfig> {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const caps = await detectCapabilities();

  const platform: ARPlatform = caps.platform === 'desktop' ? 'desktop' : caps.platform;
  const uaSummary = [
    platform,
    caps.browser,
    ua.slice(0, 60) + (ua.length > 60 ? '…' : ''),
  ].join(' | ');

  if (platform === 'ios') {
    const method: ARLaunchMethod = caps.arSession ? 'webxr' : 'ar-quick-look';
    const format: ARModelFormat = method === 'ar-quick-look' ? 'usdz' : 'glb';
    return {
      platform: 'ios',
      method,
      format,
      features: caps.features,
      fallback: method === 'webxr' ? 'ar-quick-look' : 'qr-redirect',
      uaSummary,
    };
  }

  if (platform === 'android') {
    const method: ARLaunchMethod = caps.arSession ? 'webxr' : 'scene-viewer';
    return {
      platform: 'android',
      method: method,
      format: 'glb',
      features: caps.features,
      fallback: method === 'webxr' ? 'scene-viewer' : 'qr-redirect',
      uaSummary,
    };
  }

  return {
    platform: 'desktop',
    method: 'qr-redirect',
    format: 'glb',
    features: [],
    fallback: caps.arSession ? 'webxr' : null,
    uaSummary,
  };
}

/**
 * Get recommended launch method for current environment.
 */
export async function getLaunchMethod(): Promise<ARLaunchMethod> {
  const config = await detect();
  return config.method;
}

/**
 * Get full platform config (platform, method, format, features, fallback).
 */
export async function getPlatformConfig(): Promise<ARPlatformConfig> {
  const config = await detect();
  logger.debug('PlatformRouter: config', { method: config.method, platform: config.platform });
  return config;
}
