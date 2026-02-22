/**
 * Texture Generator Utility
 * 
 * Génère des textures haute qualité pour la gravure de bracelet
 * Optimisé pour performance et qualité
 * 
 * @author Luneo Platform
 * @version 2.0.0
 */

import { logger } from '@/lib/logger';

export interface TextureOptions {
  text: string;
  font: string;
  fontSize: number;
  alignment: 'left' | 'center' | 'right';
  position: string;
  color: string;
  material: string;
  width?: number;
  height?: number;
  quality?: number; // 0-1
}

/**
 * Generate high-quality texture for bracelet engraving
 */
export function generateBraceletTexture(options: TextureOptions): string {
  const {
    text,
    font,
    fontSize,
    alignment,
    color,
    width = 1024,
    height = 256,
    quality = 1.0,
  } = options;

  try {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d', { 
      alpha: false,
      desynchronized: true, // Performance optimization
    });
    
    if (!ctx) {
      logger.warn('Canvas 2D context not available');
      return '';
    }

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw bracelet band with gradient for 3D effect
    const bandY = height * 0.25;
    const bandHeight = height * 0.5;

    // Main band gradient
    const bandGradient = ctx.createLinearGradient(0, bandY, 0, bandY + bandHeight);
    bandGradient.addColorStop(0, adjustBrightness(color, 10));
    bandGradient.addColorStop(0.5, color);
    bandGradient.addColorStop(1, adjustBrightness(color, -20));
    ctx.fillStyle = bandGradient;
    ctx.fillRect(0, bandY, width, bandHeight);

    // Highlight for 3D effect
    const highlightGradient = ctx.createLinearGradient(0, bandY, 0, bandY + bandHeight / 2);
    highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
    highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = highlightGradient;
    ctx.fillRect(0, bandY, width, bandHeight / 2);

    // Shadow for depth
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, bandY + bandHeight, width, 5);

    // Set text style
    ctx.fillStyle = '#222222';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${fontSize}px ${font}, sans-serif`;
    // textRenderingOptimization is not a standard Canvas API property

    // Calculate text position based on alignment
    let textX = width / 2;
    if (alignment === 'left') {
      ctx.textAlign = 'left';
      textX = width * 0.1;
    } else if (alignment === 'right') {
      ctx.textAlign = 'right';
      textX = width * 0.9;
    } else {
      ctx.textAlign = 'center';
    }

    // Add text shadow for depth
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 2;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;

    // Draw text
    ctx.fillText(text, textX, height / 2);

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Export with quality setting
    return canvas.toDataURL('image/png', quality);
  } catch (error) {
    logger.error('Error generating bracelet texture', { error, options });
    return '';
  }
}

/**
 * Adjust color brightness
 */
function adjustBrightness(color: string, amount: number): string {
  try {
    const hex = color.replace('#', '');
    const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
    const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
    const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  } catch (error) {
    logger.error('Error adjusting brightness', { error, color, amount });
    return color;
  }
}

/**
 * Generate high-resolution texture for export (4K)
 */
export function generateHighResTexture(options: TextureOptions): string {
  return generateBraceletTexture({
    ...options,
    width: 3840,
    height: 960,
    quality: 1.0,
  });
}

