import { Injectable } from '@nestjs/common';
import { LLM_COSTS_PER_1K_TOKENS } from '../services/llm-provider.enum';

export interface CostEstimate {
  model: string;
  estimatedPromptTokens: number;
  estimatedCompletionTokens: number;
  estimatedCostCents: number;
  estimatedCostUsd: number;
}

@Injectable()
export class CostEstimatorService {
  estimate(
    model: string,
    promptText: string,
    expectedResponseLength = 500,
  ): CostEstimate {
    const estimatedPromptTokens = Math.ceil(promptText.length / 4);
    const estimatedCompletionTokens = Math.ceil(expectedResponseLength / 4);

    const costs = LLM_COSTS_PER_1K_TOKENS[model];
    const costUsd = costs
      ? (estimatedPromptTokens / 1000) * costs.input + (estimatedCompletionTokens / 1000) * costs.output
      : 0;

    return {
      model,
      estimatedPromptTokens,
      estimatedCompletionTokens,
      estimatedCostCents: Math.ceil(costUsd * 100),
      estimatedCostUsd: Math.round(costUsd * 10000) / 10000,
    };
  }

  compareModels(
    promptText: string,
    models: string[],
    expectedResponseLength = 500,
  ): CostEstimate[] {
    return models
      .map((model) => this.estimate(model, promptText, expectedResponseLength))
      .sort((a, b) => a.estimatedCostCents - b.estimatedCostCents);
  }
}
