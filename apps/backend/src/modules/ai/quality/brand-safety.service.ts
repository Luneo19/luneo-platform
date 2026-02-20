import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

export interface BrandSafetyResult {
  isCompliant: boolean;
  issues: string[];
  score: number;
}

@Injectable()
export class BrandSafetyService {
  private readonly logger = new Logger(BrandSafetyService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Verifies that generated content matches brand guidelines (colors, style).
   * Fetches the generation and brand guidelines, then performs heuristic checks.
   */
  async checkBrandSafety(
    generationId: string,
    brandId: string,
  ): Promise<BrandSafetyResult> {
    const issues: string[] = [];

    try {
      const [generation, guidelines] = await Promise.all([
        this.prisma.aIGeneration.findFirst({
          where: { id: generationId, brandId, deletedAt: null },
          select: { id: true, prompt: true, resultUrl: true },
        }),
        this.prisma.brandGuidelines.findUnique({
          where: { brandId },
        }),
      ]);

      if (!generation) {
        issues.push('Generation not found or does not belong to brand');
        return { isCompliant: false, issues, score: 0 };
      }

      if (!guidelines || !guidelines.isActive) {
        this.logger.debug('No active brand guidelines', { brandId });
        return { isCompliant: true, issues: [], score: 100 };
      }

      const colorPalette = guidelines.colorPalette as string[] | null;
      const _styleKeywords = guidelines.styleKeywords ?? [];
      const negativeKeywords = guidelines.negativeKeywords ?? [];
      const promptPrefix = guidelines.promptPrefix ?? '';
      const promptSuffix = guidelines.promptSuffix ?? '';

      // Check prompt alignment with style/negative keywords
      const promptLower = (generation.prompt ?? '').toLowerCase();
      for (const neg of negativeKeywords) {
        if (promptLower.includes(neg.toLowerCase())) {
          issues.push(`Prompt contains negative keyword: "${neg}"`);
        }
      }

      if (promptPrefix && !promptLower.startsWith(promptPrefix.toLowerCase())) {
        issues.push('Prompt does not start with brand prompt prefix');
      }
      if (promptSuffix && !promptLower.endsWith(promptSuffix.toLowerCase())) {
        issues.push('Prompt does not end with brand prompt suffix');
      }

      // Optional: color/style checks would require fetching resultUrl image
      // and comparing to colorPalette / styleKeywords (e.g. via Sharp or external API).
      // Placeholder: if guidelines define colors, we note that image color check is skipped.
      if (Array.isArray(colorPalette) && colorPalette.length > 0 && generation.resultUrl) {
        this.logger.debug('Brand has color palette; image color check not implemented', {
          generationId,
          brandId,
        });
      }

      const issueCount = issues.length;
      const score = Math.max(0, 100 - issueCount * 25);
      const isCompliant = issueCount === 0;

      return { isCompliant, issues, score };
    } catch (error) {
      this.logger.warn('Brand safety check failed', {
        generationId,
        brandId,
        error: error instanceof Error ? error.message : error,
      });
      return {
        isCompliant: false,
        issues: ['Brand safety check failed'],
        score: 0,
      };
    }
  }
}
