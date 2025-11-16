/**
 * @luneo/virtual-try-on
 * Virtual Try-On professionnel avec MediaPipe Face & Hand Tracking
 * 
 * @author Luneo Platform
 * @license MIT
 */

import { VirtualTryOn } from './core/VirtualTryOn';

// Core
export { VirtualTryOn } from './core/VirtualTryOn';
export { CameraManager } from './core/CameraManager';
export type { CameraState, CameraInfo } from './core/CameraManager';

// Tracking
export { FaceTracker, FACE_LANDMARKS_INDICES } from './tracking/FaceTracker';
export type { FaceTrackerConfig } from './tracking/FaceTracker';
export { HandTracker, HAND_LANDMARKS_INDICES } from './tracking/HandTracker';
export type { HandTrackerConfig } from './tracking/HandTracker';

// Utils
export { Logger } from './utils/Logger';
export type { LogLevel } from './utils/Logger';
export { ErrorHandler, ERROR_CODES } from './utils/ErrorHandler';
export type { ErrorCode } from './utils/ErrorHandler';
export { PerformanceMonitor } from './utils/PerformanceMonitor';
export type { PerformanceMonitorConfig } from './utils/PerformanceMonitor';

// Types
export type {
  VirtualTryOnConfig,
  VirtualTryOnState,
  VirtualTryOnEvents,
  ProductCategory,
  CameraOptions,
  RenderOptions,
  FaceTrackingResult,
  FaceLandmark,
  HandTrackingResult,
  HandLandmark,
  GlassesAnchorPoints,
  WatchAnchorPoints,
  PerformanceMetrics,
  ScreenshotOptions,
  ScreenshotResult,
  LoggerConfig,
  VirtualTryOnError,
} from './core/types';

/**
 * Version du package
 */
export const VERSION = '1.0.0';

/**
 * Helper: Créer une instance VirtualTryOn configurée
 */
export function createVirtualTryOn(config: {
  container: HTMLElement;
  category: 'glasses' | 'watch' | 'jewelry';
  model3dUrl: string;
  debug?: boolean;
}): VirtualTryOn {
  return new VirtualTryOn(config);
}

/**
 * Helper: Vérifier le support du navigateur
 */
export function checkBrowserSupport(): {
  supported: boolean;
  missing: string[];
  warnings: string[];
} {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check if in browser environment
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    missing.push('Browser environment required');
    return {
      supported: false,
      missing,
      warnings,
    };
  }

  // MediaDevices API
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    missing.push('MediaDevices API (camera access)');
  }

  // WebGL
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) {
    missing.push('WebGL (3D rendering)');
  }

  // Performance API
  if (!window.performance || !window.performance.now) {
    warnings.push('Performance API not fully supported');
  }

  // Request Animation Frame
  if (!window.requestAnimationFrame) {
    missing.push('RequestAnimationFrame');
  }

  return {
    supported: missing.length === 0,
    missing,
    warnings,
  };
}

/**
 * Helper: Log system info
 */
export function getSystemInfo(): {
  userAgent: string;
  platform: string;
  language: string;
  screen: { width: number; height: number };
  devicePixelRatio: number;
  memory?: number;
} {
  // Check if in browser environment
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      userAgent: '',
      platform: '',
      language: '',
      screen: { width: 0, height: 0 },
      devicePixelRatio: 1,
    };
  }

  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    screen: {
      width: window.screen.width,
      height: window.screen.height,
    },
    devicePixelRatio: window.devicePixelRatio || 1,
    memory: (navigator as any).deviceMemory,
  };
}

