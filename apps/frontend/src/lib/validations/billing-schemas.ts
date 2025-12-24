/**
 * 💳 Schemas de validation Zod pour le billing
 */

import { z } from 'zod';

export const CreateCheckoutSessionSchema = z.object({
  planId: z.enum(['starter', 'professional', 'business', 'enterprise'], {
    errorMap: () => ({ message: 'Plan invalide' }),
  }),
  email: z.string().email('Email invalide').optional(),
  billing: z.enum(['monthly', 'yearly']).default('monthly'),
});

export const UpdateSubscriptionSchema = z.object({
  planId: z.enum(['professional', 'business', 'enterprise']),
  billingCycle: z.enum(['monthly', 'yearly']).optional(),
});

export const CancelSubscriptionSchema = z.object({
  reason: z.string().min(1).max(500).optional(),
  immediate: z.boolean().default(false),
});

// Types inférés
export type CreateCheckoutSessionInput = z.infer<typeof CreateCheckoutSessionSchema>;
export type UpdateSubscriptionInput = z.infer<typeof UpdateSubscriptionSchema>;
export type CancelSubscriptionInput = z.infer<typeof CancelSubscriptionSchema>;



