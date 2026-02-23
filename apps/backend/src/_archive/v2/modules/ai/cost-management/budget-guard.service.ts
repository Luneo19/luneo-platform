import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { AIBudgetAlert } from '@prisma/client';

export type BudgetWarningLevel = 'none' | 'approaching' | 'critical' | 'exceeded';

export interface BudgetCheckResult {
  allowed: boolean;
  warningLevel: BudgetWarningLevel;
  currentSpend: number;
  budgetLimit: number;
  percentUsed: number;
}

const APPROACHING_THRESHOLD = 80;
const CRITICAL_THRESHOLD = 99;

@Injectable()
export class BudgetGuardService {
  private readonly logger = new Logger(BudgetGuardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async checkBudget(
    userId: string,
    estimatedCostCents: number,
    brandId?: string,
    period: string = 'monthly',
  ): Promise<BudgetCheckResult> {
    const alert = await this.getActiveBudgetAlert(userId, brandId, period);

    if (!alert) {
      return {
        allowed: true,
        warningLevel: 'none',
        currentSpend: 0,
        budgetLimit: 0,
        percentUsed: 0,
      };
    }

    const currentSpend = alert.currentSpend;
    const budgetLimit = alert.budgetLimit;
    const projectedSpend = currentSpend + estimatedCostCents;
    const percentUsed = budgetLimit > 0 ? (currentSpend / budgetLimit) * 100 : 0;
    const projectedPercent =
      budgetLimit > 0 ? (projectedSpend / budgetLimit) * 100 : 0;

    const exceeded = projectedSpend >= budgetLimit && budgetLimit > 0;
    const allowed = !exceeded;

    let warningLevel: BudgetWarningLevel = 'none';
    if (projectedPercent >= 100 || percentUsed >= 100) {
      warningLevel = 'exceeded';
    } else if (projectedPercent >= CRITICAL_THRESHOLD || percentUsed >= CRITICAL_THRESHOLD) {
      warningLevel = 'critical';
    } else if (
      projectedPercent >= APPROACHING_THRESHOLD ||
      percentUsed >= APPROACHING_THRESHOLD
    ) {
      warningLevel = 'approaching';
    }

    return {
      allowed,
      warningLevel,
      currentSpend,
      budgetLimit,
      percentUsed: Math.round(percentUsed * 100) / 100,
    };
  }

  async recordSpend(
    userId: string,
    costCents: number,
    brandId?: string,
    period: string = 'monthly',
  ): Promise<void> {
    const alert = await this.getActiveBudgetAlert(userId, brandId, period);
    if (!alert) {
      this.logger.debug(`No budget alert for user ${userId}, brand ${brandId ?? 'none'}, period ${period}`);
      return;
    }

    const newSpend = alert.currentSpend + costCents;
    await this.prisma.aIBudgetAlert.update({
      where: { id: alert.id },
      data: { currentSpend: newSpend, updatedAt: new Date() },
    });

    const percentUsed =
      alert.budgetLimit > 0 ? (newSpend / alert.budgetLimit) * 100 : 0;

    if (percentUsed >= APPROACHING_THRESHOLD && !alert.alertSent) {
      await this.prisma.aIBudgetAlert.update({
        where: { id: alert.id },
        data: { alertSent: true, alertSentAt: new Date() },
      });
      await this.sendAlertNotification({
        ...alert,
        currentSpend: newSpend,
        alertSent: true,
        alertSentAt: new Date(),
      });
    }
  }

  async createAlert(
    userId: string,
    threshold: number,
    budgetLimit: number,
    period: string,
    brandId?: string,
    notificationEmail?: string,
    webhookUrl?: string,
  ): Promise<AIBudgetAlert> {
    const existing = await this.getActiveBudgetAlert(userId, brandId, period);
    if (existing) {
      return this.prisma.aIBudgetAlert.update({
        where: { id: existing.id },
        data: {
          threshold,
          budgetLimit,
          notificationEmail: notificationEmail ?? existing.notificationEmail,
          webhookUrl: webhookUrl ?? existing.webhookUrl,
          updatedAt: new Date(),
        },
      });
    }

    return this.prisma.aIBudgetAlert.create({
      data: {
        userId,
        brandId,
        threshold,
        thresholdType: 'percentage',
        budgetLimit,
        period,
        notificationEmail,
        webhookUrl,
        isActive: true,
      },
    });
  }

  private async sendAlertNotification(
    alert: AIBudgetAlert & { currentSpend?: number },
  ): Promise<void> {
    const spend = alert.currentSpend ?? 0;
    this.logger.warn(
      `Budget alert: user=${alert.userId} brand=${alert.brandId ?? 'none'} ` +
        `threshold=${alert.threshold}% budgetLimit=${alert.budgetLimit} ` +
        `currentSpend=${spend} period=${alert.period}. Email/webhook integration placeholder.`,
    );
    // TODO: integrate with EmailService and webhook dispatch when available
  }

  private async getActiveBudgetAlert(
    userId: string,
    brandId: string | undefined,
    period: string,
  ): Promise<AIBudgetAlert | null> {
    return this.prisma.aIBudgetAlert.findFirst({
      where: {
        userId,
        ...(brandId != null ? { brandId } : { brandId: null }),
        period,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
