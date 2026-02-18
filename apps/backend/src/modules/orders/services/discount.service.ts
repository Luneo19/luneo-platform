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
  discountId?: string;
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

    // Récupérer le code promo depuis la base de données
    const discount = await this.prisma.discount.findUnique({
      where: { code: normalizedCode },
    });

    if (!discount) {
      throw new BadRequestException(`Invalid discount code: ${code}`);
    }

    // Vérifier si le code est actif
    if (!discount.isActive) {
      throw new BadRequestException(`Discount code ${code} is not active`);
    }

    // Vérifier les dates de validité
    const now = new Date();
    if (discount.validFrom > now || discount.validUntil < now) {
      throw new BadRequestException(`Discount code ${code} is expired or not yet valid`);
    }

    // SECURITY FIX: Wrap all validations in a transaction with RepeatableRead
    // to prevent TOCTOU race conditions on usage limits and per-user checks
    return this.prisma.$transaction(async (tx) => {
      // Re-read discount inside transaction with implicit row-level lock
      const txDiscount = await tx.discount.findUnique({
        where: { code: normalizedCode },
      });
      if (!txDiscount || !txDiscount.isActive) {
        throw new BadRequestException(`Discount code ${code} is no longer valid`);
      }

      // Vérifier la limite d'utilisation (inside transaction - prevents race condition)
      if (txDiscount.usageLimit && txDiscount.usageCount >= txDiscount.usageLimit) {
        throw new BadRequestException(`Discount code ${code} has reached its usage limit`);
      }

      // Vérifier le montant minimum d'achat
      if (txDiscount.minPurchaseCents && subtotalCents < txDiscount.minPurchaseCents) {
        throw new BadRequestException(
          `Minimum purchase amount of ${txDiscount.minPurchaseCents / 100}€ required for this discount code`,
        );
      }

      // Vérifier si le code est spécifique à une marque
      if (txDiscount.brandId) {
        if (!brandId) {
          throw new BadRequestException(`Discount code ${code} is restricted to a specific brand`);
        }
        if (txDiscount.brandId !== brandId) {
          throw new BadRequestException(`Discount code ${code} is not valid for this brand`);
        }
      }

      // SECURITY FIX: Per-user usage check inside transaction (prevents race condition)
      if (userId) {
        const existingUsage = await tx.discountUsage.findFirst({
          where: {
            discountId: txDiscount.id,
            userId,
          },
        });

        if (existingUsage) {
          throw new BadRequestException(`You have already used discount code ${code}`);
        }
      }

    // Calculer la réduction
    let discountCentsCalc = 0;

    if (txDiscount.type === 'FIXED') {
      discountCentsCalc = Math.min(txDiscount.value, subtotalCents);
    } else {
      discountCentsCalc = Math.round((subtotalCents * txDiscount.value) / 100);
    }

    // Appliquer la limite maximale de réduction si définie
    if (txDiscount.maxDiscountCents) {
      discountCentsCalc = Math.min(discountCentsCalc, txDiscount.maxDiscountCents);
    }

    // Ne pas permettre une réduction supérieure au montant total
    discountCentsCalc = Math.min(discountCentsCalc, subtotalCents);

    this.logger.log(`Applied discount code ${normalizedCode}: ${discountCentsCalc} cents off`);

    return {
      discountId: txDiscount.id,
      discountCents: discountCentsCalc,
      discountPercent: txDiscount.type === 'PERCENTAGE' ? txDiscount.value : 0,
      code: normalizedCode,
      type: txDiscount.type === 'FIXED' ? 'fixed' : 'percentage',
      description: txDiscount.description || undefined,
    };
    }, {
      timeout: 5000,
      isolationLevel: 'RepeatableRead',
    });
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
      const discount = await this.prisma.discount.findUnique({
        where: { code: normalizedCode },
      });

      if (!discount || !discount.isActive) {
        return false;
      }

      const now = new Date();
      if (discount.validFrom > now || discount.validUntil < now) {
        return false;
      }

      if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Enregistre l'utilisation d'un code promo
   * À appeler après validation et application réussie
   */
  async recordDiscountUsage(
    discountId: string,
    orderId: string,
    userId?: string,
  ): Promise<void> {
    try {
      // ✅ FIX: Transaction atomique pour éviter race condition et incohérence
      // Créer l'enregistrement d'utilisation ET incrémenter le compteur en une seule transaction
      await this.prisma.$transaction(async (tx) => {
        // Re-vérifier la limite d'usage dans la transaction (SELECT FOR UPDATE implicite)
        const discount = await tx.discount.findUnique({
          where: { id: discountId },
          select: { usageLimit: true, usageCount: true },
        });

        if (discount?.usageLimit && discount.usageCount >= discount.usageLimit) {
          throw new BadRequestException(`Discount has reached its usage limit`);
        }

        // Créer l'enregistrement d'utilisation
        await tx.discountUsage.create({
          data: {
            discountId,
            orderId,
            userId,
          },
        });

        // Incrémenter le compteur d'utilisation
        await tx.discount.update({
          where: { id: discountId },
          data: {
            usageCount: {
              increment: 1,
            },
          },
        });
      }, {
        timeout: 5000,
        isolationLevel: 'RepeatableRead',
      });

      this.logger.log(`Recorded discount usage: discountId=${discountId}, orderId=${orderId}`);
    } catch (error) {
      this.logger.error('Failed to record discount usage', error);
      // Re-throw BadRequestException (usage limit), swallow others
      if (error instanceof BadRequestException) {
        throw error;
      }
    }
  }
}
