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
      const usage = {
        promptTokens: 1000,
        completionTokens: 500,
        totalTokens: 1500,
      };

      const result = service.calculateCost(
        LLMProvider.OPENAI,
        'gpt-3.5-turbo',
        usage,
      );

      expect(result.costCents).toBeGreaterThan(0);
      expect(result.breakdown.promptCostCents).toBeGreaterThan(0);
      expect(result.breakdown.completionCostCents).toBeGreaterThan(0);
    });

    it('should calculate cost for Anthropic Claude 3 Sonnet correctly', () => {
      const usage = {
        promptTokens: 1000,
        completionTokens: 500,
        totalTokens: 1500,
      };

      const result = service.calculateCost(
        LLMProvider.ANTHROPIC,
        'claude-3-sonnet-20240229',
        usage,
      );

      expect(result.costCents).toBeGreaterThan(0);
      expect(result.breakdown.promptCostCents).toBeGreaterThan(0);
      expect(result.breakdown.completionCostCents).toBeGreaterThan(0);
    });

    it('should calculate cost for Mistral Small correctly', () => {
      const usage = {
        promptTokens: 1000,
        completionTokens: 500,
        totalTokens: 1500,
      };

      const result = service.calculateCost(
        LLMProvider.MISTRAL,
        'mistral-small-latest',
        usage,
      );

      expect(result.costCents).toBeGreaterThan(0);
    });

    it('should use default costs for unknown model', () => {
      const usage = {
        promptTokens: 1000,
        completionTokens: 500,
        totalTokens: 1500,
      };

      const result = service.calculateCost(
        LLMProvider.OPENAI,
        'unknown-model',
        usage,
      );

      expect(result.costCents).toBeGreaterThan(0);
    });
  });

  describe('estimateCost', () => {
    it('should estimate cost before making request', () => {
      const estimatedTokens = 2000;
      const cost = service.estimateCost(
        LLMProvider.ANTHROPIC,
        'claude-3-haiku-20240307',
        estimatedTokens,
      );

      expect(cost).toBeGreaterThan(0);
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
