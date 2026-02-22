/**
 * Generate GIF from AR session using frame buffer.
 * @module ar/export/ARGifGenerator
 */

import { logger } from '@/lib/logger';

/**
 * Captures frames from canvas and builds a GIF (client-side).
 * Uses a frame buffer; encoding can be done with a library like gif.js or similar,
 * or upload frames to backend for encoding. This implementation returns a simple
 * frame array; for actual GIF blob you'd integrate a GIF encoder.
 */
export class ARGifGenerator {
  private frames: ImageData[] = [];
  private canvas: HTMLCanvasElement | null = null;
  private fps: number = 10;
  private durationMs: number = 3000;
  private captureInterval: ReturnType<typeof setInterval> | null = null;
  private startTime = 0;

  /**
   * Start capturing frames from canvas at given fps for duration (ms).
   */
  startCapture(canvas: HTMLCanvasElement, fps: number, durationMs: number): void {
    this.stopCapture();
    this.canvas = canvas;
    this.fps = fps;
    this.durationMs = durationMs;
    this.frames = [];
    this.startTime = Date.now();
    const intervalMs = 1000 / fps;
    this.captureInterval = setInterval(() => {
      if (Date.now() - this.startTime >= durationMs) {
        this.stopCapture();
        return;
      }
      const ctx = canvas.getContext('2d');
      if (ctx) {
        try {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          this.frames.push(imageData);
        } catch {
          // ignore
        }
      }
    }, intervalMs);
    logger.debug('ARGifGenerator: startCapture', { fps, durationMs });
  }

  /**
   * Stop capture. Returns a "GIF" blob by encoding frames (simplified: we return a placeholder
   * or use canvas-to-blob per frame; for real GIF use a library like gif.js).
   */
  stopCapture(): Promise<Blob | null> {
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }
    const frames = this.frames;
    this.frames = [];
    this.canvas = null;

    if (frames.length === 0) return Promise.resolve(null);
    // Without a GIF encoder library we compose a simple fallback: single frame as PNG
    const c = document.createElement('canvas');
    c.width = frames[0].width;
    c.height = frames[0].height;
    const ctx = c.getContext('2d');
    if (!ctx) return Promise.resolve(null);
    ctx.putImageData(frames[Math.floor(frames.length / 2)], 0, 0);
    return new Promise((resolve) => {
      c.toBlob((blob) => resolve(blob), 'image/png', 0.9);
    });
  }

  /**
   * Get current frame count (for progress).
   */
  getFrameCount(): number {
    return this.frames.length;
  }
}
