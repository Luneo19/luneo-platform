/**
 * 💰 DISCOUNT CODES SERVICE - Luneo Platform
 * 
 * Système complet de gestion des codes promo
 * Supporte différents types de réductions (pourcentage, fixe)
 * Gestion de validité, utilisation, limites
 * Pour un SaaS professionnel et scalable
 */

import { getBackendUrl } from '@/lib/api/server-url';
import { logger } from './logger';

const API_URL = getBackendUrl();

export type DiscountType = 'percentage' | 'fixed' | 'shipping';

export interface DiscountCode {
  id: string;
  code: string;
  type: DiscountType;
  value: number; // Pourcentage (0-100) ou montant fixe en centimes
  min_amount?: number; // Montant minimum de commande en centimes
  max_discount?: number; // Montant maximum de réduction en centimes (pour pourcentage)
  valid_from: string;
  valid_until: string;
  usage_limit?: number; // Nombre maximum d'utilisations
  usage_count: number; // Nombre d'utilisations actuelles
  user_limit?: number; // Nombre maximum d'utilisations par utilisateur
  is_active: boolean;
  applies_to?: string[]; // IDs de produits ou catégories spécifiques
  excluded_products?: string[]; // IDs de produits exclus
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface DiscountValidationResult {
  valid: boolean;
  discountCode?: DiscountCode;
  discountAmount: number;
  error?: string;
  reason?: string;
}

/**
 * Valider un code promo
 */
export async function validateDiscountCode(
  code: string,
  userId: string,
  subtotal: number, // En centimes
  itemIds?: string[] // IDs des produits dans la commande
): Promise<DiscountValidationResult> {
  try {
    const response = await fetch(`${API_URL}/api/v1/discount-codes/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code.toUpperCase(),
          userId,
          subtotal,
          itemIds,
        }),
      });

    if (response.ok) {
      return await response.json();
    }

    const err = await response.json().catch(() => ({}));
    return {
      valid: false,
      discountAmount: 0,
      error: (err as { error?: string }).error ?? 'VALIDATION_FAILED',
      reason: (err as { reason?: string }).reason ?? 'Code promo invalide ou expiré',
    };
  } catch (error) {
    logger.error('Error validating discount code', error instanceof Error ? error : new Error(String(error)), {
      code,
      userId,
      subtotal,
    });
    return {
      valid: false,
      discountAmount: 0,
      error: 'VALIDATION_ERROR',
      reason: 'Erreur lors de la validation du code promo',
    };
  }
}

// Legacy implementation removed - all discount validation goes through backend API (validateDiscountCode)

/**
 * Enregistrer l'utilisation d'un code promo
 * Délègue au backend API (NestJS).
 */
export async function recordDiscountCodeUsage(
  discountCodeId: string,
  userId: string,
  orderId: string,
  discountAmount: number
): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/api/v1/discount-codes/record-usage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        discountCodeId,
        userId,
        orderId,
        discountAmount,
      }),
    });

    if (response.ok) {
      logger.info('Discount code usage recorded', {
        discountCodeId,
        userId,
        orderId,
        discountAmount,
      });
      return;
    }

    logger.warn('Backend record discount usage failed', {
      discountCodeId,
      userId,
      orderId,
      status: response.status,
    });
  } catch (error) {
    logger.error('Error recording discount code usage', error instanceof Error ? error : new Error(String(error)), {
      discountCodeId,
      userId,
      orderId,
    });
    // Ne pas faire échouer la commande si l'enregistrement échoue
  }
}

/**
 * Appliquer un code promo shipping (gratuit)
 * Délègue au backend API (NestJS).
 */
export async function applyShippingDiscount(
  code: string,
  shippingAmount: number
): Promise<{ valid: boolean; newShippingAmount: number; error?: string }> {
  try {
    const response = await fetch(`${API_URL}/api/v1/discount-codes/apply-shipping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: code.toUpperCase(), shippingAmount }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        valid: data.valid === true,
        newShippingAmount: typeof data.newShippingAmount === 'number' ? data.newShippingAmount : 0,
        error: data.error,
      };
    }

    const err = await response.json().catch(() => ({}));
    return {
      valid: false,
      newShippingAmount: shippingAmount,
      error: (err as { error?: string }).error || 'CODE_NOT_FOUND',
    };
  } catch (error) {
    logger.error('Error applying shipping discount', error instanceof Error ? error : new Error(String(error)), {
      code,
      shippingAmount,
    });
    return {
      valid: false,
      newShippingAmount: shippingAmount,
      error: 'VALIDATION_ERROR',
    };
  }
}


