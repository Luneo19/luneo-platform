/**
 * 💰 DISCOUNT CODES SERVICE - Luneo Platform
 * 
 * Système complet de gestion des codes promo
 * Supporte différents types de réductions (pourcentage, fixe)
 * Gestion de validité, utilisation, limites
 * Pour un SaaS professionnel et scalable
 */

import { createClient } from '@/lib/supabase/server';
import { logger } from './logger';

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
  metadata?: Record<string, any>;
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
    const supabase = await createClient();

    // Récupérer le code promo
    const { data: discountCode, error: fetchError } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (fetchError || !discountCode) {
      logger.warn('Discount code not found', {
        code,
        userId,
        error: fetchError?.message,
      });
      return {
        valid: false,
        discountAmount: 0,
        error: 'CODE_NOT_FOUND',
        reason: 'Code promo introuvable',
      };
    }

    // Vérifier la validité temporelle
    const now = new Date();
    const validFrom = new Date(discountCode.valid_from);
    const validUntil = new Date(discountCode.valid_until);

    if (now < validFrom) {
      return {
        valid: false,
        discountAmount: 0,
        error: 'CODE_NOT_YET_VALID',
        reason: 'Ce code promo n\'est pas encore valide',
      };
    }

    if (now > validUntil) {
      return {
        valid: false,
        discountAmount: 0,
        error: 'CODE_EXPIRED',
        reason: 'Ce code promo a expiré',
      };
    }

    // Vérifier la limite d'utilisation globale
    if (discountCode.usage_limit && discountCode.usage_count >= discountCode.usage_limit) {
      return {
        valid: false,
        discountAmount: 0,
        error: 'CODE_LIMIT_REACHED',
        reason: 'Ce code promo a atteint sa limite d\'utilisation',
      };
    }

    // Vérifier la limite d'utilisation par utilisateur
    if (discountCode.user_limit) {
      const { data: userUsage, error: usageError } = await supabase
        .from('order_discount_codes')
        .select('id', { count: 'exact' })
        .eq('discount_code_id', discountCode.id)
        .eq('user_id', userId);

      if (!usageError && userUsage && userUsage.length >= discountCode.user_limit) {
        return {
          valid: false,
          discountAmount: 0,
          error: 'USER_LIMIT_REACHED',
          reason: 'Vous avez déjà utilisé ce code promo le maximum de fois autorisé',
        };
      }
    }

    // Vérifier le montant minimum
    if (discountCode.min_amount && subtotal < discountCode.min_amount) {
      return {
        valid: false,
        discountAmount: 0,
        error: 'MIN_AMOUNT_NOT_MET',
        reason: `Ce code promo nécessite un montant minimum de ${(discountCode.min_amount / 100).toFixed(2)}€`,
      };
    }

    // Vérifier si le code s'applique à des produits spécifiques
    if (discountCode.applies_to && discountCode.applies_to.length > 0 && itemIds) {
      const hasApplicableProduct = itemIds.some(id => discountCode.applies_to!.includes(id));
      if (!hasApplicableProduct) {
        return {
          valid: false,
          discountAmount: 0,
          error: 'CODE_NOT_APPLICABLE',
          reason: 'Ce code promo ne s\'applique pas aux produits de votre commande',
        };
      }
    }

    // Vérifier si le code exclut certains produits
    if (discountCode.excluded_products && discountCode.excluded_products.length > 0 && itemIds) {
      const hasExcludedProduct = itemIds.some(id => discountCode.excluded_products!.includes(id));
      if (hasExcludedProduct) {
        return {
          valid: false,
          discountAmount: 0,
          error: 'CODE_EXCLUDED_PRODUCTS',
          reason: 'Ce code promo ne s\'applique pas à certains produits de votre commande',
        };
      }
    }

    // Calculer le montant de la réduction
    let discountAmount = 0;

    switch (discountCode.type) {
      case 'percentage':
        discountAmount = Math.round((subtotal * discountCode.value) / 100);
        
        // Appliquer le maximum de réduction si spécifié
        if (discountCode.max_discount && discountAmount > discountCode.max_discount) {
          discountAmount = discountCode.max_discount;
        }
        break;

      case 'fixed':
        discountAmount = discountCode.value;
        // Ne pas dépasser le montant de la commande
        if (discountAmount > subtotal) {
          discountAmount = subtotal;
        }
        break;

      case 'shipping':
        // Pour shipping, on retourne 0 ici car il sera géré séparément
        discountAmount = 0;
        break;

      default:
        return {
          valid: false,
          discountAmount: 0,
          error: 'INVALID_DISCOUNT_TYPE',
          reason: 'Type de réduction invalide',
        };
    }

    return {
      valid: true,
      discountCode: discountCode as DiscountCode,
      discountAmount,
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

/**
 * Enregistrer l'utilisation d'un code promo
 */
export async function recordDiscountCodeUsage(
  discountCodeId: string,
  userId: string,
  orderId: string,
  discountAmount: number
): Promise<void> {
  try {
    const supabase = await createClient();

    // Enregistrer l'utilisation dans order_discount_codes
    const { error: recordError } = await supabase
      .from('order_discount_codes')
      .insert({
        discount_code_id: discountCodeId,
        user_id: userId,
        order_id: orderId,
        discount_amount: discountAmount,
        used_at: new Date().toISOString(),
      });

    if (recordError) {
      logger.error('Error recording discount code usage', recordError, {
        discountCodeId,
        userId,
        orderId,
      });
      // Ne pas faire échouer la commande si l'enregistrement échoue
      return;
    }

    // Incrémenter le compteur d'utilisation du code
    const { error: updateError } = await supabase.rpc('increment_discount_code_usage', {
      code_id: discountCodeId,
    });

    if (updateError) {
      // Fallback: update manuel si la fonction RPC n'existe pas
      const { data: currentCode } = await supabase
        .from('discount_codes')
        .select('usage_count')
        .eq('id', discountCodeId)
        .single();

      if (currentCode) {
        await supabase
          .from('discount_codes')
          .update({
            usage_count: (currentCode.usage_count || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', discountCodeId);
      }
    }

    logger.info('Discount code usage recorded', {
      discountCodeId,
      userId,
      orderId,
      discountAmount,
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
 */
export async function applyShippingDiscount(
  code: string,
  shippingAmount: number
): Promise<{ valid: boolean; newShippingAmount: number; error?: string }> {
  try {
    const supabase = await createClient();

    const { data: discountCode, error: fetchError } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('type', 'shipping')
      .eq('is_active', true)
      .single();

    if (fetchError || !discountCode) {
      return {
        valid: false,
        newShippingAmount: shippingAmount,
        error: 'CODE_NOT_FOUND',
      };
    }

    // Vérifier la validité temporelle
    const now = new Date();
    const validFrom = new Date(discountCode.valid_from);
    const validUntil = new Date(discountCode.valid_until);

    if (now < validFrom || now > validUntil) {
      return {
        valid: false,
        newShippingAmount: shippingAmount,
        error: 'CODE_EXPIRED',
      };
    }

    // Code shipping valide: shipping gratuit
    return {
      valid: true,
      newShippingAmount: 0,
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


