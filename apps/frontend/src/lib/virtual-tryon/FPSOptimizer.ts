import { logger } from '@/lib/logger';

export type QualityLevel = 'high' | 'medium' | 'low' | '2d_fallback';

interface FPSOptimizerConfig {
  /**
   * FPS threshold to downgrade quality.
   */
  highToMediumThreshold?: number;
  mediumToLowThreshold?: number;
  lowToFallbackThreshold?: number;
  /**
   * FPS threshold to upgrade quality.
   */
  upgradeThreshold?: number;
  /**
   * Number of samples before making a decision.
   */
  sampleWindow?: number;
  /**
   * Callback when quality changes.
   */
  onQualityChange?: (quality: QualityLevel) => void;
}

const DEFAULT_CONFIG: Required<Omit<FPSOptimizerConfig, 'onQualityChange'>> = {
  highToMediumThreshold: 24,
  mediumToLowThreshold: 18,
  lowToFallbackThreshold: 12,
  upgradeThreshold: 45,
  sampleWindow: 10,
};

/**
 * FPSOptimizer - Monitors FPS in real-time and dynamically adjusts rendering quality.
 *
 * Quality ladder:
 * - high (>= 30 FPS) : Full resolution, high model complexity
 * - medium (24-30 FPS) : Standard resolution, standard complexity
 * - low (15-24 FPS) : Reduced resolution, simplified models
 * - 2d_fallback (< 15 FPS) : Minimal rendering, image overlay mode
 */
export class FPSOptimizer {
  private config: Required<Omit<FPSOptimizerConfig, 'onQualityChange'>>;
  private onQualityChange: ((quality: QualityLevel) => void) | null;
  private currentQuality: QualityLevel = 'high';
  private fpsSamples: number[] = [];
  private upgradeTimer = 0;

  constructor(userConfig: FPSOptimizerConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...userConfig };
    this.onQualityChange = userConfig.onQualityChange || null;
  }

  /**
   * Record a new FPS sample. Called once per second by the engine.
   */
  recordFps(fps: number): void {
    this.fpsSamples.push(fps);

    // Keep only the window of samples
    if (this.fpsSamples.length > this.config.sampleWindow) {
      this.fpsSamples.shift();
    }

    // Need enough samples before deciding
    if (this.fpsSamples.length < Math.min(3, this.config.sampleWindow)) {
      return;
    }

    const avgFps = this.getAverageFps();
    this.evaluateQuality(avgFps);
  }

  /**
   * Get current quality level.
   */
  getQuality(): QualityLevel {
    return this.currentQuality;
  }

  /**
   * Get average FPS from recent samples.
   */
  getAverageFps(): number {
    if (this.fpsSamples.length === 0) return 60;
    const sum = this.fpsSamples.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.fpsSamples.length);
  }

  /**
   * Force a specific quality level (e.g., from user settings).
   */
  forceQuality(quality: QualityLevel): void {
    if (quality !== this.currentQuality) {
      this.currentQuality = quality;
      this.onQualityChange?.(quality);
      this.fpsSamples = []; // Reset samples
    }
  }

  /**
   * Reset optimizer state.
   */
  reset(): void {
    this.fpsSamples = [];
    this.currentQuality = 'high';
    this.upgradeTimer = 0;
  }

  private evaluateQuality(avgFps: number): void {
    const prev = this.currentQuality;

    // Downgrade checks (immediate)
    if (
      this.currentQuality === 'high' &&
      avgFps < this.config.highToMediumThreshold
    ) {
      this.currentQuality = 'medium';
    } else if (
      this.currentQuality === 'medium' &&
      avgFps < this.config.mediumToLowThreshold
    ) {
      this.currentQuality = 'low';
    } else if (
      this.currentQuality === 'low' &&
      avgFps < this.config.lowToFallbackThreshold
    ) {
      this.currentQuality = '2d_fallback';
    }

    // Upgrade checks (conservative -- need sustained good FPS)
    if (avgFps >= this.config.upgradeThreshold) {
      this.upgradeTimer++;
      if (this.upgradeTimer >= this.config.sampleWindow) {
        // Upgrade one step
        if (this.currentQuality === '2d_fallback') {
          this.currentQuality = 'low';
        } else if (this.currentQuality === 'low') {
          this.currentQuality = 'medium';
        } else if (this.currentQuality === 'medium') {
          this.currentQuality = 'high';
        }
        this.upgradeTimer = 0;
      }
    } else {
      this.upgradeTimer = 0;
    }

    // Notify on change
    if (prev !== this.currentQuality) {
      logger.info(`FPSOptimizer: quality changed ${prev} -> ${this.currentQuality} (avgFps=${avgFps})`);
      this.onQualityChange?.(this.currentQuality);
      this.fpsSamples = []; // Reset to reevaluate
    }
  }
}
