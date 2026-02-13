/**
 * Marketplace commission Unit Tests
 * Tests getMarketplaceCommission rates per plan and commission calculation on purchase
 */

import { getMarketplaceCommission } from '@/libs/plans/plan-config';
import { PlanTier } from '@/libs/plans/plan-config.types';

describe('Marketplace commission', () => {
  describe('getMarketplaceCommission (plan rates)', () => {
    it('should return 30% for free plan', () => {
      expect(getMarketplaceCommission(PlanTier.FREE)).toBe(30);
      expect(getMarketplaceCommission('free')).toBe(30);
    });

    it('should return 20% for starter plan', () => {
      expect(getMarketplaceCommission(PlanTier.STARTER)).toBe(20);
      expect(getMarketplaceCommission('starter')).toBe(20);
    });

    it('should return 15% for professional plan', () => {
      expect(getMarketplaceCommission(PlanTier.PROFESSIONAL)).toBe(15);
      expect(getMarketplaceCommission('professional')).toBe(15);
    });

    it('should return 10% for business plan', () => {
      expect(getMarketplaceCommission(PlanTier.BUSINESS)).toBe(10);
      expect(getMarketplaceCommission('business')).toBe(10);
    });

    it('should return 5% for enterprise plan', () => {
      expect(getMarketplaceCommission(PlanTier.ENTERPRISE)).toBe(5);
      expect(getMarketplaceCommission('enterprise')).toBe(5);
    });

    it('should default to 30% for unknown plan', () => {
      expect(getMarketplaceCommission('unknown')).toBe(30);
      expect(getMarketplaceCommission('')).toBe(30);
    });
  });

  describe('commission calculation on purchase', () => {
    it('should correctly calculate commission and net for free plan (30%)', () => {
      const priceCents = 1000;
      const percent = getMarketplaceCommission('free');
      const commissionCents = Math.round((priceCents * percent) / 100);
      const netCents = priceCents - commissionCents;
      expect(percent).toBe(30);
      expect(commissionCents).toBe(300);
      expect(netCents).toBe(700);
    });

    it('should correctly calculate commission and net for starter plan (20%)', () => {
      const priceCents = 5000;
      const percent = getMarketplaceCommission('starter');
      const commissionCents = Math.round((priceCents * percent) / 100);
      const netCents = priceCents - commissionCents;
      expect(percent).toBe(20);
      expect(commissionCents).toBe(1000);
      expect(netCents).toBe(4000);
    });

    it('should correctly calculate commission and net for professional plan (15%)', () => {
      const priceCents = 10000;
      const percent = getMarketplaceCommission('professional');
      const commissionCents = Math.round((priceCents * percent) / 100);
      expect(percent).toBe(15);
      expect(commissionCents).toBe(1500);
    });

    it('should correctly calculate commission and net for business plan (10%)', () => {
      const priceCents = 20000;
      const percent = getMarketplaceCommission('business');
      const commissionCents = Math.round((priceCents * percent) / 100);
      expect(percent).toBe(10);
      expect(commissionCents).toBe(2000);
    });

    it('should correctly calculate commission and net for enterprise plan (5%)', () => {
      const priceCents = 10000;
      const percent = getMarketplaceCommission('enterprise');
      const commissionCents = Math.round((priceCents * percent) / 100);
      expect(percent).toBe(5);
      expect(commissionCents).toBe(500);
    });
  });
});
