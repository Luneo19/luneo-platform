/**
 * Canvas Operations Utility
 * 
 * Utilitaire pour les opérations sur canvas (Konva.js, HTML5 Canvas)
 * Utilisé par Visual Customizer et autres composants canvas
 */

import { logger } from '@/lib/logger';
import Konva from 'konva';

export interface CanvasElement {
  id: string;
  type: 'text' | 'image' | 'shape';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  content?: string;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  shapeType?: string;
  imageUrl?: string;
}

/**
 * Exporte un stage Konva en image
 */
export async function exportKonvaStage(
  stage: Konva.Stage,
  format: 'png' | 'jpg' | 'svg' = 'png',
  quality: number = 1.0
): Promise<Blob> {
  try {
    let dataURL: string;

    switch (format) {
      case 'png':
        dataURL = stage.toDataURL({ pixelRatio: 2, quality });
        break;
      case 'jpg':
        dataURL = stage.toDataURL({ pixelRatio: 2, quality, mimeType: 'image/jpeg' });
        break;
      case 'svg':
        dataURL = stage.toSVG();
        // Convertir SVG en blob
        return new Blob([dataURL], { type: 'image/svg+xml' });
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    // Convertir dataURL en Blob
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          format === 'jpg' ? 'image/jpeg' : 'image/png',
          quality
        );
      };
      img.onerror = (error) => {
        logger.error('Error loading image for export', error as Error);
        reject(error);
      };
      img.src = dataURL;
    });
  } catch (error) {
    logger.error('Error exporting Konva stage', error as Error);
    throw error;
  }
}

/**
 * Exporte un canvas HTML5 en image
 */
export async function exportHTMLCanvas(
  canvas: HTMLCanvasElement,
  format: 'png' | 'jpg' = 'png',
  quality: number = 1.0
): Promise<Blob> {
  try {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        format === 'jpg' ? 'image/jpeg' : 'image/png',
        quality
      );
    });
  } catch (error) {
    logger.error('Error exporting HTML canvas', error as Error);
    throw error;
  }
}

/**
 * Duplique un élément canvas
 */
export function duplicateCanvasElement(element: CanvasElement): CanvasElement {
  try {
    return {
      ...element,
      id: `${element.id}-copy-${Date.now()}`,
      x: element.x + 20,
      y: element.y + 20,
    };
  } catch (error) {
    logger.error('Error duplicating canvas element', error as Error);
    throw error;
  }
}

/**
 * Aligne des éléments sur une grille
 */
export function snapToGrid(
  x: number,
  y: number,
  gridSize: number = 10
): { x: number; y: number } {
  try {
    return {
      x: Math.round(x / gridSize) * gridSize,
      y: Math.round(y / gridSize) * gridSize,
    };
  } catch (error) {
    logger.error('Error snapping to grid', error as Error);
    return { x, y };
  }
}

/**
 * Calcule les limites d'un groupe d'éléments
 */
export function calculateBounds(elements: CanvasElement[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
} {
  try {
    if (elements.length === 0) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    elements.forEach((element) => {
      const left = element.x;
      const top = element.y;
      const right = element.x + element.width;
      const bottom = element.y + element.height;

      minX = Math.min(minX, left);
      minY = Math.min(minY, top);
      maxX = Math.max(maxX, right);
      maxY = Math.max(maxY, bottom);
    });

    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
    };
  } catch (error) {
    logger.error('Error calculating bounds', error as Error);
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }
}

/**
 * Nettoie un stage Konva
 */
export function disposeKonvaStage(stage: Konva.Stage): void {
  try {
    stage.destroy();
  } catch (error) {
    logger.error('Error disposing Konva stage', error as Error);
  }
}

/**
 * Télécharge un blob avec un nom de fichier
 */
export function downloadBlob(blob: Blob, filename: string): void {
  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Nettoyer l'URL après un délai
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);
  } catch (error) {
    logger.error('Error downloading blob', error as Error);
    throw error;
  }
}

