import { Injectable, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { PrometheusService } from './prometheus.service';

/** Minimal shape for prom-client Gauge */
interface PromGauge {
  set(labelsOrValue: Record<string, string> | number, value?: number): void;
}
/** Minimal shape for prom-client Counter */
interface PromCounter {
  inc(labelsOrValue?: number | Record<string, string>, value?: number): void;
}

let Gauge: new (opts: { name: string; help: string; labelNames?: string[]; registers?: unknown[] }) => PromGauge | undefined;
let Counter: new (opts: { name: string; help: string; labelNames?: string[]; registers?: unknown[] }) => PromCounter | undefined;
try {
  const promClient = require('prom-client');
  Gauge = promClient.Gauge;
  Counter = promClient.Counter;
} catch {
  // prom-client optional
}

/**
 * Business KPI metrics for Prometheus / Grafana.
 * Exposes: active subscriptions, read-only brands, credits consumed, pending payouts, marketplace sales.
 */
@Injectable()
export class BusinessMetricsService implements OnModuleInit {
  private activeSubscriptions: PromGauge | undefined;
  private readOnlyBrands: PromGauge | undefined;
  private totalCreditsConsumed: PromCounter | undefined;
  private pendingPayouts: PromGauge | undefined;
  private marketplaceSales: PromCounter | undefined;
  private monthlyRevenueCents: PromGauge | undefined;
  private churnRate: PromGauge | undefined;
  private monthlyCommissionCents: PromGauge | undefined;
  private commissionByPlan: PromGauge | undefined;

  constructor(
    private readonly prisma: PrismaService,
    private readonly prometheus: PrometheusService,
  ) {}

  onModuleInit() {
    const registry = this.prometheus.getRegistry();
    if (!registry || !Gauge || !Counter) return;

    const reg = registry ? [registry] : [];
    this.activeSubscriptions = new Gauge({
      name: 'luneo_active_subscriptions',
      help: 'Number of active subscriptions',
      labelNames: ['plan'],
      registers: reg,
    });
    this.readOnlyBrands = new Gauge({
      name: 'luneo_brands_read_only_mode',
      help: 'Brands in read-only mode (grace period)',
      registers: reg,
    });
    this.totalCreditsConsumed = new Counter({
      name: 'luneo_credits_consumed_total',
      help: 'Total credits consumed',
      registers: reg,
    });
    this.pendingPayouts = new Gauge({
      name: 'luneo_pending_payouts',
      help: 'Number of pending marketplace payouts',
      registers: reg,
    });
    this.marketplaceSales = new Counter({
      name: 'luneo_marketplace_sales_total',
      help: 'Total marketplace sales count',
      labelNames: ['seller_id'],
      registers: reg,
    });
    this.monthlyRevenueCents = new Gauge({
      name: 'luneo_monthly_revenue_cents',
      help: 'Sum of paid invoices this month (cents)',
      registers: reg,
    });
    this.churnRate = new Gauge({
      name: 'luneo_churn_rate',
      help: 'Churn rate (cancelled brands / total brands)',
      registers: reg,
    });
    // Marketplace (for marketplace dashboard)
    this.monthlyCommissionCents = new Gauge({
      name: 'luneo_marketplace_commissions_cents_total',
      help: 'Total marketplace commissions (cents)',
      registers: reg,
    });
    this.commissionByPlan = new Gauge({
      name: 'luneo_marketplace_commission_by_plan_cents',
      help: 'Commission by plan (cents)',
      labelNames: ['plan'],
      registers: reg,
    });
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async collectMetrics() {
    if (!this.activeSubscriptions) return;

    try {
      // Active subscriptions by plan
      const subscriptionsByPlan = await this.prisma.brand.groupBy({
        by: ['subscriptionPlan'],
        where: { subscriptionStatus: 'ACTIVE', deletedAt: null },
        _count: true,
      });
      for (const group of subscriptionsByPlan) {
        const plan = String(group.subscriptionPlan ?? 'unknown');
        this.activeSubscriptions.set({ plan }, group._count);
      }
      const plans = ['FREE', 'STARTER', 'PROFESSIONAL', 'BUSINESS', 'ENTERPRISE'];
      for (const plan of plans) {
        if (!subscriptionsByPlan.some((g) => String(g.subscriptionPlan) === plan)) {
          this.activeSubscriptions.set({ plan }, 0);
        }
      }

      const readOnlyCount = await this.prisma.brand.count({
        where: { readOnlyMode: true, deletedAt: null },
      });
      this.readOnlyBrands?.set(readOnlyCount);

      const pendingPayoutCount = await this.prisma.marketplacePurchase.count({
        where: { payoutStatus: 'PENDING' },
      });
      this.pendingPayouts?.set(pendingPayoutCount);

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const agg = await this.prisma.invoice.aggregate({
        where: {
          status: 'paid',
          paidAt: { gte: startOfMonth, lte: now },
        },
        _sum: { amount: true },
      });
      const cents = agg._sum?.amount != null ? Math.round(Number(agg._sum.amount) * 100) : 0;
      this.monthlyRevenueCents?.set(cents);

      const [cancelled, total] = await Promise.all([
        this.prisma.brand.count({ where: { subscriptionStatus: 'CANCELED', deletedAt: null } }),
        this.prisma.brand.count({ where: { deletedAt: null } }),
      ]);
      this.churnRate?.set(total > 0 ? cancelled / total : 0);

      // Total marketplace commissions (all-time sum for stat; dashboard can use as total)
      const commissionAgg = await this.prisma.marketplacePurchase.aggregate({
        where: { payoutStatus: { in: ['PENDING', 'COMPLETED'] } },
        _sum: { commissionCents: true },
      });
      const totalCommissionCents = commissionAgg._sum?.commissionCents ?? 0;
      if (this.monthlyCommissionCents) this.monthlyCommissionCents.set(totalCommissionCents);
      // Commission by plan not on purchase; set default so panel exists
      if (this.commissionByPlan) this.commissionByPlan.set({ plan: 'default' }, totalCommissionCents);
    } catch (err) {
      if (typeof err === 'object' && err !== null && 'message' in err) {
        require('@nestjs/common').Logger.warn?.(
          `BusinessMetricsService collectMetrics failed: ${(err as Error).message}`,
        );
      }
    }
  }

  recordCreditsConsumed(amount: number) {
    if (this.totalCreditsConsumed && amount > 0) this.totalCreditsConsumed.inc(amount);
  }

  recordMarketplaceSale(sellerId: string) {
    if (this.marketplaceSales) this.marketplaceSales.inc({ seller_id: sellerId });
  }
}
