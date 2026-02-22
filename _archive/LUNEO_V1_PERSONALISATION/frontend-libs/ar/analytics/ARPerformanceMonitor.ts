/**
 * Monitor AR performance: FPS, memory, battery; report to backend.
 * @module ar/analytics/ARPerformanceMonitor
 */

import { logger } from '@/lib/logger';

export interface ARPerformanceMetrics {
  fps: number;
  frameTimeMs: number;
  memoryMB?: number;
  batteryLevel?: number;
  timestamp: number;
}

const DEFAULT_BASE = '';

/**
 * Monitors FPS, memory, and optionally battery; can report to backend.
 */
export class ARPerformanceMonitor {
  private baseUrl: string = DEFAULT_BASE;
  private frameTimes: number[] = [];
  private lastTime = 0;
  private rafId: number | null = null;
  private running = false;

  /**
   * Start monitoring (e.g. in XR frame loop or requestAnimationFrame).
   */
  startMonitoring(): void {
    this.running = true;
    this.frameTimes = [];
    this.lastTime = performance.now();
    const tick = (): void => {
      if (!this.running) return;
      const now = performance.now();
      this.frameTimes.push(now - this.lastTime);
      this.lastTime = now;
      if (this.frameTimes.length > 60) this.frameTimes.shift();
      this.rafId = requestAnimationFrame(tick);
    };
    tick();
    logger.debug('ARPerformanceMonitor: started');
  }

  /**
   * Stop monitoring.
   */
  stopMonitoring(): void {
    this.running = false;
    if (this.rafId != null) cancelAnimationFrame(this.rafId);
    this.rafId = null;
  }

  /**
   * Get current metrics (FPS, frame time, memory if available).
   */
  getMetrics(): ARPerformanceMetrics {
    const now = performance.now();
    const recent = this.frameTimes.slice(-30);
    const avgFrameTime = recent.length ? recent.reduce((a, b) => a + b, 0) / recent.length : 0;
    const fps = avgFrameTime > 0 ? 1000 / avgFrameTime : 0;
    const memoryMB = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize
      ? (performance as Performance & { memory: { usedJSHeapSize: number } }).memory.usedJSHeapSize / (1024 * 1024)
      : undefined;
    let batteryLevel: number | undefined;
    if (typeof navigator !== 'undefined' && (navigator as Navigator & { getBattery?: () => Promise<{ level: number }> }).getBattery) {
      (navigator as Navigator & { getBattery(): Promise<{ level: number }> }).getBattery().then((b) => { batteryLevel = b.level; }).catch(() => {});
    }
    return {
      fps: Math.round(fps * 10) / 10,
      frameTimeMs: Math.round(avgFrameTime * 100) / 100,
      memoryMB: memoryMB != null ? Math.round(memoryMB * 100) / 100 : undefined,
      batteryLevel,
      timestamp: now,
    };
  }

  /**
   * Send current metrics to backend for session.
   */
  async reportMetrics(sessionId: string): Promise<void> {
    const metrics = this.getMetrics();
    try {
      await fetch(`${this.baseUrl}/api/v1/ar/session/metrics`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, metrics }),
      });
    } catch (err) {
      logger.warn('ARPerformanceMonitor: reportMetrics failed', { error: String(err) });
    }
  }

  setBaseUrl(url: string): void {
    this.baseUrl = url.replace(/\/$/, '');
  }
}
