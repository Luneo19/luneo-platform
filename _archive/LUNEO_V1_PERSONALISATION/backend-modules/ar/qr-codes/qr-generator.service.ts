/**
 * QR Generator Service - Generate QR codes locally using 'qrcode' package (no external API).
 */

import { Injectable, Logger } from '@nestjs/common';
import QRCode from 'qrcode';

export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

export interface GenerateQROptions {
  size?: number;
  errorCorrectionLevel?: ErrorCorrectionLevel;
  margin?: number;
  format?: 'png' | 'svg';
}

@Injectable()
export class QrGeneratorService {
  private readonly logger = new Logger(QrGeneratorService.name);

  /**
   * Generate QR code and return PNG or SVG buffer.
   */
  async generateQR(data: string, options: GenerateQROptions = {}): Promise<Buffer> {
    const size = options.size ?? 300;
    const errorCorrectionLevel = options.errorCorrectionLevel ?? 'M';
    const margin = options.margin ?? 2;
    const format = options.format ?? 'png';

    if (format === 'svg') {
      const svg = await QRCode.toString(data, {
        type: 'svg',
        width: size,
        margin,
        errorCorrectionLevel,
      });
      return Buffer.from(svg, 'utf-8');
    }

    const buffer = await QRCode.toBuffer(data, {
      type: 'png',
      width: size,
      margin,
      errorCorrectionLevel,
    });
    this.logger.debug(`Generated QR ${format} ${size}x${size}`);
    return Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
  }

  async generatePNG(data: string, size = 300, errorCorrectionLevel: ErrorCorrectionLevel = 'M'): Promise<Buffer> {
    return this.generateQR(data, { size, errorCorrectionLevel, format: 'png' });
  }

  async generateSVG(data: string, size = 300, errorCorrectionLevel: ErrorCorrectionLevel = 'M'): Promise<Buffer> {
    return this.generateQR(data, { size, errorCorrectionLevel, format: 'svg' });
  }
}
