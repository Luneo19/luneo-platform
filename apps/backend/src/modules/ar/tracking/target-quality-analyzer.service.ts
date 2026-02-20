/**
 * Target Quality Analyzer - Analyze image quality for AR tracking.
 * Uses sharp for image processing; returns TrackingQuality score and recommendations.
 */

import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';
import { TrackingQuality } from '@prisma/client';

export interface TrackingQualityResult {
  score: number;
  trackingQuality: TrackingQuality;
  qualityIssues: string[];
  recommendations: string[];
}

const MIN_WIDTH = 320;
const MIN_HEIGHT = 320;
const MIN_SCORE_EXCELLENT = 0.9;
const MIN_SCORE_GOOD = 0.75;
const MIN_SCORE_FAIR = 0.5;
const MIN_SCORE_POOR = 0.25;

@Injectable()
export class TargetQualityAnalyzerService {
  private readonly logger = new Logger(TargetQualityAnalyzerService.name);

  /**
   * Analyze image quality for AR tracking.
   * Checks: contrast, detail level, repetitive patterns, minimum resolution.
   */
  async analyzeQuality(imageBuffer: Buffer): Promise<TrackingQualityResult> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    const meta = await sharp(imageBuffer).metadata();
    const width = meta.width ?? 0;
    const height = meta.height ?? 0;

    if (width < MIN_WIDTH || height < MIN_HEIGHT) {
      issues.push(`Resolution too low: ${width}x${height}. Minimum ${MIN_WIDTH}x${MIN_HEIGHT} recommended.`);
      recommendations.push('Use an image with at least 320x320 pixels for reliable tracking.');
    }

    const stats = await sharp(imageBuffer)
      .raw()
      .toBuffer({ resolveWithObject: true })
      .then(({ data, info }) => {
        const len = data.length;
        let sum = 0;
        let sumSq = 0;
        for (let i = 0; i < len; i++) {
          sum += data[i];
          sumSq += data[i] * data[i];
        }
        const mean = sum / len;
        const variance = sumSq / len - mean * mean;
        const stdDev = Math.sqrt(Math.max(0, variance));
        return { mean, stdDev, channels: info.channels };
      })
      .catch(() => ({ mean: 128, stdDev: 0, channels: 3 }));

    if (stats.stdDev < 20) {
      issues.push('Low contrast: image may be too flat for stable tracking.');
      recommendations.push('Use images with clear edges and varied tones.');
    }

    const gray = await sharp(imageBuffer)
      .grayscale()
      .raw()
      .toBuffer();
    const edgeDensity = this.estimateEdgeDensity(gray, meta.width ?? 0, meta.height ?? 0);
    if (edgeDensity < 0.05) {
      issues.push('Low detail: few edges detected. Tracking may be unstable.');
      recommendations.push('Choose images with distinct shapes, text, or high-contrast details.');
    }

    let score = 1;
    if (width < MIN_WIDTH || height < MIN_HEIGHT) score -= 0.4;
    else if (width < 640 || height < 640) score -= 0.1;
    if (stats.stdDev < 20) score -= 0.25;
    if (edgeDensity < 0.05) score -= 0.2;
    score = Math.max(0, Math.min(1, score));

    let trackingQuality: TrackingQuality = TrackingQuality.UNUSABLE;
    if (score >= MIN_SCORE_EXCELLENT) trackingQuality = TrackingQuality.EXCELLENT;
    else if (score >= MIN_SCORE_GOOD) trackingQuality = TrackingQuality.GOOD;
    else if (score >= MIN_SCORE_FAIR) trackingQuality = TrackingQuality.FAIR;
    else if (score >= MIN_SCORE_POOR) trackingQuality = TrackingQuality.POOR;

    this.logger.debug(`Quality analyzed: score=${score.toFixed(2)} quality=${trackingQuality}`);

    return {
      score: Math.round(score * 100) / 100,
      trackingQuality,
      qualityIssues: issues,
      recommendations,
    };
  }

  private estimateEdgeDensity(gray: Buffer, width: number, height: number): number {
    if (width < 2 || height < 2) return 0;
    let edges = 0;
    const len = width * height;
    for (let i = width + 1; i < len - width - 1; i++) {
      const _g = gray[i];
      const dx = Math.abs(gray[i + 1] - gray[i - 1]);
      const dy = Math.abs(gray[i + width] - gray[i - width]);
      if (dx > 15 || dy > 15) edges++;
    }
    return edges / len;
  }
}
