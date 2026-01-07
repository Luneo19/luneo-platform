import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

@Injectable()
export class SLAEnforcementService {
  private readonly logger = new Logger(SLAEnforcementService.name);

  // Configuration SLA par niveau
  private readonly SLA_CONFIG = {
    basic: {
      penaltyRate: 0.05, // 5% du montant
      bonusRate: 0.0, // Pas de bonus
      maxPenalty: 0.1, // 10% max
    },
    standard: {
      penaltyRate: 0.03, // 3%
      bonusRate: 0.02, // 2%
      maxPenalty: 0.08,
    },
    premium: {
      penaltyRate: 0.02, // 2%
      bonusRate: 0.03, // 3%
      maxPenalty: 0.05,
    },
    enterprise: {
      penaltyRate: 0.01, // 1%
      bonusRate: 0.05, // 5%
      maxPenalty: 0.03,
    },
  };

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Évalue le SLA d'un work order
   */
  async evaluateSLA(workOrderId: string) {
    const workOrder = await this.prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: { artisan: true },
    });

    if (!workOrder || !workOrder.slaDeadline) {
      throw new Error(`WorkOrder ${workOrderId} not found or no SLA deadline`);
    }

    const artisan = workOrder.artisan;
    const slaLevel = artisan.slaLevel || 'standard';
    const config = this.SLA_CONFIG[slaLevel];

    const now = new Date();
    const deadline = workOrder.slaDeadline;
    const completedAt = workOrder.completedAt;

    let onTime = false;
    let delayHours = 0;
    let penaltyCents = 0;
    let bonusCents = 0;
    let reason = '';

    if (completedAt) {
      // Commande terminée
      if (completedAt <= deadline) {
        onTime = true;
        delayHours = 0;

        // Bonus si terminé en avance
        const hoursEarly = (deadline.getTime() - completedAt.getTime()) / (1000 * 60 * 60);
        if (hoursEarly >= 24) {
          // 24h+ en avance
          bonusCents = Math.round(
            (workOrder.payoutAmountCents || 0) * config.bonusRate,
          );
          reason = `Completed ${Math.round(hoursEarly)} hours early`;
        }
      } else {
        onTime = false;
        delayHours = (completedAt.getTime() - deadline.getTime()) / (1000 * 60 * 60);

        // Pénalité basée sur le retard
        const penaltyRate = Math.min(
          config.penaltyRate * (1 + delayHours / 24), // +1% par jour de retard
          config.maxPenalty,
        );

        penaltyCents = Math.round((workOrder.payoutAmountCents || 0) * penaltyRate);
        reason = `Delayed by ${Math.round(delayHours)} hours`;
      }
    } else {
      // Commande en cours
      if (now > deadline) {
        onTime = false;
        delayHours = (now.getTime() - deadline.getTime()) / (1000 * 60 * 60);

        // Pénalité pour retard en cours
        const penaltyRate = Math.min(
          config.penaltyRate * (1 + delayHours / 24),
          config.maxPenalty,
        );

        penaltyCents = Math.round((workOrder.payoutAmountCents || 0) * penaltyRate);
        reason = `Currently delayed by ${Math.round(delayHours)} hours`;
      } else {
        onTime = true; // Pas encore en retard
        reason = 'On track';
      }
    }

    // Créer ou mettre à jour le SLA record
    const slaRecord = await this.prisma.sLARecord.upsert({
      where: { workOrderId },
      create: {
        workOrderId,
        artisanId: artisan.id,
        deadline,
        completedAt: completedAt || null,
        onTime,
        delayHours: Math.round(delayHours),
        penaltyCents,
        bonusCents,
        reason,
      },
      update: {
        completedAt: completedAt || null,
        onTime,
        delayHours: Math.round(delayHours),
        penaltyCents,
        bonusCents,
        reason,
      },
    });

    // Mettre à jour le work order
    await this.prisma.workOrder.update({
      where: { id: workOrderId },
      data: {
        slaMet: onTime,
        slaPenaltyCents: penaltyCents,
        slaBonusCents: bonusCents,
      },
    });

    // Mettre à jour les stats de l'artisan
    await this.updateArtisanStats(artisan.id, onTime, delayHours);

    this.logger.log(
      `SLA evaluated for workOrder ${workOrderId}: ${onTime ? 'MET' : 'FAILED'}, penalty: ${penaltyCents}cents, bonus: ${bonusCents}cents`,
    );

    return slaRecord;
  }

  /**
   * Met à jour les statistiques de l'artisan
   */
  private async updateArtisanStats(artisanId: string, onTime: boolean, delayHours: number) {
    const artisan = await this.prisma.artisan.findUnique({
      where: { id: artisanId },
    });

    if (!artisan) {
      return;
    }

    // Calculer le nouveau taux de livraison à temps
    const totalOrders = artisan.totalOrders || 0;
    const completedOrders = artisan.completedOrders || 0;
    const currentOnTimeRate = artisan.onTimeDeliveryRate || 1.0;

    // Mise à jour simple (moyenne mobile)
    const newOnTimeRate = totalOrders > 0
      ? (currentOnTimeRate * (totalOrders - 1) + (onTime ? 1 : 0)) / totalOrders
      : (onTime ? 1 : 0);

    await this.prisma.artisan.update({
      where: { id: artisanId },
      data: {
        onTimeDeliveryRate: newOnTimeRate,
        totalOrders: totalOrders + 1,
        completedOrders: completedOrders + (onTime ? 1 : 0),
      },
    });
  }

  /**
   * Évalue tous les SLA en cours (scheduler)
   */
  async evaluateAllActiveSLAs() {
    const activeWorkOrders = await this.prisma.workOrder.findMany({
      where: {
        status: { in: ['assigned', 'accepted', 'in_progress', 'qc_pending'] },
        slaDeadline: { not: null },
      },
      include: { artisan: true },
    });

    for (const workOrder of activeWorkOrders) {
      try {
        await this.evaluateSLA(workOrder.id);
      } catch (error) {
        this.logger.error(`Failed to evaluate SLA for workOrder ${workOrder.id}:`, error);
      }
    }
  }

  /**
   * Applique les pénalités/bonus au payout
   */
  async applySLAToPayout(payoutId: string) {
    const payout = await this.prisma.payout.findUnique({
      where: { id: payoutId },
      include: {
        artisan: true,
      },
    });

    if (!payout) {
      throw new Error(`Payout ${payoutId} not found`);
    }

    // Récupérer les SLA records pour les work orders
    const slaRecords = await this.prisma.sLARecord.findMany({
      where: {
        workOrderId: { in: payout.workOrderIds },
      },
    });

    const totalPenalties = slaRecords.reduce((sum, record) => sum + record.penaltyCents, 0);
    const totalBonuses = slaRecords.reduce((sum, record) => sum + record.bonusCents, 0);

    // Ajuster le montant du payout
    const adjustedAmount = payout.amountCents - totalPenalties + totalBonuses;
    const adjustedNet = adjustedAmount - payout.feesCents;

    await this.prisma.payout.update({
      where: { id: payoutId },
      data: {
        amountCents: adjustedAmount,
        netAmountCents: adjustedNet,
      },
    });

    return { totalPenalties, totalBonuses, adjustedAmount, adjustedNet };
  }
}
































