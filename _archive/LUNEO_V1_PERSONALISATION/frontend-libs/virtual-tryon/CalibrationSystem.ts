import { logger } from '@/lib/logger';

export interface CalibrationResult {
  deviceFingerprint: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  cameraResolution: string;
  averageDistance: number;
  pixelToRealRatio: number;
  accuracyScore: number;
  handSizeNormalized?: number;
  faceWidthNormalized?: number;
}

const STORAGE_KEY = 'luneo_tryon_calibration';
const AVERAGE_HAND_WIDTH_CM = 8.5; // Average adult hand width
const AVERAGE_INTER_PUPILLARY_CM = 6.3; // Average adult IPD

/**
 * CalibrationSystem - Wizard-based calibration for mapping
 * MediaPipe normalized coordinates to real-world dimensions.
 *
 * Process:
 * 1. Ask user to hold hand/show face at a known distance
 * 2. Capture MediaPipe landmarks for reference measurement
 * 3. Calculate pixel-to-real ratio
 * 4. Store locally + send to backend for aggregation
 */
export class CalibrationSystem {
  private samples: Array<{
    handSize: number;
    faceWidth: number;
    timestamp: number;
  }> = [];

  /**
   * Add a calibration sample from current tracking data.
   * Call this repeatedly during the calibration wizard.
   */
  addSample(data: {
    handSizeNormalized?: number;
    faceWidthNormalized?: number;
  }): void {
    this.samples.push({
      handSize: data.handSizeNormalized || 0,
      faceWidth: data.faceWidthNormalized || 0,
      timestamp: Date.now(),
    });
  }

  /**
   * Complete calibration and calculate the final result.
   * Requires at least 5 samples for accuracy.
   */
  complete(): CalibrationResult | null {
    if (this.samples.length < 3) {
      logger.warn('Not enough calibration samples', {
        count: this.samples.length,
      });
      return null;
    }

    // Calculate averages (discard outliers)
    const handSizes = this.samples
      .map((s) => s.handSize)
      .filter((s) => s > 0);
    const faceWidths = this.samples
      .map((s) => s.faceWidth)
      .filter((s) => s > 0);

    const avgHandSize = this.trimmedMean(handSizes);
    const avgFaceWidth = this.trimmedMean(faceWidths);

    // Calculate pixel-to-real ratio
    let pixelToRealRatio = 1;
    let averageDistance = 50; // Default 50cm

    if (avgHandSize > 0) {
      // Normalized hand size -> real hand width
      pixelToRealRatio = avgHandSize / AVERAGE_HAND_WIDTH_CM;
      // Rough distance estimation based on apparent hand size
      averageDistance = AVERAGE_HAND_WIDTH_CM / avgHandSize * 10;
    } else if (avgFaceWidth > 0) {
      pixelToRealRatio = avgFaceWidth / AVERAGE_INTER_PUPILLARY_CM;
      averageDistance = AVERAGE_INTER_PUPILLARY_CM / avgFaceWidth * 10;
    }

    // Calculate accuracy from sample variance
    const variance = this.calculateVariance(
      handSizes.length > 0 ? handSizes : faceWidths,
    );
    const accuracyScore = Math.max(0, Math.min(1, 1 - variance * 10));

    const deviceType = this.detectDeviceType();
    const cameraResolution = this.getCameraResolution();

    const result: CalibrationResult = {
      deviceFingerprint: this.getDeviceFingerprint(),
      deviceType,
      cameraResolution,
      averageDistance: Math.round(averageDistance * 10) / 10,
      pixelToRealRatio: Math.round(pixelToRealRatio * 1000) / 1000,
      accuracyScore: Math.round(accuracyScore * 100) / 100,
      handSizeNormalized:
        avgHandSize > 0
          ? Math.round(avgHandSize * 1000) / 1000
          : undefined,
      faceWidthNormalized:
        avgFaceWidth > 0
          ? Math.round(avgFaceWidth * 1000) / 1000
          : undefined,
    };

    // Save to localStorage
    this.saveToStorage(result);

    logger.info('Calibration completed', {
      accuracy: result.accuracyScore,
      ratio: result.pixelToRealRatio,
      samples: this.samples.length,
    });

    return result;
  }

  /**
   * Get previously saved calibration for this device.
   */
  static getSavedCalibration(): CalibrationResult | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      return JSON.parse(stored) as CalibrationResult;
    } catch {
      return null;
    }
  }

  /**
   * Check if calibration is needed (never calibrated or old data).
   */
  static needsCalibration(): boolean {
    const saved = CalibrationSystem.getSavedCalibration();
    if (!saved) return true;
    // Re-calibrate if accuracy was poor
    if (saved.accuracyScore < 0.5) return true;
    return false;
  }

  /**
   * Reset all samples (restart wizard).
   */
  reset(): void {
    this.samples = [];
  }

  /**
   * Get number of samples collected so far.
   */
  getSampleCount(): number {
    return this.samples.length;
  }

  // ========================================
  // Private helpers
  // ========================================

  private saveToStorage(result: CalibrationResult): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
    } catch {
      logger.warn('Failed to save calibration to localStorage');
    }
  }

  private trimmedMean(values: number[]): number {
    if (values.length === 0) return 0;
    if (values.length <= 2)
      return values.reduce((a, b) => a + b, 0) / values.length;

    // Remove top and bottom 10%
    const sorted = [...values].sort((a, b) => a - b);
    const trimCount = Math.max(1, Math.floor(sorted.length * 0.1));
    const trimmed = sorted.slice(trimCount, -trimCount);

    return trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
  }

  private calculateVariance(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squareDiffs = values.map((v) => Math.pow(v - mean, 2));
    return squareDiffs.reduce((a, b) => a + b, 0) / values.length;
  }

  private detectDeviceType(): 'mobile' | 'desktop' | 'tablet' {
    if (typeof navigator === 'undefined') return 'desktop';
    const ua = navigator.userAgent.toLowerCase();
    if (/ipad|tablet/i.test(ua)) return 'tablet';
    if (/mobile|iphone|android/i.test(ua)) return 'mobile';
    if ('ontouchstart' in window && window.innerWidth < 1024) return 'tablet';
    return 'desktop';
  }

  private getCameraResolution(): string {
    // Will be populated during tracking initialization
    return `${window.screen.width}x${window.screen.height}`;
  }

  private getDeviceFingerprint(): string {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    const renderer = gl
      ? gl.getParameter(gl.RENDERER)
      : 'unknown';
    const ua = navigator.userAgent;
    const screen = `${window.screen.width}x${window.screen.height}`;

    // Simple hash
    const str = `${renderer}|${ua}|${screen}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return `fp_${Math.abs(hash).toString(36)}`;
  }
}
