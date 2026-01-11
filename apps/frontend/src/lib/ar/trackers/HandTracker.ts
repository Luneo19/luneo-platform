/**
 * @fileoverview Hand Tracker utilisant MediaPipe Hands
 * @module HandTracker
 *
 * Détecte 21 points de repère sur la main pour :
 * - Bagues
 * - Bracelets
 * - Montres
 *
 * RÈGLES RESPECTÉES:
 * - ✅ Types explicites
 * - ✅ Gestion d'erreurs
 * - ✅ Cleanup des ressources
 */

import type { TrackingData } from '../AREngine';

// ============================================================================
// TYPES
// ============================================================================

interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

// Indices des landmarks de la main
export const HAND_LANDMARKS = {
  WRIST: 0,
  THUMB_CMC: 1,
  THUMB_MCP: 2,
  THUMB_IP: 3,
  THUMB_TIP: 4,
  INDEX_MCP: 5,
  INDEX_PIP: 6,
  INDEX_DIP: 7,
  INDEX_TIP: 8,
  MIDDLE_MCP: 9,
  MIDDLE_PIP: 10,
  MIDDLE_DIP: 11,
  MIDDLE_TIP: 12,
  RING_MCP: 13,
  RING_PIP: 14,
  RING_DIP: 15,
  RING_TIP: 16,
  PINKY_MCP: 17,
  PINKY_PIP: 18,
  PINKY_DIP: 19,
  PINKY_TIP: 20,
} as const;

// ============================================================================
// HAND TRACKER CLASS
// ============================================================================

export class HandTracker {
  private hands: unknown = null; // MediaPipe Hands
  private isInitialized = false;

  /**
   * Initialise MediaPipe Hands
   */
  async initialize(): Promise<void> {
    try {
      // TODO: Implémenter MediaPipe Hands
      this.isInitialized = true;
      console.log('[HandTracker] Initialized (simulated)');
    } catch (error) {
      console.error('[HandTracker] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Détecte les landmarks de la main
   */
  async detect(videoElement: HTMLVideoElement): Promise<TrackingData | null> {
    if (!this.isInitialized) {
      return null;
    }

    // TODO: Implémenter la détection réelle
    return null;
  }

  /**
   * Calcule le bounding box de la main
   */
  private calculateBoundingBox(landmarks: HandLandmark[]): TrackingData['boundingBox'] {
    let minX = 1, maxX = 0, minY = 1, maxY = 0;

    landmarks.forEach((lm) => {
      minX = Math.min(minX, lm.x);
      maxX = Math.max(maxX, lm.x);
      minY = Math.min(minY, lm.y);
      maxY = Math.max(maxY, lm.y);
    });

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  }

  /**
   * Obtient la position pour une bague sur un doigt spécifique
   */
  getRingPosition(
    landmarks: number[][],
    finger: 'index' | 'middle' | 'ring' | 'pinky' = 'ring'
  ): {
    position: number[];
    rotation: number;
    scale: number;
  } {
    const fingerIndices = {
      index: { base: HAND_LANDMARKS.INDEX_MCP, middle: HAND_LANDMARKS.INDEX_PIP },
      middle: { base: HAND_LANDMARKS.MIDDLE_MCP, middle: HAND_LANDMARKS.MIDDLE_PIP },
      ring: { base: HAND_LANDMARKS.RING_MCP, middle: HAND_LANDMARKS.RING_PIP },
      pinky: { base: HAND_LANDMARKS.PINKY_MCP, middle: HAND_LANDMARKS.PINKY_PIP },
    };

    const { base, middle } = fingerIndices[finger];
    const basePoint = landmarks[base];
    const middlePoint = landmarks[middle];

    if (!basePoint || !middlePoint) {
      return { position: [0, 0, 0], rotation: 0, scale: 1 };
    }

    // Position au milieu entre la base et le milieu du doigt
    const position = [
      (basePoint[0] + middlePoint[0]) / 2,
      (basePoint[1] + middlePoint[1]) / 2,
      (basePoint[2] + middlePoint[2]) / 2,
    ];

    // Rotation basée sur l'orientation du doigt
    const rotation = Math.atan2(
      middlePoint[1] - basePoint[1],
      middlePoint[0] - basePoint[0]
    );

    // Scale basé sur la largeur du doigt
    const fingerWidth = Math.sqrt(
      Math.pow(middlePoint[0] - basePoint[0], 2) +
      Math.pow(middlePoint[1] - basePoint[1], 2)
    );
    const scale = fingerWidth * 0.3;

    return { position, rotation, scale };
  }

  /**
   * Nettoie les ressources
   */
  dispose(): void {
    if (this.hands) {
      // Cleanup MediaPipe
      this.hands = null;
    }
    this.isInitialized = false;
    console.log('[HandTracker] Disposed');
  }
}
