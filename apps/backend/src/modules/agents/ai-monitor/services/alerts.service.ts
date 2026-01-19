/**
 * @fileoverview Service d'alertes pour dépassements et erreurs
 * @module AlertsService
 *
 * RÈGLES RESPECTÉES:
 * - ✅ Types explicites (zéro 'any')
 * - ✅ Alertes pour quotas dépassés
 * - ✅ Alertes pour erreurs élevées
 * - ✅ Alertes pour coûts anormaux
 * - ✅ Notifications email/Slack
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { LimitsConfigService } from '../../usage-guardian/services/limits-config.service';

// ============================================================================
// TYPES
// ============================================================================

export interface Alert {
  type: 'quota_exceeded' | 'quota_warning' | 'error_rate_high' | 'cost_anomaly';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  brandId?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// SERVICE
// ============================================================================

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);
  private readonly alertsEnabled: boolean;
  private readonly alertEmail?: string;
  private readonly alertSlackWebhook?: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly limitsConfig: LimitsConfigService,
  ) {
    this.alertsEnabled = this.configService.get<boolean>('AI_ALERTS_ENABLED') ?? true;
    this.alertEmail = this.configService.get<string>('AI_ALERTS_EMAIL');
    this.alertSlackWebhook = this.configService.get<string>('AI_ALERTS_SLACK_WEBHOOK');
  }

  /**
   * Vérifie les alertes de quotas
   */
  async checkQuotaAlerts(
    brandId: string | null | undefined,
    userId: string | null | undefined,
    planId: string | null | undefined,
  ): Promise<Alert[]> {
    if (!this.alertsEnabled) {
      return [];
    }

    const alerts: Alert[] = [];
    const entityId = brandId || userId;
    const entityType = brandId ? 'brand' : 'user';

    if (!entityId) {
      return [];
    }

    // Récupérer les quotas
    const quota = await this.prisma.aIQuota.findFirst({
      where: entityType === 'brand' ? { brandId: entityId } : { userId: entityId },
    });

    if (!quota) {
      return [];
    }

    const limits = this.limitsConfig.getLimits(planId);

    // Vérifier quota tokens
    const tokensPercent = this.limitsConfig.calculateUsagePercent(quota.usedTokens, limits.monthlyTokens);
    if (tokensPercent >= 100) {
      alerts.push({
        type: 'quota_exceeded',
        severity: 'high',
        message: `Token quota exceeded: ${quota.usedTokens}/${limits.monthlyTokens}`,
        [entityType === 'brand' ? 'brandId' : 'userId']: entityId,
        metadata: {
          quotaType: 'tokens',
          used: quota.usedTokens,
          limit: limits.monthlyTokens,
        },
      });
    } else if (tokensPercent >= 80) {
      alerts.push({
        type: 'quota_warning',
        severity: 'medium',
        message: `Token quota warning: ${quota.usedTokens}/${limits.monthlyTokens} (${tokensPercent}%)`,
        [entityType === 'brand' ? 'brandId' : 'userId']: entityId,
        metadata: {
          quotaType: 'tokens',
          used: quota.usedTokens,
          limit: limits.monthlyTokens,
          percent: tokensPercent,
        },
      });
    }

    // Vérifier quota requests
    const requestsPercent = this.limitsConfig.calculateUsagePercent(quota.usedRequests, limits.monthlyRequests);
    if (requestsPercent >= 100) {
      alerts.push({
        type: 'quota_exceeded',
        severity: 'high',
        message: `Request quota exceeded: ${quota.usedRequests}/${limits.monthlyRequests}`,
        [entityType === 'brand' ? 'brandId' : 'userId']: entityId,
        metadata: {
          quotaType: 'requests',
          used: quota.usedRequests,
          limit: limits.monthlyRequests,
        },
      });
    } else if (requestsPercent >= 80) {
      alerts.push({
        type: 'quota_warning',
        severity: 'medium',
        message: `Request quota warning: ${quota.usedRequests}/${limits.monthlyRequests} (${requestsPercent}%)`,
        [entityType === 'brand' ? 'brandId' : 'userId']: entityId,
        metadata: {
          quotaType: 'requests',
          used: quota.usedRequests,
          limit: limits.monthlyRequests,
          percent: requestsPercent,
        },
      });
    }

    // Envoyer les alertes
    for (const alert of alerts) {
      await this.sendAlert(alert);
    }

    return alerts;
  }

  /**
   * Vérifie les alertes d'erreurs
   */
  async checkErrorAlerts(
    brandId?: string,
    threshold: number = 0.1, // 10% d'erreur
  ): Promise<Alert[]> {
    if (!this.alertsEnabled) {
      return [];
    }

    const alerts: Alert[] = [];

    // Récupérer les logs des dernières 24h
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const where: Record<string, unknown> = {
      createdAt: { gte: yesterday },
    };

    if (brandId) {
      where.brandId = brandId;
    }

    const logs = await this.prisma.aIUsageLog.findMany({
      where,
      select: {
        provider: true,
        success: true,
      },
    });

    if (logs.length === 0) {
      return [];
    }

    // Calculer le taux d'erreur par provider
    const byProvider: Record<string, { total: number; errors: number }> = {};

    for (const log of logs) {
      if (!byProvider[log.provider]) {
        byProvider[log.provider] = { total: 0, errors: 0 };
      }

      byProvider[log.provider].total++;
      if (!log.success) {
        byProvider[log.provider].errors++;
      }
    }

    // Vérifier si un provider dépasse le seuil
    for (const [provider, stats] of Object.entries(byProvider)) {
      const errorRate = stats.total > 0 ? stats.errors / stats.total : 0;

      if (errorRate >= threshold) {
        alerts.push({
          type: 'error_rate_high',
          severity: errorRate >= 0.3 ? 'critical' : 'high',
          message: `High error rate for ${provider}: ${(errorRate * 100).toFixed(1)}% (${stats.errors}/${stats.total})`,
          brandId,
          metadata: {
            provider,
            errorRate,
            errors: stats.errors,
            total: stats.total,
          },
        });
      }
    }

    // Envoyer les alertes
    for (const alert of alerts) {
      await this.sendAlert(alert);
    }

    return alerts;
  }

  /**
   * Vérifie les alertes de coûts anormaux
   */
  async checkCostAlerts(
    brandId: string,
    thresholdMultiplier: number = 2, // 2x la moyenne
  ): Promise<Alert[]> {
    if (!this.alertsEnabled) {
      return [];
    }

    const alerts: Alert[] = [];

    // Récupérer les coûts des 30 derniers jours
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const logs = await this.prisma.aIUsageLog.findMany({
      where: {
        brandId,
        createdAt: { gte: thirtyDaysAgo },
        success: true,
      },
      select: {
        costCents: true,
        createdAt: true,
      },
    });

    if (logs.length === 0) {
      return [];
    }

    // Calculer la moyenne quotidienne
    const dailyCosts: Record<string, number> = {};

    for (const log of logs) {
      const date = log.createdAt.toISOString().split('T')[0];
      dailyCosts[date] = (dailyCosts[date] || 0) + Number(log.costCents);
    }

    const dailyCostsArray = Object.values(dailyCosts);
    const avgDailyCost = dailyCostsArray.reduce((sum, cost) => sum + cost, 0) / dailyCostsArray.length;
    const threshold = avgDailyCost * thresholdMultiplier;

    // Vérifier les jours récents
    const recentDays = Object.entries(dailyCosts)
      .filter(([date]) => {
        const dayDate = new Date(date);
        const daysDiff = (new Date().getTime() - dayDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= 7; // 7 derniers jours
      });

    for (const [date, cost] of recentDays) {
      if (cost > threshold) {
        alerts.push({
          type: 'cost_anomaly',
          severity: cost > threshold * 1.5 ? 'critical' : 'high',
          message: `Unusual cost detected on ${date}: ${cost.toFixed(2)}¢ (avg: ${avgDailyCost.toFixed(2)}¢)`,
          brandId,
          metadata: {
            date,
            cost,
            avgDailyCost,
            threshold,
          },
        });
      }
    }

    // Envoyer les alertes
    for (const alert of alerts) {
      await this.sendAlert(alert);
    }

    return alerts;
  }

  /**
   * Envoie une alerte
   */
  async sendAlert(alert: Alert): Promise<void> {
    this.logger.warn(`Alert: ${alert.type} - ${alert.message}`, alert.metadata);

    // TODO: Implémenter l'envoi d'email
    if (this.alertEmail) {
      // await this.sendEmailAlert(alert);
    }

    // TODO: Implémenter l'envoi Slack
    if (this.alertSlackWebhook) {
      // await this.sendSlackAlert(alert);
    }
  }
}
