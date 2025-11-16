import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  PLAN_CATALOG,
  PLAN_DEFINITIONS,
  type PlanDefinition,
  type PlanTier,
  type UsageMetricType,
} from '@luneo/billing-plans';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { UsageMeteringService } from './usage-metering.service';
import type { UsageSummary } from '../interfaces/usage.interface';
import {
  QuotaMetricsService,
  type QuotaCheckSource,
} from './quota-metrics.service';
import {
  QUOTA_ALERT_EVENT,
  QUOTA_SUMMARY_EVENT,
  type QuotaAlertEventPayload,
  type QuotaSummaryEventPayload,
} from '../events/quota.events';
import { UsageTopUpService } from './usage-topup.service';
import { createHmac, timingSafeEqual } from 'crypto';

const MS_IN_DAY = 86_400_000;

/**
 * Service de gestion des quotas
 * Vérifie les limites par plan et gère les overages
 */
interface QuotaEvaluation {
  allowed: boolean;
  remaining: number;
  limit: number;
  overage: number;
  willCharge: boolean;
  estimatedCost: number;
  planId: PlanDefinition['id'];
  overagePolicy: 'block' | 'charge' | 'none';
}

export interface QuotaEnforcementContext {
  source?: QuotaCheckSource;
}

interface ShareSnapshot {
  brandId: string;
  plan: string;
  overage: number;
  recommendation: string | null;
  pressure: {
    metric: string;
    percentage: number;
  } | null;
  timestamp: string;
}

