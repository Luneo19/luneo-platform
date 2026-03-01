import { Injectable } from '@nestjs/common';
import { LlmService } from '@/libs/llm/llm.service';
import { DEFAULT_GOLDEN_SET, EvalScenario } from './golden-set';

export interface EvalRunItemResult {
  id: string;
  model: string;
  latencyMs: number;
  costUsd: number;
  response: string;
  qualityScore: number;
  passed: boolean;
  missingKeywords: string[];
  forbiddenHits: string[];
}

export interface EvalRunSummary {
  total: number;
  passed: number;
  passRate: number;
  avgQuality: number;
  avgLatencyMs: number;
  totalCostUsd: number;
  startedAt: string;
  finishedAt: string;
  results: EvalRunItemResult[];
}

@Injectable()
export class EvalHarnessService {
  constructor(private readonly llmService: LlmService) {}

  async runGoldenSet(scenarios: EvalScenario[] = DEFAULT_GOLDEN_SET): Promise<EvalRunSummary> {
    const startedAt = new Date();
    const results: EvalRunItemResult[] = [];

    for (const scenario of scenarios) {
      const model = scenario.model ?? 'gpt-4o-mini';
      const completion = await this.llmService.complete({
        model,
        timeoutMs: 20000,
        retryCount: 1,
        messages: [
          {
            role: 'system',
            content:
              'Tu es un assistant professionnel. Réponds clairement, précisément et sans inventer.',
          },
          { role: 'user', content: scenario.prompt },
        ],
      });

      const responseText = completion.content.toLowerCase();
      const missingKeywords = scenario.expectedKeywords.filter(
        (k) => !responseText.includes(k.toLowerCase()),
      );
      const forbiddenHits = (scenario.forbiddenKeywords ?? []).filter((k) =>
        responseText.includes(k.toLowerCase()),
      );

      const qualityScore = this.computeQuality(
        scenario.expectedKeywords.length,
        missingKeywords.length,
        forbiddenHits.length,
      );

      results.push({
        id: scenario.id,
        model: completion.model,
        latencyMs: completion.latencyMs,
        costUsd: completion.costUsd,
        response: completion.content,
        qualityScore,
        passed: qualityScore >= 75,
        missingKeywords,
        forbiddenHits,
      });
    }

    const finishedAt = new Date();
    const passed = results.filter((x) => x.passed).length;
    const total = results.length;
    const avgQuality = total
      ? Math.round((results.reduce((sum, r) => sum + r.qualityScore, 0) / total) * 100) / 100
      : 0;
    const avgLatencyMs = total
      ? Math.round(results.reduce((sum, r) => sum + r.latencyMs, 0) / total)
      : 0;
    const totalCostUsd =
      Math.round(results.reduce((sum, r) => sum + r.costUsd, 0) * 10000) / 10000;

    return {
      total,
      passed,
      passRate: total ? Math.round((passed / total) * 10000) / 100 : 0,
      avgQuality,
      avgLatencyMs,
      totalCostUsd,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      results,
    };
  }

  private computeQuality(
    expectedCount: number,
    missingCount: number,
    forbiddenHits: number,
  ): number {
    if (expectedCount <= 0) return 0;
    const keywordCoverage = Math.max(0, ((expectedCount - missingCount) / expectedCount) * 100);
    const forbiddenPenalty = forbiddenHits * 20;
    return Math.round(Math.max(0, Math.min(100, keywordCoverage - forbiddenPenalty)));
  }
}

