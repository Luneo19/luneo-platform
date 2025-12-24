/**
 * Overlay Renderer Utility
 * 
 * Utilitaire pour le rendu d'overlays sur vidéo/canvas
 * Utilisé par Virtual Try-On et autres composants de tracking
 */

import { logger } from '@/lib/logger';

export interface OverlayPoint {
  x: number;
  y: number;
  z?: number;
  confidence?: number;
}

export interface OverlayConfig {
  color?: string;
  lineWidth?: number;
  fill?: boolean;
  fillOpacity?: number;
  showPoints?: boolean;
  pointSize?: number;
}

/**
 * Dessine un overlay de lunettes sur le canvas
 */
export function drawGlassesOverlay(
  ctx: CanvasRenderingContext2D,
  facePoints: OverlayPoint[],
  config: OverlayConfig = {}
): void {
  try {
    const {
      color = '#3B82F6',
      lineWidth = 6,
      fill = true,
      fillOpacity = 0.2,
    } = config;

    if (!facePoints || facePoints.length < 468) {
      logger.warn('Insufficient face points for glasses overlay', { points: facePoints?.length });
      return;
    }

    // Points clés pour les lunettes (MediaPipe Face Mesh)
    const leftEyeTop = facePoints[159]; // Top of left eye
    const leftEyeBottom = facePoints[145]; // Bottom of left eye
    const rightEyeTop = facePoints[386]; // Top of right eye
    const rightEyeBottom = facePoints[374]; // Bottom of right eye
    const noseBridge = facePoints[168]; // Bridge of nose
    const leftTemple = facePoints[234]; // Left temple
    const rightTemple = facePoints[454]; // Right temple

    if (!leftEyeTop || !rightEyeTop || !noseBridge) {
      return;
    }

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Verre gauche
    const leftEyeWidth = Math.abs((facePoints[33]?.x || 0) - (facePoints[133]?.x || 0)) * 1.3;
    const leftEyeHeight = Math.abs((leftEyeTop.y || 0) - (leftEyeBottom.y || 0)) * 1.5;
    const leftEyeCenterX = (facePoints[33]?.x || 0) + (facePoints[133]?.x || 0) / 2;
    const leftEyeCenterY = (leftEyeTop.y || 0) + (leftEyeBottom.y || 0) / 2;

    ctx.beginPath();
    ctx.ellipse(
      leftEyeCenterX,
      leftEyeCenterY,
      leftEyeWidth / 2,
      leftEyeHeight / 2,
      0,
      0,
      2 * Math.PI
    );
    if (fill) {
      ctx.globalAlpha = fillOpacity;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.stroke();

    // Verre droit
    const rightEyeWidth = Math.abs((facePoints[362]?.x || 0) - (facePoints[263]?.x || 0)) * 1.3;
    const rightEyeHeight = Math.abs((rightEyeTop.y || 0) - (rightEyeBottom.y || 0)) * 1.5;
    const rightEyeCenterX = (facePoints[362]?.x || 0) + (facePoints[263]?.x || 0) / 2;
    const rightEyeCenterY = (rightEyeTop.y || 0) + (rightEyeBottom.y || 0) / 2;

    ctx.beginPath();
    ctx.ellipse(
      rightEyeCenterX,
      rightEyeCenterY,
      rightEyeWidth / 2,
      rightEyeHeight / 2,
      0,
      0,
      2 * Math.PI
    );
    if (fill) {
      ctx.globalAlpha = fillOpacity;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.stroke();

    // Pont nasal
    if (noseBridge) {
      ctx.beginPath();
      ctx.moveTo(leftEyeCenterX + leftEyeWidth / 2, leftEyeCenterY);
      ctx.lineTo(rightEyeCenterX - rightEyeWidth / 2, rightEyeCenterY);
      ctx.stroke();
    }

    // Branches (temples)
    if (leftTemple) {
      ctx.beginPath();
      ctx.moveTo(leftEyeCenterX - leftEyeWidth / 2, leftEyeCenterY);
      ctx.lineTo(leftTemple.x, leftTemple.y);
      ctx.stroke();
    }

    if (rightTemple) {
      ctx.beginPath();
      ctx.moveTo(rightEyeCenterX + rightEyeWidth / 2, rightEyeCenterY);
      ctx.lineTo(rightTemple.x, rightTemple.y);
      ctx.stroke();
    }

    ctx.restore();
  } catch (error) {
    logger.error('Error drawing glasses overlay', error as Error);
  }
}

/**
 * Dessine un overlay de montre sur le poignet
 */
export function drawWatchOverlay(
  ctx: CanvasRenderingContext2D,
  wristPoints: OverlayPoint[],
  config: OverlayConfig = {}
): void {
  try {
    const {
      color = '#FFD700',
      lineWidth = 4,
      fill = true,
      fillOpacity = 0.3,
    } = config;

    if (!wristPoints || wristPoints.length < 2) {
      return;
    }

    const wristCenter = wristPoints[0];
    const wristEnd = wristPoints[1] || wristPoints[0];

    if (!wristCenter) {
      return;
    }

    const width = Math.abs(wristEnd.x - wristCenter.x) || 60;
    const height = width * 0.6;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';

    // Cadran de montre
    ctx.beginPath();
    ctx.ellipse(
      wristCenter.x,
      wristCenter.y,
      width / 2,
      height / 2,
      0,
      0,
      2 * Math.PI
    );
    if (fill) {
      ctx.globalAlpha = fillOpacity;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.stroke();

    // Aiguilles (simplifiées)
    ctx.beginPath();
    ctx.moveTo(wristCenter.x, wristCenter.y);
    ctx.lineTo(wristCenter.x, wristCenter.y - height / 3);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(wristCenter.x, wristCenter.y);
    ctx.lineTo(wristCenter.x + width / 4, wristCenter.y);
    ctx.stroke();

    ctx.restore();
  } catch (error) {
    logger.error('Error drawing watch overlay', error as Error);
  }
}

/**
 * Dessine des points de tracking (debug)
 */
export function drawTrackingPoints(
  ctx: CanvasRenderingContext2D,
  points: OverlayPoint[],
  config: OverlayConfig = {}
): void {
  try {
    const {
      color = '#00FF00',
      pointSize = 2,
    } = config;

    if (!points || points.length === 0) {
      return;
    }

    ctx.save();
    ctx.fillStyle = color;

    points.forEach((point) => {
      if (point.confidence && point.confidence > 0.5) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, pointSize, 0, 2 * Math.PI);
        ctx.fill();
      }
    });

    ctx.restore();
  } catch (error) {
    logger.error('Error drawing tracking points', error as Error);
  }
}

/**
 * Nettoie le canvas avant de redessiner
 */
export function clearCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  try {
    ctx.clearRect(0, 0, width, height);
  } catch (error) {
    logger.error('Error clearing canvas', error as Error);
  }
}

