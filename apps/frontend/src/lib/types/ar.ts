/**
 * ★★★ TYPES - AR ★★★
 * Types TypeScript complets pour la réalité augmentée
 * - Types sessions
 * - Types interactions
 * - Types device
 * - Types analytics
 */

// ========================================
// ENUMS
// ========================================

export enum ARInteractionType {
  SESSION_START = 'session_start',
  SESSION_END = 'session_end',
  MODEL_LOADED = 'model_loaded',
  MODEL_ERROR = 'model_error',
  PLACEMENT_SUCCESS = 'placement_success',
  PLACEMENT_FAILED = 'placement_failed',
  SCREENSHOT = 'screenshot',
  SHARE = 'share',
}

export enum ARProductType {
  GLASSES = 'glasses',
  JEWELRY = 'jewelry',
  WATCH = 'watch',
  RING = 'ring',
  EARRINGS = 'earrings',
  NECKLACE = 'necklace',
}

export enum ARBrowser {
  SAFARI = 'safari',
  CHROME = 'chrome',
  FIREFOX = 'firefox',
  EDGE = 'edge',
  UNKNOWN = 'unknown',
}

export enum AROperatingSystem {
  IOS = 'ios',
  ANDROID = 'android',
  WINDOWS = 'windows',
  MACOS = 'macos',
  UNKNOWN = 'unknown',
}

// ========================================
// TYPES DE BASE
// ========================================

export interface ARDeviceInfo {
  userAgent: string;
  platform: string;
  isMobile: boolean;
  isARSupported: boolean;
  browser: ARBrowser;
  os: AROperatingSystem;
}

export interface ARPlacement {
  position: {
    x: number;
    y: number;
    z: number;
  };
  rotation: {
    x: number;
    y: number;
    z: number;
  };
  scale: {
    x: number;
    y: number;
    z: number;
  };
}

export interface ARSession {
  sessionId: string;
  productId: string;
  customizationId?: string;
  modelUrl: string;
  productType: ARProductType;
  deviceInfo?: ARDeviceInfo;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  interactions: number;
}

// ========================================
// TYPES API
// ========================================

export interface CreateARSessionRequest {
  productId: string;
  customizationId?: string;
  modelUrl: string;
  productType: ARProductType;
  deviceInfo?: ARDeviceInfo;
}

export interface CreateARSessionResponse {
  sessionId: string;
  productId: string;
  modelUrl: string;
  productType: ARProductType;
  createdAt: Date;
}

export interface ARInteractionRequest {
  sessionId: string;
  type: ARInteractionType;
  metadata?: Record<string, any>;
}

export interface ARSupportCheckResponse {
  isARSupported: boolean;
  platform: string;
  browser: string;
  recommendations: string[];
}

export interface ARAnalytics {
  totalSessions: number;
  averageSessionDuration: number;
  mostUsedDevice: string;
  successRate: number;
}

export interface ARAnalyticsRequest {
  productId: string;
  startDate?: Date;
  endDate?: Date;
}

// ========================================
// TYPES UI
// ========================================

export interface ARViewerState {
  isInitializing: boolean;
  isARSessionActive: boolean;
  sessionId: string | null;
  error: string | null;
  modelUrl: string | null;
  productType: ARProductType;
}

export interface ARButtonState {
  supportStatus: 'checking' | 'supported' | 'not-supported' | 'error';
  isLaunching: boolean;
  errorMessage: string | null;
}

// ========================================
// TYPES UTILITAIRES
// ========================================

export interface ARLandmarks {
  face?: {
    noseBridge: { x: number; y: number; z: number };
    leftEar: { x: number; y: number; z: number };
    rightEar: { x: number; y: number; z: number };
    chin: { x: number; y: number; z: number };
    forehead: { x: number; y: number; z: number };
    rotation: { pitch: number; yaw: number; roll: number };
  };
  hand?: {
    wrist: { x: number; y: number; z: number };
    fingers: Array<{ x: number; y: number; z: number }>;
  };
}

export interface ARConfiguration {
  enableFaceTracking: boolean;
  enableHandTracking: boolean;
  enableHitTest: boolean;
  enableLightEstimation: boolean;
  preferredFPS: 30 | 60 | 90;
}

// ========================================

