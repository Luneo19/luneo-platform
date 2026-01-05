import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

@Injectable()
export class BudgetService {
  private readonly logger = new Logger(BudgetService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Vérifie si un brand a un budget suffisant
   */
  async checkBudget(brandId: string, estimatedCostCents: number): Promise<boolean> {
    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
      select: {
        aiCostLimitCents: true,
        aiCostUsedCents: true,
        aiCostResetAt: true,
      },
    });

    if (!brand) {
      throw new BadRequestException(`Brand ${brandId} not found`);
    }

    // Reset monthly si nécessaire
    if (brand.aiCostResetAt && new Date() > brand.aiCostResetAt) {
      await this.resetBudget(brandId);
      return this.checkBudget(brandId, estimatedCostCents); // Recursive call after reset
    }

    const limit = brand.aiCostLimitCents || 500000; // 5000€ default
    const used = brand.aiCostUsedCents || 0;

    if (used + estimatedCostCents > limit) {
      this.logger.warn(
        `Budget exceeded for brand ${brandId}: ${used + estimatedCostCents} > ${limit}`,
      );
      return false;
    }

    return true;
  }

  /**
   * Applique un coût au budget (après génération)
   */
  async enforceBudget(brandId: string, costCents: number): Promise<void> {
    try {
      await this.prisma.brand.update({
        where: { id: brandId },
        data: {
          aiCostUsedCents: {
            increment: costCents,
          },
        },
      });

      this.logger.debug(`Budget enforced for brand ${brandId}: +${costCents} cents`);
    } catch (error) {
      this.logger.error(`Failed to enforce budget for brand ${brandId}:`, error);
      throw error;
    }
  }

  /**
   * Réinitialise le budget mensuel
   */
  async resetBudget(brandId: string): Promise<void> {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    await this.prisma.brand.update({
      where: { id: brandId },
      data: {
        aiCostUsedCents: 0,
        aiCostResetAt: nextMonth,
      },
    });

    this.logger.log(`Budget reset for brand ${brandId}`);
  }

  /**
   * Obtient le budget actuel d'un brand
   */
  async getBudget(brandId: string): Promise<{
    limitCents: number;
    usedCents: number;
    remainingCents: number;
    resetAt: Date | null;
  }> {
    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
      select: {
        aiCostLimitCents: true,
        aiCostUsedCents: true,
        aiCostResetAt: true,
      },
    });

    if (!brand) {
      throw new BadRequestException(`Brand ${brandId} not found`);
    }

    const limit = brand.aiCostLimitCents || 500000;
    const used = brand.aiCostUsedCents || 0;

    return {
      limitCents: limit,
      usedCents: used,
      remainingCents: limit - used,
      resetAt: brand.aiCostResetAt,
    };
  }

  /**
   * Définit la limite de budget pour un brand
   */
  async setBudgetLimit(brandId: string, limitCents: number): Promise<void> {
    await this.prisma.brand.update({
      where: { id: brandId },
      data: {
        aiCostLimitCents: limitCents,
      },
    });

    this.logger.log(`Budget limit set for brand ${brandId}: ${limitCents} cents`);
  }
}






























