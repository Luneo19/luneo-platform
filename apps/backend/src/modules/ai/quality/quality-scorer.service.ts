import { Injectable, Logger } from '@nestjs/common';

export interface QualityScore {
  overall: number; // 0-100
  resolution: number; // 0-100
  coherence: number; // 0-100
  artifacts: number; // 0-100 (higher = fewer artifacts)
  details: string[];
}

@Injectable()
export class QualityScorerService {
  private readonly logger = new Logger(QualityScorerService.name);

  async scoreGeneration(params: {
    resultUrl: string;
    prompt: string;
    width?: number;
    height?: number;
    provider: string;
    generationTimeMs: number;
  }): Promise<QualityScore> {
    const details: string[] = [];

    // Resolution score
    const w = params.width ?? 1024;
    const h = params.height ?? 1024;
    const pixels = w * h;
    let resolutionScore = 50;
    if (pixels >= 2048 * 2048) resolutionScore = 100;
    else if (pixels >= 1024 * 1024) resolutionScore = 80;
    else if (pixels >= 512 * 512) resolutionScore = 60;
    else resolutionScore = 30;
    details.push(`Resolution: ${w}x${h} (${resolutionScore}/100)`);

    // Provider quality bias
    const providerQuality: Record<string, number> = {
      openai: 95,
      stability: 85,
      'replicate-sdxl': 80,
      meshy: 75,
      runway: 85,
    };
    const coherenceScore = providerQuality[params.provider] ?? 70;
    details.push(`Provider quality (${params.provider}): ${coherenceScore}/100`);

    // Generation time penalty (very fast or very slow may indicate issues)
    let artifactsScore = 85;
    if (params.generationTimeMs < 1000) {
      artifactsScore = 60;
      details.push(
        'Warning: Very fast generation may indicate cached/low-quality result',
      );
    } else if (params.generationTimeMs > 120000) {
      artifactsScore = 70;
      details.push(
        'Warning: Very slow generation may indicate processing issues',
      );
    }
    details.push(`Artifacts score: ${artifactsScore}/100`);

    const overall = Math.round(
      resolutionScore * 0.3 + coherenceScore * 0.4 + artifactsScore * 0.3,
    );

    return {
      overall,
      resolution: resolutionScore,
      coherence: coherenceScore,
      artifacts: artifactsScore,
      details,
    };
  }
}
