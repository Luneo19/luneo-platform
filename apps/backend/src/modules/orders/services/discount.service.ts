/**
 * ★★★ SERVICE - DISCOUNT CODES ★★★
 * Service pour gérer les codes promo et réductions
 * 
 * @module DiscountService
 * @description
 * Service pour valider et appliquer des codes promo sur les commandes.
 * Supporte les réductions en pourcentage et les réductions fixes.
 * 
 * @example
 * ```typescript
 * const discountService = new DiscountService(prismaService);
 * const result = await discountService.validateAndApplyDiscount('WELCOME10', 10000, brandId, userId);
 * // result: { discountCents: 1000, discountPercent: 10, code: 'WELCOME10', type: 'percentage' }
 * ```
 * 
 * @remarks
 * Pour une implémentation complète, créer un modèle Discount dans Prisma avec :
 * - code: String (unique)
 * - type: 'percentage' | 'fixed'
 * - value: Int (pourcentage ou montant fixe en centimes)
 * - minPurchaseCents: Int? (montant minimum d'achat)
 * - maxDiscountCents: Int? (montant maximum de réduction)
 * - validFrom: DateTime
 * - validUntil: DateTime
 * - usageLimit: Int? (nombre d'utilisations maximum)
 * - usageCount: Int (nombre d'utilisations actuelles)
 * - isActive: Boolean
 * - brandId: String? (code spécifique à une marque)
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

export interface DiscountResult {
  discountCents: number;
  discountPercent: number;
  code: string;
  type: 'percentage' | 'fixed';
  description?: string;
}

@Injectable()
export class DiscountService {
  private readonly logger = new Logger(DiscountService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Valide et applique un code promo sur une commande
   * 
   * @param code - Code promo à valider (ex: 'WELCOME10')
   * @param subtotalCents - Montant du sous-total en centimes avant réduction
   * @param brandId - ID de la marque (optionnel, pour codes spécifiques à une marque)
   * @param userId - ID de l'utilisateur (optionnel, pour limiter les utilisations par utilisateur)
   * @returns Résultat de la réduction avec montant et détails
   * 
   * @throws BadRequestException si le code est invalide ou expiré
   * 
   * @example
   * ```typescript
   * const result = await discountService.validateAndApplyDiscount('WELCOME10', 10000);
   * // Applique 10% de réduction sur 100€ = 10€ de réduction
   * ```
   */
  async validateAndApplyDiscount(
    code: string,
    subtotalCents: number,
    brandId?: string,
    userId?: string,
  ): Promise<DiscountResult> {
    if (!code || code.trim().length === 0) {
      throw new BadRequestException('Discount code is required');
    }

    const normalizedCode = code.toUpperCase().trim();

    // TODO: Implémenter avec modèle Discount dans Prisma
    // Pour l'instant, validation simple avec codes hardcodés pour démonstration
    // À remplacer par une vraie table Discount dans Prisma

    // Codes promo de démonstration
    const demoCodes: Record<string, { percent: number; fixed?: number; description: string }> = {
      'WELCOME10': { percent: 10, description: '10% de réduction sur votre première commande' },
      'SAVE20': { percent: 20, description: '20% de réduction' },
      'FREESHIP': { percent: 0, fixed: 500, description: 'Livraison gratuite (5€)' },
      'FLASH50': { percent: 50, description: '50% de réduction flash' },
    };

    const discountConfig = demoCodes[normalizedCode];

    if (!discountConfig) {
      throw new BadRequestException(`Invalid discount code: ${code}`);
    }

    let discountCents = 0;

    if (discountConfig.fixed) {
      // Réduction fixe
      discountCents = Math.min(discountConfig.fixed, subtotalCents);
    } else {
      // Réduction en pourcentage
      discountCents = Math.round((subtotalCents * discountConfig.percent) / 100);
    }

    // Ne pas permettre une réduction supérieure au montant total
    discountCents = Math.min(discountCents, subtotalCents);

    this.logger.log(`Applied discount code ${normalizedCode}: ${discountCents} cents off`);

    return {
      discountCents,
      discountPercent: discountConfig.percent,
      code: normalizedCode,
      type: discountConfig.fixed ? 'fixed' : 'percentage',
      description: discountConfig.description,
    };
  }

  /**
   * Vérifie si un code promo est valide (sans l'appliquer)
   * 
   * @param code - Code promo à vérifier
   * @returns true si le code est valide, false sinon
   * 
   * @example
   * ```typescript
   * const isValid = await discountService.validateDiscountCode('WELCOME10');
   * if (isValid) {
   *   // Afficher le code comme valide dans l'UI
   * }
   * ```
   */
  async validateDiscountCode(code: string): Promise<boolean> {
    try {
      const normalizedCode = code.toUpperCase().trim();
      const demoCodes = ['WELCOME10', 'SAVE20', 'FREESHIP', 'FLASH50'];
      return demoCodes.includes(normalizedCode);
    } catch {
      return false;
    }
  }
}
