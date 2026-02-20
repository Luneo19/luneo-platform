/**
 * Platform Detector Service
 * Detects AR platform and capabilities from User-Agent for multi-platform AR support.
 * Maps device/browser to AR method (AR Quick Look, Scene Viewer, WebXR) and format (USDZ, glTF).
 */

import { Injectable, Logger } from '@nestjs/common';

/** Detected platform: ios, android, or desktop */
export type DetectedPlatform = 'ios' | 'android' | 'desktop';

/** AR delivery method for the platform */
export type ARMethod =
  | 'ar-quick-look'
  | 'scene-viewer'
  | 'webxr'
  | 'qr-redirect'
  | 'model-viewer';

/** Preferred 3D format for the platform */
export type ARFormat = 'usdz' | 'gltf' | 'glb';

/** Optional AR features the client may support */
export interface ARFeatures {
  planeDetection?: boolean;
  lightEstimation?: boolean;
  hitTest?: boolean;
  imageTracking?: boolean;
  anchors?: boolean;
}

/**
 * Result of platform detection for AR viewer routing.
 */
export interface PlatformDetectionResult {
  /** Detected platform: ios, android, desktop */
  platform: DetectedPlatform;
  /** AR method to use: ar-quick-look, scene-viewer, webxr, qr-redirect, model-viewer */
  method: ARMethod;
  /** Preferred 3D format: usdz (iOS) or gltf/glb (Android/Web) */
  format: ARFormat;
  /** Fallback method if primary is unavailable (e.g. WebXR -> model-viewer) */
  fallback: ARMethod | null;
  /** Optional capabilities for WebXR/config */
  features: ARFeatures;
}

@Injectable()
export class PlatformDetectorService {
  private readonly logger = new Logger(PlatformDetectorService.name);

  /**
   * Detects platform and AR capabilities from a User-Agent string.
   * Uses optional header; if not provided, defaults to desktop QR redirect.
   *
   * @param userAgent - User-Agent header (e.g. from request)
   * @returns PlatformDetectionResult with platform, method, format, fallback, features
   */
  detect(userAgent: string | undefined): PlatformDetectionResult {
    const ua = (userAgent ?? '').toLowerCase();

    // Meta Quest (VR headset with WebXR)
    if (ua.includes('quest') || ua.includes('oculus')) {
      return {
        platform: 'android',
        method: 'webxr',
        format: 'gltf',
        fallback: 'model-viewer',
        features: {
          planeDetection: true,
          lightEstimation: true,
          hitTest: true,
        },
      };
    }

    // iOS
    if (this.isIos(ua)) {
      return this.detectIos(ua);
    }

    // Android
    if (this.isAndroid(ua)) {
      return this.detectAndroid(ua);
    }

    // Desktop
    return this.detectDesktop(ua);
  }

  /**
   * iOS: Safari and Chrome both use AR Quick Look (USDZ).
   */
  private detectIos(ua: string): PlatformDetectionResult {
    const _isSafari = ua.includes('safari') && !ua.includes('chrome');
    const _isChrome = ua.includes('crios') || ua.includes('chrome');
    const method: ARMethod = 'ar-quick-look';
    return {
      platform: 'ios',
      method,
      format: 'usdz',
      fallback: null,
      features: {
        planeDetection: true,
        lightEstimation: true,
        hitTest: true,
      },
    };
  }

  /**
   * Android: Chrome -> Scene Viewer (glTF) with WebXR fallback; Firefox -> WebXR (glTF).
   */
  private detectAndroid(ua: string): PlatformDetectionResult {
    const isChrome = ua.includes('chrome') || ua.includes('chromium');
    const isFirefox = ua.includes('firefox') || ua.includes('fxios');
    if (isChrome) {
      return {
        platform: 'android',
        method: 'scene-viewer',
        format: 'gltf',
        fallback: 'webxr',
        features: {
          planeDetection: true,
          lightEstimation: true,
          hitTest: true,
        },
      };
    }
    if (isFirefox) {
      return {
        platform: 'android',
        method: 'webxr',
        format: 'gltf',
        fallback: 'model-viewer',
        features: {
          planeDetection: true,
          lightEstimation: true,
          hitTest: true,
        },
      };
    }
    return {
      platform: 'android',
      method: 'scene-viewer',
      format: 'gltf',
      fallback: 'webxr',
      features: {
        planeDetection: true,
        lightEstimation: true,
        hitTest: true,
      },
    };
  }

  /**
   * Desktop: Chrome (WebXR for VR headsets) / Safari -> QR redirect to mobile.
   */
  private detectDesktop(ua: string): PlatformDetectionResult {
    const isChrome = ua.includes('chrome') && !ua.includes('edg');
    const _isSafari = ua.includes('safari') && !ua.includes('chrome');
    return {
      platform: 'desktop',
      method: 'qr-redirect',
      format: 'glb',
      fallback: isChrome ? 'webxr' : null,
      features: {
        planeDetection: true,
        lightEstimation: true,
        hitTest: true,
        anchors: true,
      },
    };
  }

  private isIos(ua: string): boolean {
    return (
      ua.includes('iphone') ||
      ua.includes('ipad') ||
      ua.includes('ipod') ||
      (ua.includes('mac') && ua.includes('mobile'))
    );
  }

  private isAndroid(ua: string): boolean {
    return ua.includes('android');
  }
}
