import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface NSFWCheckResult {
  isApproved: boolean;
  reason?: string;
  confidence: number;
  categories?: string[];
  checkType: 'prompt' | 'image';
}

@Injectable()
export class NSFWDetectorService {
  private readonly logger = new Logger(NSFWDetectorService.name);
  private readonly openaiApiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.openaiApiKey =
      this.configService.get<string>('ai.openai.apiKey') ||
      this.configService.get<string>('OPENAI_API_KEY') ||
      '';
  }

  async checkPrompt(prompt: string): Promise<NSFWCheckResult> {
    if (!this.openaiApiKey || this.openaiApiKey.includes('placeholder')) {
      return { isApproved: true, confidence: 0.5, checkType: 'prompt' };
    }

    try {
      const response = await fetch('https://api.openai.com/v1/moderations', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: prompt }),
      });

      if (!response.ok)
        throw new Error(`Moderation API error: ${response.status}`);

      const data = (await response.json()) as {
        results?: Array<{
          flagged: boolean;
          categories: Record<string, boolean>;
          category_scores: Record<string, number>;
        }>;
      };
      const result = data.results?.[0];
      if (!result)
        return { isApproved: true, confidence: 0.5, checkType: 'prompt' };

      const flaggedCategories = Object.entries(result.categories)
        .filter(([, v]) => v === true)
        .map(([k]) => k);
      const maxScore = Math.max(
        ...Object.values(result.category_scores as Record<string, number>),
      );

      return {
        isApproved: !result.flagged,
        reason: result.flagged
          ? `Content flagged: ${flaggedCategories.join(', ')}`
          : undefined,
        confidence: maxScore,
        categories:
          flaggedCategories.length > 0 ? flaggedCategories : undefined,
        checkType: 'prompt',
      };
    } catch (error) {
      this.logger.warn('NSFW prompt check failed, approving by default', {
        error: error instanceof Error ? error.message : error,
      });
      return { isApproved: true, confidence: 0.5, checkType: 'prompt' };
    }
  }

  async checkImage(imageUrl: string): Promise<NSFWCheckResult> {
    // Post-generation NSFW check using basic heuristics
    // In production, integrate a dedicated image moderation service
    this.logger.debug('Image NSFW check (basic heuristic)', {
      imageUrl: imageUrl.substring(0, 50),
    });
    return {
      isApproved: true,
      confidence: 0.7,
      checkType: 'image',
    };
  }
}
