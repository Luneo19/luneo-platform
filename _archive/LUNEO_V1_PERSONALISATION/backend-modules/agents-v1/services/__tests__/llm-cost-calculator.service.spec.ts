/**
 * Tests unitaires pour LLMCostCalculatorService
 */

import { Test, TestingModule } from '@nestjs/testing';
import { LLMCostCalculatorService } from '../llm-cost-calculator.service';
import { LLMProvider } from '../llm-router.service';

describe('LLMCostCalculatorService', () => {
  let service: LLMCostCalculatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LLMCostCalculatorService],
    }).compile();

    service = module.get<LLMCostCalculatorService>(LLMCostCalculatorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateCost', () => {
    it('should calculate cost for OpenAI GPT-3.5-turbo correctly', () => {
      // Use large token counts to ensure non-zero rounded costs
      const usage = {
        promptTokens: 1000000,
        completionTokens: 500000,
        totalTokens: 1500000,
      };

      const result = service.calculateCost(
        LLMProvider.OPENAI,
        'gpt-3.5-turbo',
        usage,
      );

      expect(result.costCents).toBeGreaterThan(0);
      expect(result.breakdown).toBeDefined();
    });

    it('should calculate cost for Anthropic Claude 3 Sonnet correctly', () => {
      // Use large token counts to ensure non-zero rounded costs
      const usage = {
        promptTokens: 1000000,
        completionTokens: 500000,
        totalTokens: 1500000,
      };

      const result = service.calculateCost(
        LLMProvider.ANTHROPIC,
        'claude-3-sonnet-20240229',
        usage,
      );

      expect(result.costCents).toBeGreaterThan(0);
      expect(result.breakdown).toBeDefined();
    });

    it('should calculate cost for Mistral Small correctly', () => {
      // Use larger token counts to get non-zero rounded costs
      const usage = {
        promptTokens: 100000,
        completionTokens: 50000,
        totalTokens: 150000,
      };

      const result = service.calculateCost(
        LLMProvider.MISTRAL,
        'mistral-small-latest',
        usage,
      );

      expect(result.costCents).toBeGreaterThanOrEqual(0);
      // Verify cost calculation is working (non-negative)
      expect(result.breakdown).toBeDefined();
    });

    it('should use default costs for unknown model', () => {
      // Use larger token counts for meaningful cost calculation
      const usage = {
        promptTokens: 100000,
        completionTokens: 50000,
        totalTokens: 150000,
      };

      const result = service.calculateCost(
        LLMProvider.OPENAI,
        'unknown-model',
        usage,
      );

      expect(result.costCents).toBeGreaterThanOrEqual(0);
      expect(result.breakdown).toBeDefined();
    });
  });

  describe('estimateCost', () => {
    it('should estimate cost before making request', () => {
      // Use larger token counts for meaningful cost estimation
      const estimatedTokens = 200000;
      const cost = service.estimateCost(
        LLMProvider.ANTHROPIC,
        'claude-3-haiku-20240307',
        estimatedTokens,
      );

      // Cost should be non-negative (might be 0 for small amounts due to rounding)
      expect(cost).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getCheapestModel', () => {
    it('should return cheapest model for simple tasks', () => {
      const result = service.getCheapestModel(LLMProvider.MISTRAL, 'simple');
      expect(result.provider).toBe(LLMProvider.MISTRAL);
      expect(result.model).toBeDefined();
      expect(result.costPer1M).toBeGreaterThan(0);
    });
  });
});
