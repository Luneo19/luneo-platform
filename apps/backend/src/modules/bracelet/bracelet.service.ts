import { Injectable, Logger } from '@nestjs/common';
import { StorageService } from '@/libs/storage/storage.service';
import * as crypto from 'crypto';

// Material colors for bracelet backgrounds
const MATERIAL_COLORS: Record<string, { bg: string; border: string }> = {
  gold: { bg: '#FFD700', border: '#B8860B' },
  silver: { bg: '#C0C0C0', border: '#808080' },
  rose_gold: { bg: '#E8B4B8', border: '#B76E79' },
  platinum: { bg: '#E5E4E2', border: '#9CA3AF' },
  titanium: { bg: '#878681', border: '#5A5A58' },
  leather: { bg: '#8B4513', border: '#5D2E0C' },
  black: { bg: '#1A1A1A', border: '#000000' },
  white: { bg: '#FAFAFA', border: '#E5E5E5' },
};

@Injectable()
export class BraceletService {
  private readonly logger = new Logger(BraceletService.name);

  constructor(private readonly storageService: StorageService) {}

  /**
   * Génère une image PNG haute résolution du bracelet personnalisé
   * Utilise sharp pour le rendu réel côté serveur
   */
  async renderBracelet(body: {
    text: string;
    font: string;
    fontSize: number;
    alignment: string;
    position: string;
    color: string;
    material: string;
    width?: number;
    height?: number;
    format?: 'png' | 'jpg';
  }): Promise<{
    renderUrl: string;
    width: number;
    height: number;
    format: string;
    canvasData: Record<string, unknown>;
  }> {
    try {
      const width = body.width || 3840;
      const height = body.height || 2160;
      const format = body.format || 'png';

      this.logger.log('Bracelet render requested', { width, height, format, text: body.text });

      // Get material colors
      const materialKey = body.material?.toLowerCase().replace(/\s+/g, '_') || 'gold';
      const materialColors = MATERIAL_COLORS[materialKey] || MATERIAL_COLORS.gold;

      // Create canvas data for reference
      const canvasData = {
        width,
        height,
        text: body.text,
        font: body.font,
        fontSize: body.fontSize * (width / 1024),
        alignment: body.alignment,
        color: body.color,
        material: body.material,
      };

      // Generate unique render ID
      const renderId = `bracelet-${Date.now()}-${crypto.randomUUID().substring(0, 8)}`;

      // Generate the bracelet image using sharp with SVG overlay
      const renderBuffer = await this.generateBraceletImage(
        width,
        height,
        body.text,
        body.font,
        Math.round(body.fontSize * (width / 1024)),
        body.alignment,
        body.position,
        body.color,
        materialColors,
      );

      // Upload to storage
      const filename = `renders/bracelet/${renderId}.${format}`;
      const renderUrl = await this.storageService.uploadBuffer(renderBuffer, filename, {
        contentType: `image/${format}`,
        bucket: 'luneo-bracelet-renders',
      });

      this.logger.log('Bracelet render completed', { renderUrl, size: renderBuffer.length });

      return {
        renderUrl: renderUrl as string,
        width,
        height,
        format,
        canvasData,
      };
    } catch (error) {
      this.logger.error('Bracelet render failed', error);
      throw error;
    }
  }

  /**
   * Generate bracelet image using sharp with SVG text overlay
   */
  private async generateBraceletImage(
    width: number,
    height: number,
    text: string,
    font: string,
    fontSize: number,
    alignment: string,
    position: string,
    textColor: string,
    materialColors: { bg: string; border: string },
  ): Promise<Buffer> {
    // Dynamic import of sharp to avoid loading issues
    const sharp = (await import('sharp')).default;

    // Calculate bracelet dimensions (centered, occupying ~80% of width)
    const braceletWidth = Math.round(width * 0.8);
    const braceletHeight = Math.round(height * 0.15);
    const braceletX = Math.round((width - braceletWidth) / 2);
    const braceletY = Math.round((height - braceletHeight) / 2);
    const borderRadius = Math.round(braceletHeight / 4);
    const borderWidth = Math.max(4, Math.round(braceletHeight * 0.02));

    // Calculate text position based on alignment and position
    let textX = width / 2;
    let textAnchor = 'middle';
    if (alignment === 'left') {
      textX = braceletX + braceletWidth * 0.1;
      textAnchor = 'start';
    } else if (alignment === 'right') {
      textX = braceletX + braceletWidth * 0.9;
      textAnchor = 'end';
    }

    let textY = braceletY + braceletHeight / 2;
    if (position === 'top') {
      textY = braceletY + braceletHeight * 0.35;
    } else if (position === 'bottom') {
      textY = braceletY + braceletHeight * 0.65;
    }

    // Escape text for SVG
    const escapedText = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

    // Create SVG with bracelet shape and text
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="braceletGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:${materialColors.bg};stop-opacity:1" />
            <stop offset="50%" style="stop-color:${this.lightenColor(materialColors.bg, 20)};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${materialColors.bg};stop-opacity:1" />
          </linearGradient>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="8" flood-opacity="0.3"/>
          </filter>
        </defs>
        
        <!-- Background -->
        <rect width="100%" height="100%" fill="#f5f5f5"/>
        
        <!-- Bracelet body -->
        <rect 
          x="${braceletX}" 
          y="${braceletY}" 
          width="${braceletWidth}" 
          height="${braceletHeight}" 
          rx="${borderRadius}" 
          ry="${borderRadius}"
          fill="url(#braceletGradient)"
          stroke="${materialColors.border}"
          stroke-width="${borderWidth}"
          filter="url(#shadow)"
        />
        
        <!-- Text engraving -->
        <text 
          x="${textX}" 
          y="${textY}" 
          font-family="${font}, Arial, sans-serif" 
          font-size="${fontSize}px" 
          fill="${textColor}"
          text-anchor="${textAnchor}"
          dominant-baseline="middle"
          style="font-weight: 500;"
        >${escapedText}</text>
      </svg>
    `;

    // Convert SVG to PNG using sharp
    return sharp(Buffer.from(svg))
      .png({ quality: 100 })
      .toBuffer();
  }

  /**
   * Lighten a hex color by a percentage
   */
  private lightenColor(hex: string, percent: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
    const B = Math.min(255, (num & 0x0000ff) + amt);
    return `#${((1 << 24) | (R << 16) | (G << 8) | B).toString(16).slice(1)}`;
  }
}
