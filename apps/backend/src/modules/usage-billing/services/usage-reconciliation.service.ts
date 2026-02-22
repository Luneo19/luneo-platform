// @ts-nocheck
/**
 * @fileoverview UsageReconciliationService - Reconciliation quotidienne entre
 * les métriques locales (UsageMetric) et Stripe usage records.
 *
 * ARCHITECTURE:
 * - Appelé par un cron BullMQ daily (usage-metering queue, job 'reconciliation')
 * - Compare les totaux locaux avec Stripe pour chaque brand active
 * - Log les écarts et crée des alertes en cas de discrepance > 5%
 * - Ne corrige PAS automatiquement (humain dans la boucle)
 *
 * BEST PRACTICES (Stripe / SaaS):
 * - Stripe est la source de vérité pour la facturation
 * - Les métriques locales sont la source de vérité pour le suivi temps réel
 * - Les écarts signifient un problème de pipeline (queue failure, network issue)
 * - La réconciliation détecte les problèmes mais ne les corrige pas auto
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { UsageMeteringService } from './usage-metering.service';
import { UsageMetricType } from '../interfaces/usage.interface';
import Stripe from 'stripe';

export interface ReconciliationResult {
  brandId: string;
  metric: UsageMetricType;
  localTotal: number;
  stripeTotal: number;
  difference: number;
  differencePercent: number;
  status: 'ok' | 'discrepancy' | 'error';
}

export interface ReconciliationReport {
  runAt: Date;
  brandsChecked: number;
  discrepancies: ReconciliationResult[];
  errors: string[];
}

@Injectable()
export class UsageReconciliationService {
  private readonly logger = new Logger(UsageReconciliationService.name);
  private readonly stripe: Stripe | null;
  private readonly DISCREPANCY_THRESHOLD_PERCENT = 5;

  constructor(
    private readonly prisma: PrismaService,
    private readonly meteringService: UsageMeteringService,
    private readonly configService: ConfigService,
  ) {
    const stripeKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (stripeKey) {
      this.stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });
    } else {
      this.stripe = null;
      this.logger.warn('Stripe not configured, reconciliation will be local-only');
    }
  }

  /**
   * Run daily reconciliation for all active brands.
   */
  async runDailyReconciliation(): Promise<ReconciliationReport> {
    const report: ReconciliationReport = {
      runAt: new Date(),
      brandsChecked: 0,
      discrepancies: [],
      errors: [],
    };

    if (!this.stripe) {
      this.logger.warn('Stripe not configured, skipping reconciliation');
      return report;
    }

    try {
      const activeBrands = await this.prisma.brand.findMany({
        where: {
          stripeCustomerId: { not: null },
          subscriptionStatus: { in: ['ACTIVE', 'TRIALING'] },
        },
        select: {
          id: true,
          stripeCustomerId: true,
          stripeSubscriptionId: true,
          planExpiresAt: true,
        },
      });

      this.logger.log(`Starting reconciliation for ${activeBrands.length} active brands`);

      // Process in batches of 10 for better scalability
      const BATCH_SIZE = 10;
      const eligibleBrands = activeBrands.filter(b => b.stripeCustomerId && b.stripeSubscriptionId);

      for (let i = 0; i < eligibleBrands.length; i += BATCH_SIZE) {
        const batch = eligibleBrands.slice(i, i + BATCH_SIZE);
        const results = await Promise.allSettled(
          batch.map(async (brand) => {
            const brandResults = await this.reconcileBrand(brand);
            return { brandId: brand.id, results: brandResults };
          }),
        );

        for (const result of results) {
          if (result.status === 'fulfilled') {
            report.brandsChecked++;
            const discrepancies = result.value.results.filter(r => r.status === 'discrepancy');
            if (discrepancies.length > 0) {
              report.discrepancies.push(...discrepancies);
              this.logger.warn(
                `Discrepancies found for brand ${result.value.brandId}: ${discrepancies.map(d => `${d.metric}: local=${d.localTotal} stripe=${d.stripeTotal}`).join(', ')}`,
              );
            }
          } else {
            const message = `Failed to reconcile brand in batch: ${result.reason?.message || result.reason}`;
            report.errors.push(message);
            this.logger.error(message);
          }
        }
      }

      this.logger.log(
        `Reconciliation complete: ${report.brandsChecked} brands, ${report.discrepancies.length} discrepancies, ${report.errors.length} errors`,
      );

      // Persist report summary
      if (report.discrepancies.length > 0) {
        await this.notifyDiscrepancies(report);
      }
    } catch (error) {
      report.errors.push(`Fatal error: ${(error as Error).message}`);
      this.logger.error(`Reconciliation failed: ${(error as Error).message}`);
    }

    return report;
  }

  /**
   * Reconcile a single brand's usage between local DB and Stripe.
   */
  private async reconcileBrand(brand: {
    id: string;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    planExpiresAt: Date | null;
  }): Promise<ReconciliationResult[]> {
    const results: ReconciliationResult[] = [];

    if (!this.stripe || !brand.stripeSubscriptionId) return results;

    // Get local usage for the current billing period
    const localUsage = await this.meteringService.getCurrentUsage(brand.id);

    // Get Stripe subscription for comparison
    const metricsToCheck: UsageMetricType[] = [
      'designs_created', 'renders_2d', 'renders_3d', 'ai_generations',
      'api_calls', 'virtual_tryons', 'try_on_screenshots',
    ];

    // Derive billing period
    const now = new Date();
    const periodStart = brand.planExpiresAt
      ? this.derivePeriodStart(brand.planExpiresAt)
      : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

    for (const metric of metricsToCheck) {
      const localTotal = localUsage[metric] || 0;

      if (localTotal === 0) continue; // Skip metrics with no local usage

      try {
        const stripeTotal = await this.meteringService.getStripeUsage(
          brand.id,
          metric,
          periodStart,
          now,
        );

        const difference = Math.abs(localTotal - stripeTotal);
        const differencePercent = localTotal > 0
          ? (difference / localTotal) * 100
          : stripeTotal > 0 ? 100 : 0;

        const status = differencePercent > this.DISCREPANCY_THRESHOLD_PERCENT
          ? 'discrepancy' as const
          : 'ok' as const;

        results.push({
          brandId: brand.id,
          metric,
          localTotal,
          stripeTotal,
          difference,
          differencePercent: Math.round(differencePercent * 100) / 100,
          status,
        });
      } catch {
        results.push({
          brandId: brand.id,
          metric,
          localTotal,
          stripeTotal: -1,
          difference: -1,
          differencePercent: -1,
          status: 'error',
        });
      }
    }

    return results;
  }

  /**
   * Notify about discrepancies (Slack webhook + DB notification).
   */
  private async notifyDiscrepancies(report: ReconciliationReport): Promise<void> {
    const slackUrl = this.configService.get<string>('SLACK_WEBHOOK_URL');
    if (slackUrl) {
      try {
        const summary = report.discrepancies
          .slice(0, 10)
          .map(d => `• *${d.brandId}* / ${d.metric}: local=${d.localTotal}, stripe=${d.stripeTotal} (${d.differencePercent}% off)`)
          .join('\n');

        await fetch(slackUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `⚠️ Usage Reconciliation: ${report.discrepancies.length} discrepancies detected`,
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `*Usage Reconciliation Report*\n${report.brandsChecked} brands checked\n${report.discrepancies.length} discrepancies\n\n${summary}`,
                },
              },
            ],
          }),
        });
      } catch (error) {
        this.logger.warn(`Failed to send Slack notification: ${(error as Error).message}`);
      }
    }
  }

  /**
   * Derive billing period start from planExpiresAt.
   */
  private derivePeriodStart(planExpiresAt: Date): Date {
    const now = new Date();
    const anchorDay = Math.min(new Date(planExpiresAt).getUTCDate(), 28);
    const thisMonthAnchor = new Date(Date.UTC(
      now.getUTCFullYear(), now.getUTCMonth(), anchorDay, 0, 0, 0, 0,
    ));

    if (thisMonthAnchor <= now) {
      return thisMonthAnchor;
    }
    return new Date(Date.UTC(
      now.getUTCFullYear(), now.getUTCMonth() - 1, anchorDay, 0, 0, 0, 0,
    ));
  }
}