@Injectable()
export class QuotasService {
  private readonly logger = new Logger(QuotasService.name);
  private readonly shareSecret: string;
  private readonly shareTtlMs: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly meteringService: UsageMeteringService,
    private readonly quotaMetricsService: QuotaMetricsService,
    private readonly eventEmitter: EventEmitter2,
    private readonly topUpService: UsageTopUpService,
    private readonly configService: ConfigService,
  ) {
    this.shareSecret =
      this.configService.get<string>('quota.shareSecret') ??
      this.configService.get<string>('app.secret') ??
      'luneo-share-secret';
    this.shareTtlMs =
      Number(this.configService.get<string>('quota.shareTtlMs')) || 1000 * 60 * 60 * 24;
  }

  /**
   * Vérifier si un brand peut utiliser une métrique
   */
  async checkQuota(
    brandId: string,
    metric: UsageMetricType,
    requestedAmount: number = 1,
  ): Promise<QuotaEvaluation> {
    try {
      // Récupérer le plan du brand
      const brand = await this.prisma.brand.findUnique({
        where: { id: brandId },
        select: { plan: true },
      });

      if (!brand) {
        throw new BadRequestException('Brand not found');
      }

      const planDefinition = this.getPlanDefinitionForBrand(brand.plan);
      const quota = planDefinition.quotas.find((q) => q.metric === metric);

      if (!quota) {
        // Pas de quota défini pour cette métrique = illimité
        const unlimited = 999_999;
        return {
          allowed: true,
          remaining: unlimited,
          limit: unlimited,
          overage: 0,
          willCharge: false,
          estimatedCost: 0,
          planId: planDefinition.id,
          overagePolicy: 'none',
        };
      }

      // Récupérer l'usage actuel
      const currentUsage = await this.meteringService.getCurrentUsage(brandId);
      const used = currentUsage[metric] || 0;
      const periodKey = this.buildPeriodKey();
      const bonusUnits = await this.topUpService.getActiveCredits(brandId, metric, periodKey);
      const effectiveLimit = quota.limit + bonusUnits;

      const remaining = Math.max(0, effectiveLimit - used);
      const overage = Math.max(0, used + requestedAmount - effectiveLimit);

      // Vérifier si l'action est autorisée
      let allowed = true;
      let estimatedCost = 0;

      if (overage > 0) {
        if (quota.overage === 'block') {
          allowed = false;
        } else if (quota.overage === 'charge') {
          allowed = true;
          estimatedCost = overage * (quota.overageRate || 0);
        }
      }

      return {
        allowed,
        remaining,
        limit: quota.limit,
        overage,
        willCharge: quota.overage === 'charge' && overage > 0,
        estimatedCost,
        planId: planDefinition.id,
        overagePolicy: quota.overage,
      };
    } catch (error) {
      this.logger.error(`Failed to check quota: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Vérifier et appliquer le quota (throw si dépassé et bloqué)
   */
  async enforceQuota(
    brandId: string,
    metric: UsageMetricType,
    amount: number = 1,
    context?: QuotaEnforcementContext,
  ): Promise<void> {
    const start = process.hrtime.bigint();
    const check = await this.checkQuota(brandId, metric, amount);
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;

    this.quotaMetricsService.recordQuotaCheck({
      brandId,
      planId: check.planId,
      metric,
      amount,
      allowed: check.allowed,
      overage: check.overage,
      remaining: check.remaining,
      durationMs,
      source: context?.source,
    });

    if (!check.allowed) {
      throw new BadRequestException(
        `Quota exceeded for ${metric}. Limit: ${check.limit}, Used: ${check.limit - check.remaining}. Please upgrade your plan.`,
      );
    }

    if (check.willCharge && check.estimatedCost > 0) {
      this.logger.warn(
        `Brand ${brandId} will be charged ${check.estimatedCost} cents for ${metric} overage`,
      );
    }
  }

  /**
   * Query tenant usage with soft-limit enforcement
   * Returns usage data and indicates if features should be disabled
   */
  async queryTenantUsageWithEnforcement(
    brandId: string,
    enforceSoftLimit: boolean = false,
  ): Promise<{
    brandId: string;
    plan: PlanTier;
    usage: Record<UsageMetricType, { current: number; limit: number; percentage: number }>;
    totalCostCents: number;
    featuresDisabled: string[];
    softLimitReached: boolean;
    recommendations: string[];
  }> {
    const summary = await this.getUsageSummaryWithPlan(brandId);
    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
      select: { plan: true, stripeSubscriptionId: true },
    });

    if (!brand) {
      throw new BadRequestException('Brand not found');
    }

    const plan = PLAN_DEFINITIONS[brand.plan as PlanTier] || PLAN_DEFINITIONS.starter;
    const currentUsage = await this.meteringService.getCurrentUsage(brandId);
    
    // Calculate usage percentages and check soft limits
    const usage: Record<UsageMetricType, { current: number; limit: number; percentage: number }> = {} as any;
    const featuresDisabled: string[] = [];
    let softLimitReached = false;
    const recommendations: string[] = [];

    for (const quota of plan.quotas) {
      const current = currentUsage[quota.metric] || 0;
      const limit = quota.limit;
      const percentage = limit > 0 ? (current / limit) * 100 : 0;
      
      usage[quota.metric] = { current, limit, percentage };

      // Soft limit: disable features at 95% usage
      if (percentage >= 95) {
        softLimitReached = true;
        
        if (enforceSoftLimit) {
          // Disable heavy features based on metric
          if (quota.metric === 'renders_2d' || quota.metric === 'renders_3d') {
            featuresDisabled.push('render');
          }
          if (quota.metric === 'ai_generations') {
            featuresDisabled.push('ai_generation');
          }
          if (quota.metric === 'storage_gb') {
            featuresDisabled.push('storage_upload');
          }
        }

        recommendations.push(
          `${quota.label}: ${percentage.toFixed(1)}% used. Consider upgrading plan or purchasing top-up.`,
        );
      }

      // Hard limit: block at 100%
      if (percentage >= 100 && quota.overage === 'block') {
        if (quota.metric === 'renders_2d' || quota.metric === 'renders_3d') {
          featuresDisabled.push('render');
        }
        if (quota.metric === 'ai_generations') {
          featuresDisabled.push('ai_generation');
        }
      }
    }

    // Calculate total cost from render audit logs
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const renderAuditLogs = await this.prisma.renderAuditLog.findMany({
      where: {
        brandId,
        createdAt: { gte: startOfMonth },
      },
      select: { costCents: true },
    });

    const totalCostCents = renderAuditLogs.reduce((sum, log) => sum + log.costCents, 0);

    return {
      brandId,
      plan: brand.plan as PlanTier,
      usage,
      totalCostCents,
      featuresDisabled: [...new Set(featuresDisabled)], // Remove duplicates
      softLimitReached,
      recommendations,
    };
  }

  /**
   * Récupérer le résumé d'usage complet
   */
  async getUsageSummary(brandId: string): Promise<UsageSummary> {
    try {
      const brand = await this.prisma.brand.findUnique({
        where: { id: brandId },
        select: { plan: true },
      });

      if (!brand) {
        throw new BadRequestException('Brand not found');
      }

      const planDefinition = this.getPlanDefinitionForBrand(brand.plan);
      const currentUsage = await this.meteringService.getCurrentUsage(brandId);
      const period = this.buildBillingPeriod();
      const periodKey = this.buildPeriodKey(period.start);

      const metrics = await Promise.all(
        planDefinition.quotas.map(async (quota) => {
          const current = currentUsage[quota.metric] || 0;
          const bonusUnits = await this.topUpService.getActiveCredits(
            brandId,
            quota.metric,
            periodKey,
          );
          const effectiveLimit = quota.limit + bonusUnits;
          const safeLimit = effectiveLimit > 0 ? effectiveLimit : 0;
          const rawPercentage = safeLimit > 0 ? (current / safeLimit) * 100 : 0;
          const percentage = Number.isFinite(rawPercentage) ? rawPercentage : 0;
          const overage = Math.max(0, current - safeLimit);

          return {
            type: quota.metric,
            current,
            limit: safeLimit,
            percentage: Math.min(100, percentage),
            overage,
          };
        }),
      );

      const overageCost = metrics.reduce((acc, metric) => {
        const quota = planDefinition.quotas.find((def) => def.metric === metric.type);
        if (!quota || metric.overage <= 0 || !quota.overageRate) {
          return acc;
        }
        return acc + metric.overage * quota.overageRate;
      }, 0);

      const estimatedCost = {
        base: planDefinition.basePriceCents,
        usage: 0,
        overage: overageCost,
        total: planDefinition.basePriceCents + overageCost,
      };

      const alerts = metrics.flatMap((metric) => {
        const quotaDefinition = planDefinition.quotas.find(
          (quota) => quota.metric === metric.type,
        );
        if (!quotaDefinition) {
          return [];
        }

        const thresholds = quotaDefinition.notificationThresholds ?? [75, 90];
        const thresholdTriggered = thresholds.find((threshold) => metric.percentage >= threshold);

        if (!thresholdTriggered) {
          return [];
        }

        const severity = thresholdTriggered >= 90 ? ('critical' as const) : ('warning' as const);
        const alert: QuotaAlertEventPayload = {
          brandId,
          planId: planDefinition.id,
          metric: metric.type,
          percentage: metric.percentage,
          remaining: Math.max(metric.limit - metric.current, 0),
          limit: metric.limit,
          overage: metric.overage,
          severity,
          timestamp: new Date().toISOString(),
        };

        this.eventEmitter.emit(QUOTA_ALERT_EVENT, alert);

        return [
          {
            severity,
            message: `${quotaDefinition.label} at ${metric.percentage.toFixed(0)}% of quota`,
            metric: metric.type,
            threshold: thresholdTriggered,
            timestamp: new Date(),
          },
        ];
      });

      const summary: UsageSummary = {
        brandId,
        period,
        metrics,
        estimatedCost,
        alerts,
      };

      const summaryEventPayload: QuotaSummaryEventPayload = {
        brandId,
        plan: planDefinition,
        summary,
      };

      this.eventEmitter.emit(QUOTA_SUMMARY_EVENT, summaryEventPayload);
      this.quotaMetricsService.recordSummary(brandId, planDefinition, summary);

      return summary;
    } catch (error) {
      this.logger.error(
        `Failed to get usage summary: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getUsageSummaryWithPlan(brandId: string): Promise<{
    plan: PlanDefinition;
    summary: UsageSummary;
  }> {
    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
      select: { plan: true },
    });

    if (!brand) {
      throw new BadRequestException('Brand not found');
    }

    const planDefinition = this.getPlanDefinitionForBrand(brand.plan);
    const summary = await this.getUsageSummary(brandId);

    return {
      plan: planDefinition,
      summary,
    };
  }

  getPlanLimits(plan: string): PlanDefinition {
    const normalized = this.normalizePlanTier(plan);
    return PLAN_DEFINITIONS[normalized];
  }

  /**
   * Lister tous les plans disponibles
   */
  getAllPlans(): PlanDefinition[] {
    return PLAN_CATALOG.availableTiers.map((tier) => PLAN_DEFINITIONS[tier]);
  }

  async createShareToken(
    brandId: string,
    ttlMs?: number,
  ): Promise<{ token: string; snapshot: ShareSnapshot; expiresAt: string }> {
    const snapshot = await this.buildShareSnapshot(brandId);
    const expiresAt = new Date(Date.now() + (ttlMs ?? this.shareTtlMs));
    const payload = {
      ...snapshot,
      exp: expiresAt.getTime(),
    };

    const encoded = this.base64UrlEncode(JSON.stringify(payload));
    const signature = this.signSharePayload(encoded);
    return {
      token: `${encoded}.${signature}`,
      snapshot,
      expiresAt: expiresAt.toISOString(),
    };
  }

  resolveShareToken(token: string): ShareSnapshot {
    const [encoded, signature] = token.split('.');
    if (!encoded || !signature) {
      throw new BadRequestException('Invalid share token');
    }

    const expected = this.signSharePayload(encoded);
    const providedBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (
      providedBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(providedBuffer, expectedBuffer)
    ) {
      throw new BadRequestException('Invalid share token signature');
    }

    let payload: ShareSnapshot & { exp?: number };
    try {
      payload = JSON.parse(this.base64UrlDecode(encoded));
    } catch (error) {
      throw new BadRequestException('Malformed share payload');
    }

    if (payload.exp && Date.now() > payload.exp) {
      throw new BadRequestException('Share token expired');
    }

    const { exp, ...snapshot } = payload;
    return snapshot;
  }

  private buildBillingPeriod() {
    const now = new Date();
    const startOfMonth = new Date(now);
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(now);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);

    return {
      start: startOfMonth,
      end: endOfMonth,
      status: 'active' as const,
    };
  }

  private buildPeriodKey(date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  private getPlanDefinitionForBrand(plan?: string | null): PlanDefinition {
    const tier = this.normalizePlanTier(plan);
    return PLAN_DEFINITIONS[tier] ?? PLAN_DEFINITIONS[PLAN_CATALOG.defaultPlan];
  }

  async simulateTopUpImpact(
    brandId: string,
    metric: UsageMetricType,
    units: number,
  ): Promise<{
    brandId: string;
    metric: UsageMetricType;
    unit: string;
    baseLimit: number;
    bonusUnits: number;
    effectiveLimit: number;
    simulatedLimit: number;
    current: number;
    currentPercentage: number;
    simulatedPercentage: number;
    originalDaysToLimit: number | null;
    simulatedDaysToLimit: number | null;
    regainedDays: number | null;
    estimatedCostCents: number | null;
    overagePolicy: 'block' | 'charge' | 'none';
  }> {
    if (units < 0) {
      throw new BadRequestException('Units must be a positive number');
    }

    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
      select: { plan: true },
    });

    if (!brand) {
      throw new BadRequestException('Brand not found');
    }

    const planDefinition = this.getPlanDefinitionForBrand(brand.plan);
    const quota = planDefinition.quotas.find((item) => item.metric === metric);
    if (!quota) {
      throw new BadRequestException('Metric not covered by current plan');
    }

    const currentUsage = await this.meteringService.getCurrentUsage(brandId);
    const current = currentUsage[metric] ?? 0;

    const period = this.buildBillingPeriod();
    const elapsedDays = Math.max(1, (Date.now() - period.start.getTime()) / MS_IN_DAY);
    const dailyRate = current / elapsedDays;

    const periodKey = this.buildPeriodKey(period.start);
    const bonusUnits = await this.topUpService.getActiveCredits(brandId, metric, periodKey);
    const baseLimit = quota.limit;
    const effectiveLimit = baseLimit + bonusUnits;
    const simulatedLimit = effectiveLimit + units;

    const currentPercentage =
      effectiveLimit > 0 ? (current / effectiveLimit) * 100 : current > 0 ? 100 : 0;
    const simulatedPercentage =
      simulatedLimit > 0 ? (current / simulatedLimit) * 100 : currentPercentage;

    const originalDaysToLimit =
      dailyRate > 0 ? (effectiveLimit - current) / dailyRate : null;
    const simulatedDaysToLimit =
      dailyRate > 0 ? (simulatedLimit - current) / dailyRate : null;
    const regainedDays =
      originalDaysToLimit !== null && simulatedDaysToLimit !== null
        ? simulatedDaysToLimit - originalDaysToLimit
        : null;

    const estimatedCostCents =
      quota.overage === 'charge' && quota.overageRate ? quota.overageRate * units : null;

    return {
      brandId,
      metric,
      unit: quota.unit,
      baseLimit,
      bonusUnits,
      effectiveLimit,
      simulatedLimit,
      current,
      currentPercentage,
      simulatedPercentage,
      originalDaysToLimit,
      simulatedDaysToLimit,
      regainedDays,
      estimatedCostCents,
      overagePolicy: quota.overage ?? 'block',
    };
  }

  private normalizePlanTier(plan?: string | null): PlanTier {
    if (!plan) {
      return PLAN_CATALOG.defaultPlan;
    }

    const normalized = plan.toLowerCase() as PlanTier;
    if (PLAN_CATALOG.availableTiers.includes(normalized)) {
      return normalized;
    }

    return PLAN_CATALOG.defaultPlan;
  }

  private async buildShareSnapshot(brandId: string): Promise<ShareSnapshot> {
    const { plan, summary } = await this.getUsageSummaryWithPlan(brandId);
    const recommendation = this.computeRecommendedPlan(plan, summary);
    const pressure = [...summary.metrics].sort((a, b) => b.percentage - a.percentage)[0];

    return {
      brandId,
      plan: plan.name,
      overage: summary.estimatedCost.overage,
      recommendation: recommendation?.name ?? null,
      pressure: pressure
        ? {
            metric: plan.quotas.find((quota) => quota.metric === pressure.type)?.label ?? pressure.type,
            percentage: pressure.percentage,
          }
        : null,
      timestamp: new Date().toISOString(),
    };
  }

  private computeRecommendedPlan(planDefinition: PlanDefinition, summary: UsageSummary) {
    const tiers = PLAN_CATALOG.availableTiers;
    const currentIndex = tiers.indexOf(planDefinition.id);
    const needsUpgrade = summary.metrics.some(
      (metric) => metric.percentage >= 85 || metric.overage > 0,
    );

    if (!needsUpgrade || currentIndex === -1) {
      return null;
    }

    for (let i = currentIndex + 1; i < tiers.length; i++) {
      const candidate = PLAN_DEFINITIONS[tiers[i]];
      const stillTense = summary.metrics.some((metric) => {
        const quota = candidate.quotas.find((q) => q.metric === metric.type);
        if (!quota) {
          return false;
        }
        const projectedRatio = quota.limit > 0 ? (metric.current / quota.limit) * 100 : 0;
        return projectedRatio >= 90;
      });

      if (!stillTense) {
        return candidate;
      }
    }

    return PLAN_DEFINITIONS[tiers[tiers.length - 1]];
  }

  private signSharePayload(encodedPayload: string): string {
    return createHmac('sha256', this.shareSecret).update(encodedPayload).digest('base64url');
  }

  private base64UrlEncode(value: string): string {
    return Buffer.from(value).toString('base64url');
  }

  private base64UrlDecode(value: string): string {
    return Buffer.from(value, 'base64url').toString('utf-8');
  }
}
