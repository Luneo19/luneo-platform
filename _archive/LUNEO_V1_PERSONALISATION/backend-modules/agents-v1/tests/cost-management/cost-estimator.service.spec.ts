import { CostEstimatorService } from '../../cost-management/cost-estimator.service';

describe('CostEstimatorService', () => {
  let service: CostEstimatorService;

  beforeEach(() => {
    service = new CostEstimatorService();
  });

  describe('estimate', () => {
    it('should estimate cost for a known model', () => {
      const result = service.estimate('gpt-4o', 'Hello, how are you?', 100);

      expect(result.model).toBe('gpt-4o');
      expect(result.estimatedPromptTokens).toBeGreaterThan(0);
      expect(result.estimatedCompletionTokens).toBe(25);
      expect(result.estimatedCostCents).toBeGreaterThanOrEqual(0);
      expect(result.estimatedCostUsd).toBeGreaterThanOrEqual(0);
    });

    it('should estimate prompt tokens as ceil(text.length / 4)', () => {
      const text = 'a'.repeat(400);
      const result = service.estimate('gpt-4o', text, 100);
      expect(result.estimatedPromptTokens).toBe(100);
    });

    it('should estimate completion tokens as ceil(expectedLength / 4)', () => {
      const result = service.estimate('gpt-4o', 'hello', 200);
      expect(result.estimatedCompletionTokens).toBe(50);
    });

    it('should default expected response length to 500', () => {
      const result = service.estimate('gpt-4o', 'hello');
      expect(result.estimatedCompletionTokens).toBe(125);
    });

    it('should return zero cost for unknown model', () => {
      const result = service.estimate('unknown-model', 'hello', 100);
      expect(result.estimatedCostCents).toBe(0);
      expect(result.estimatedCostUsd).toBe(0);
    });

    it('should return higher USD cost for gpt-4o vs gpt-4o-mini with large input', () => {
      const text = 'a'.repeat(40000);
      const gpt4o = service.estimate('gpt-4o', text, 5000);
      const gpt4oMini = service.estimate('gpt-4o-mini', text, 5000);
      expect(gpt4o.estimatedCostUsd).toBeGreaterThan(gpt4oMini.estimatedCostUsd);
    });

    it('should return cost in cents as ceiling of USD*100', () => {
      const result = service.estimate('gpt-4o', 'a'.repeat(4000), 1000);
      expect(result.estimatedCostCents).toBe(Math.ceil(result.estimatedCostUsd * 100));
    });
  });

  describe('compareModels', () => {
    it('should return estimates sorted by cost ascending', () => {
      const results = service.compareModels('a'.repeat(40000), ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'], 5000);
      for (let i = 1; i < results.length; i++) {
        expect(results[i].estimatedCostCents).toBeGreaterThanOrEqual(results[i - 1].estimatedCostCents);
      }
    });

    it('should return one estimate per model', () => {
      const models = ['gpt-4o', 'gpt-4o-mini'];
      const results = service.compareModels('Test', models);
      expect(results).toHaveLength(2);
    });

    it('should order cheaper model before expensive one', () => {
      const results = service.compareModels('a'.repeat(40000), ['gpt-4o', 'gpt-4o-mini'], 5000);
      expect(results[0].estimatedCostUsd).toBeLessThanOrEqual(results[1].estimatedCostUsd);
    });
  });
});
