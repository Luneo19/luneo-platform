/**
 * 💳 Schemas de validation Zod pour le billing
 */

import { z } from 'zod';

export const CreateCheckoutSessionSchema = z.object({
  planId: z.enum(['pro', 'business', 'enterprise'], {
    errorMap: () => ({ message: 'Plan invalide' }),
  }),
  email: z.string().email('Email invalide').optional(),
  billing: z.enum(['monthly', 'yearly']).default('monthly'),
  addOns: z.array(
    z.object({
      type: z.enum([
        'extra-designs',
        'extra-storage',
        'extra-team-members',
        'extra-api-calls',
        'extra-renders-3d',
      ]),
      quantity: z.number().int().positive().default(1),
    })
  ).optional(),
});

export const UpdateSubscriptionSchema = z.object({
  planId: z.enum(['pro', 'business', 'enterprise']),
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



