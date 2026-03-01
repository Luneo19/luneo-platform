import { describe, expect, it } from 'vitest';
import { PLAN_LIMITS, PRICING } from './pricing-constants';

describe('pricing constants contract', () => {
  it('keeps PRO/BUSINESS prices aligned with backend canonical values', () => {
    expect(PRICING.pro.monthly).toBe(49);
    expect(PRICING.pro.yearly).toBe(468);
    expect(PRICING.business.monthly).toBe(149);
    expect(PRICING.business.yearly).toBe(1428);
  });

  it('keeps key feature flags aligned with backend plan source of truth', () => {
    expect(PLAN_LIMITS.free.documentsPerKB).toBe(10);
    expect(PLAN_LIMITS.pro.advancedAnalytics).toBe(false);
    expect(PLAN_LIMITS.business.whiteLabel).toBe(true);
    expect(PLAN_LIMITS.enterprise.storageMB).toBe(-1);
  });
});
