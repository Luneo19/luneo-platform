/**
 * ★★★ STRIPE CLIENT - INITIALISATION ★★★
 * Client Stripe pour utilisation dans les services
 * - Initialisation lazy
 * - Gestion d'erreurs
 * - Type safety
 */

import Stripe from 'stripe';
import { logger } from '@/lib/logger';

// ========================================
// STRIPE INSTANCE
// ========================================

let stripeInstance: Stripe | null = null;

/**
 * Obtient l'instance Stripe (lazy initialization)
 */
export function getStripe(): Stripe {
  if (stripeInstance) {
    return stripeInstance;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    logger.error('STRIPE_SECRET_KEY not configured', new Error('Missing Stripe configuration'));
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
  }

  try {
    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2025-09-30.clover' as Stripe.LatestApiVersion,
      typescript: true,
    });

    logger.info('Stripe client initialized');
    return stripeInstance;
  } catch (error: any) {
    logger.error('Failed to initialize Stripe client', { error });
    throw new Error('Failed to initialize Stripe client. Please check your configuration.');
  }
}

/**
 * Vérifie si Stripe est configuré
 */
export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

