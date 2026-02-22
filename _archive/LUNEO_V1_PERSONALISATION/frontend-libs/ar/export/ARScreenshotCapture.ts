/**
 * High-quality screenshot from AR canvas.
 * @module ar/export/ARScreenshotCapture
 */

import { logger } from '@/lib/logger';

export interface CaptureOptions {
  quality?: number;
  type?: string;
}

/**
 * Capture screenshot from AR canvas (toBlob with quality).
 */
export class ARScreenshotCapture {
  /**
   * Capture canvas to Blob with optional quality/type.
   */
  capture(canvas: HTMLCanvasElement, options?: CaptureOptions): Promise<Blob | null> {
    const quality = options?.quality ?? 0.92;
    const type = options?.type ?? 'image/png';
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => resolve(blob),
        type,
        quality
      );
    });
  }

  /**
   * Capture canvas with an overlay (e.g. UI) by drawing overlay on a temporary canvas.
   */
  async captureWithOverlay(
    canvas: HTMLCanvasElement,
    overlay: HTMLCanvasElement | HTMLImageElement,
    options?: CaptureOptions
  ): Promise<Blob | null> {
    const width = canvas.width;
    const height = canvas.height;
    const offscreen = document.createElement('canvas');
    offscreen.width = width;
    offscreen.height = height;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return this.capture(canvas, options);
    ctx.drawImage(canvas, 0, 0);
    ctx.drawImage(overlay, 0, 0, width, height);
    return this.capture(offscreen, options);
  }

  /**
   * Trigger download of screenshot Blob.
   */
  downloadScreenshot(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `ar-screenshot-${Date.now()}.png`;
    a.click();
    URL.revokeObjectURL(url);
    logger.debug('ARScreenshotCapture: download', { filename });
  }
}
