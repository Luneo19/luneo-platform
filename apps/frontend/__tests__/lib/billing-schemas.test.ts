/**
 * Tests Billing Schemas
 * T-009: Tests pour composants de billing (Checkout, Portal)
 */

import { describe, it, expect } from 'vitest';
import {
  CreateCheckoutSessionSchema,
  UpdateSubscriptionSchema,
  CancelSubscriptionSchema,
} from '@/lib/validations/billing-schemas';

describe('Billing Schemas', () => {
  // ============================================
  // CREATE CHECKOUT SESSION SCHEMA
  // ============================================

  describe('CreateCheckoutSessionSchema', () => {
    it('should validate valid checkout session data', () => {
      const validData = {
        planId: 'professional',
        email: 'test@example.com',
        billing: 'monthly',
      };

      const result = CreateCheckoutSessionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept starter plan', () => {
      const data = { planId: 'starter', billing: 'monthly' };
      const result = CreateCheckoutSessionSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept professional plan', () => {
      const data = { planId: 'professional', billing: 'monthly' };
      const result = CreateCheckoutSessionSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept business plan', () => {
      const data = { planId: 'business', billing: 'monthly' };
      const result = CreateCheckoutSessionSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept enterprise plan', () => {
      const data = { planId: 'enterprise', billing: 'monthly' };
      const result = CreateCheckoutSessionSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject invalid plan', () => {
      const data = { planId: 'invalid-plan', billing: 'monthly' };
      const result = CreateCheckoutSessionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept monthly billing', () => {
      const data = { planId: 'professional', billing: 'monthly' };
      const result = CreateCheckoutSessionSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept yearly billing', () => {
      const data = { planId: 'professional', billing: 'yearly' };
      const result = CreateCheckoutSessionSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject invalid billing cycle', () => {
      const data = { planId: 'professional', billing: 'weekly' };
      const result = CreateCheckoutSessionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should default billing to monthly when not provided', () => {
      const data = { planId: 'professional' };
      const result = CreateCheckoutSessionSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.billing).toBe('monthly');
      }
    });

    it('should allow optional email', () => {
      const data = { planId: 'professional', billing: 'monthly' };
      const result = CreateCheckoutSessionSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should validate email format when provided', () => {
      const data = { planId: 'professional', email: 'invalid-email', billing: 'monthly' };
      const result = CreateCheckoutSessionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept valid email', () => {
      const data = { planId: 'professional', email: 'test@example.com', billing: 'monthly' };
      const result = CreateCheckoutSessionSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  // ============================================
  // UPDATE SUBSCRIPTION SCHEMA
  // ============================================

  describe('UpdateSubscriptionSchema', () => {
    it('should validate valid update data', () => {
      const validData = {
        planId: 'business',
        billingCycle: 'yearly',
      };

      const result = UpdateSubscriptionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept professional plan', () => {
      const data = { planId: 'professional' };
      const result = UpdateSubscriptionSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept business plan', () => {
      const data = { planId: 'business' };
      const result = UpdateSubscriptionSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept enterprise plan', () => {
      const data = { planId: 'enterprise' };
      const result = UpdateSubscriptionSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject starter plan (cannot downgrade)', () => {
      const data = { planId: 'starter' };
      const result = UpdateSubscriptionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should allow optional billing cycle', () => {
      const data = { planId: 'business' };
      const result = UpdateSubscriptionSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept monthly billing cycle', () => {
      const data = { planId: 'business', billingCycle: 'monthly' };
      const result = UpdateSubscriptionSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept yearly billing cycle', () => {
      const data = { planId: 'business', billingCycle: 'yearly' };
      const result = UpdateSubscriptionSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  // ============================================
  // CANCEL SUBSCRIPTION SCHEMA
  // ============================================

  describe('CancelSubscriptionSchema', () => {
    it('should validate empty cancellation (immediate)', () => {
      const data = {};
      const result = CancelSubscriptionSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept reason', () => {
      const data = { reason: 'Too expensive' };
      const result = CancelSubscriptionSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept immediate flag', () => {
      const data = { immediate: true };
      const result = CancelSubscriptionSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should default immediate to false', () => {
      const data = {};
      const result = CancelSubscriptionSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.immediate).toBe(false);
      }
    });

    it('should accept full cancellation data', () => {
      const data = {
        reason: 'Moving to competitor',
        immediate: true,
      };
      const result = CancelSubscriptionSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject too long reason', () => {
      const data = {
        reason: 'x'.repeat(501), // More than 500 chars
      };
      const result = CancelSubscriptionSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });
});


