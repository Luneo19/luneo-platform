// @ts-nocheck
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

export interface ConsistencyResult {
  score: number;
  issues: string[];
}

@Injectable()
export class ConsistencyCheckerService {
  private readonly logger = new Logger(ConsistencyCheckerService.name);

  constructor(private readonly prisma: PrismaService) {}

  async checkConsistency(generationId: string, brandId: string): Promise<ConsistencyResult> {
    const issues: string[] = [];
    let score = 100;

    try {
      const guidelines = await this.prisma.brandGuidelines.findUnique({
        where: { brandId, isActive: true },
      });
      if (!guidelines) {
        return { score: 100, issues: [] };
      }

      const generation = await this.prisma.generation.findFirst({
        where: { id: generationId },
      }).catch(() => null);

      if (!generation) {
        this.logger.debug(`Generation ${generationId} not found in Generation table; using heuristic score`);
        return { score: 75, issues: ['Generation record not found for detailed consistency check'] };
      }

      const prompt = generation.finalPrompt ?? generation.userPrompt ?? '';
      const negativeKeywords = (guidelines.negativeKeywords ?? []) as string[];
      for (const neg of negativeKeywords) {
        if (prompt.toLowerCase().includes(neg.toLowerCase())) {
          issues.push(`Prompt may contain discouraged keyword: ${neg}`);
          score -= 10;
        }
      }
      score = Math.max(0, score);
    } catch (err) {
      this.logger.warn(`Consistency check failed for ${generationId}: ${(err as Error).message}`);
      return { score: 50, issues: ['Consistency check could not be completed'] };
    }

    return { score, issues };
  }
}
