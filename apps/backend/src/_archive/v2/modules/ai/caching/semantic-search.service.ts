import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

export interface SimilarPromptResult {
  prompt: string;
  similarity: number;
  resultUrl: string;
}

/**
 * Levenshtein distance between two strings.
 */
function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0),
  );
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }
  return dp[m][n];
}

/**
 * Similarity score in [0, 1]: 1 = identical, 0 = no match.
 */
function similarityFromLevenshtein(
  s1: string,
  s2: string,
  distance: number,
): number {
  const maxLen = Math.max(s1.length, s2.length, 1);
  return 1 - distance / maxLen;
}

@Injectable()
export class SemanticSearchService {
  private readonly logger = new Logger(SemanticSearchService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find similar prompts in AICachedGeneration using Levenshtein on normalized prompts.
   */
  async findSimilar(
    prompt: string,
    threshold = 0.6,
    limit = 10,
  ): Promise<SimilarPromptResult[]> {
    const normalized = prompt
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s,.-]/g, '')
      .trim();

    const entries = await this.prisma.aICachedGeneration.findMany({
      where: { expiresAt: { gt: new Date() } },
      select: {
        normalizedPrompt: true,
        prompt: true,
        resultUrl: true,
      },
      orderBy: { lastAccessedAt: 'desc' },
      take: Math.min(500, limit * 20), // fetch more to filter by similarity
    });

    const withSimilarity: Array<{
      prompt: string;
      resultUrl: string;
      similarity: number;
    }> = [];

    for (const entry of entries) {
      const distance = levenshteinDistance(
        normalized,
        entry.normalizedPrompt,
      );
      const similarity = similarityFromLevenshtein(
        normalized,
        entry.normalizedPrompt,
        distance,
      );
      if (similarity >= threshold) {
        withSimilarity.push({
          prompt: entry.prompt,
          resultUrl: entry.resultUrl,
          similarity,
        });
      }
    }

    withSimilarity.sort((a, b) => b.similarity - a.similarity);
    return withSimilarity.slice(0, limit);
  }
}
