/**
 * ★★★ UTILS - AR ★★★
 * Utilitaires pour la réalité augmentée
 * - Détection support WebXR
 * - Helpers placement
 * - Device detection
 * - Analytics helpers
 */

import { logger } from '@/lib/logger';

// ========================================
// TYPES
// ========================================

export interface ARDeviceInfo {
  userAgent: string;
  platform: string;
  isMobile: boolean;
  isARSupported: boolean;
  browser: 'safari' | 'chrome' | 'firefox' | 'edge' | 'unknown';
  os: 'ios' | 'android' | 'windows' | 'macos' | 'unknown';
}

export interface ARPlacement {
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
}

// ========================================
// DETECTION SUPPORT
// ========================================

/**
 * Détecte le support WebXR
 */
export async function detectWebXRSupport(): Promise<boolean> {
  if (typeof window === 'undefined') {
    return false;
  }

  if (!('xr' in navigator)) {
    return false;
  }

  try {
    const nav = navigator as Navigator & { xr?: { isSessionSupported: (mode: string) => Promise<boolean> } };
    const xr = nav.xr;
    if (!xr) return false;
    const supported = await xr.isSessionSupported('immersive-ar');
    return supported;
  } catch (error) {
    logger.error('Error detecting WebXR support', { error });
    return false;
  }
}

/**
 * Détecte les informations de l'appareil
 */
export function detectDeviceInfo(): ARDeviceInfo {
  if (typeof window === 'undefined') {
    return {
      userAgent: '',
      platform: '',
      isMobile: false,
      isARSupported: false,
      browser: 'unknown',
      os: 'unknown',
    };
  }

  const userAgent = navigator.userAgent;
  const platform = navigator.platform;

  // Détection OS
  let os: ARDeviceInfo['os'] = 'unknown';
  if (/iPad|iPhone|iPod/.test(userAgent)) {
    os = 'ios';
  } else if (/Android/.test(userAgent)) {
    os = 'android';
  } else if (/Win/.test(platform)) {
    os = 'windows';
  } else if (/Mac/.test(platform)) {
    os = 'macos';
  }

  // Détection navigateur
  let browser: ARDeviceInfo['browser'] = 'unknown';
  if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) {
    browser = 'safari';
  } else if (/Chrome/.test(userAgent)) {
    browser = 'chrome';
  } else if (/Firefox/.test(userAgent)) {
    browser = 'firefox';
  } else if (/Edge/.test(userAgent)) {
    browser = 'edge';
  }

  // Détection mobile
  const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);

  // Support AR basique (iOS Safari ou Android Chrome)
  const isARSupported = (os === 'ios' && browser === 'safari') || (os === 'android' && browser === 'chrome');

  return {
    userAgent,
    platform,
    isMobile,
    isARSupported,
    browser,
    os,
  };
}

// ========================================
// PLACEMENT
// ========================================

/**
 * Calcule le placement pour un type de produit
 */
export function calculatePlacement(
  productType: 'glasses' | 'jewelry' | 'watch' | 'ring' | 'earrings' | 'necklace',
  _landmarks?: Record<string, unknown>
): ARPlacement {
  const defaultPlacement: ARPlacement = {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
  };

  switch (productType) {
    case 'glasses':
      // Placement sur le nez
      return {
        position: { x: 0, y: 0.1, z: -0.3 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 0.15, y: 0.15, z: 0.15 },
      };

    case 'earrings':
      // Placement sur les oreilles
      return {
        position: { x: 0.08, y: 0, z: -0.2 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 0.08, y: 0.08, z: 0.08 },
      };

    case 'necklace':
      // Placement autour du cou
      return {
        position: { x: 0, y: -0.1, z: -0.2 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 0.2, y: 0.2, z: 0.2 },
      };

    case 'watch':
    case 'ring':
      // Placement sur le poignet/doigt
      return {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 0.1, y: 0.1, z: 0.1 },
      };

    default:
      return defaultPlacement;
  }
}

/**
 * Normalise les coordonnées de placement
 */
export function normalizePlacement(placement: ARPlacement): ARPlacement {
  return {
    position: {
      x: Math.max(-1, Math.min(1, placement.position.x)),
      y: Math.max(-1, Math.min(1, placement.position.y)),
      z: Math.max(-2, Math.min(2, placement.position.z)),
    },
    rotation: {
      x: placement.rotation.x % (Math.PI * 2),
      y: placement.rotation.y % (Math.PI * 2),
      z: placement.rotation.z % (Math.PI * 2),
    },
    scale: {
      x: Math.max(0.01, Math.min(2, placement.scale.x)),
      y: Math.max(0.01, Math.min(2, placement.scale.y)),
      z: Math.max(0.01, Math.min(2, placement.scale.z)),
    },
  };
}

// ========================================
// ANALYTICS
// ========================================

/**
 * Génère un ID de session AR unique
 */
export function generateARSessionId(): string {
  return `ar-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calcule la durée d'une session AR
 */
export function calculateSessionDuration(startTime: Date, endTime: Date): number {
  return Math.round((endTime.getTime() - startTime.getTime()) / 1000); // en secondes
}

// ========================================
// EXPORT
// ========================================

export const arUtils = {
  detectWebXRSupport,
  detectDeviceInfo,
  calculatePlacement,
  normalizePlacement,
  generateARSessionId,
  calculateSessionDuration,
};

