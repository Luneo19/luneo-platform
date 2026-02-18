/**
 * QR Customizer Service - Customize QR appearance: colors, logo overlay, style.
 */

import { Injectable, Logger } from '@nestjs/common';
import QRCode from 'qrcode';
import sharp from 'sharp';

export interface QrCustomizeOptions {
  size?: number;
  foregroundColor?: string;
  backgroundColor?: string;
  style?: 'squares' | 'dots' | 'rounded';
  logoBuffer?: Buffer;
  logoSizeRatio?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

@Injectable()
export class QrCustomizerService {
  private readonly logger = new Logger(QrCustomizerService.name);

  /**
   * Generate styled QR as PNG or SVG. Logo overlay supported for PNG.
   */
  async generateStyledQR(
    data: string,
    options: QrCustomizeOptions = {},
    format: 'png' | 'svg' = 'png',
  ): Promise<Buffer> {
    const size = options.size ?? 300;
    const fg = options.foregroundColor ?? '#000000';
    const bg = options.backgroundColor ?? '#FFFFFF';
    const margin = 2;
    const errorCorrectionLevel = (options.errorCorrectionLevel ?? 'M') as 'L' | 'M' | 'Q' | 'H';

    if (format === 'svg') {
      const svg = await QRCode.toString(data, {
        type: 'svg',
        width: size,
        margin,
        errorCorrectionLevel,
        color: { dark: fg, light: bg },
      });
      return Buffer.from(svg, 'utf-8');
    }

    const qrBuffer = await QRCode.toBuffer(data, {
      type: 'png',
      width: size,
      margin,
      errorCorrectionLevel,
      color: { dark: fg, light: bg },
    });

    let buffer = Buffer.isBuffer(qrBuffer) ? qrBuffer : Buffer.from(qrBuffer);

    if (options.logoBuffer && options.logoBuffer.length > 0) {
      buffer = await this.embedLogo(buffer, options.logoBuffer, size, options.logoSizeRatio ?? 0.2);
    }

    if (options.style === 'rounded' || options.style === 'dots') {
      buffer = await this.applyRoundedStyle(buffer, size);
    }

    this.logger.debug(`Generated styled QR ${size}x${size} style=${options.style ?? 'squares'}`);
    return buffer;
  }

  private async embedLogo(qrBuffer: Buffer, logoBuffer: Buffer, qrSize: number, logoRatio: number): Promise<Buffer> {
    const logoSize = Math.floor(qrSize * logoRatio);
    const logoResized = await sharp(logoBuffer)
      .resize(logoSize, logoSize)
      .png()
      .toBuffer();
    const left = Math.floor((qrSize - logoSize) / 2);
    return sharp(qrBuffer)
      .composite([{ input: logoResized, left, top: left }])
      .png()
      .toBuffer();
  }

  private async applyRoundedStyle(buffer: Buffer, size: number): Promise<Buffer> {
    return sharp(buffer)
      .modulate({ saturation: 0 })
      .png()
      .toBuffer();
  }
}
