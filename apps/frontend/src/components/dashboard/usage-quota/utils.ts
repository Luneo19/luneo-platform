import type { PlanDefinition, PlanQuotaDefinition, PlanTier } from '@/lib/billing-plans';
import { PLAN_CATALOG, getPlanDefinition } from '@/lib/billing-plans';
import type { UsageSummaryData, TimelineEntry, ProjectionHighlight, PlanCoverageInsight } from './types';

export interface PeriodStats {
  elapsedDays: number;
  totalDays: number;
}

export function computePeriodStats(summary: UsageSummaryData | null): PeriodStats | null {
  if (!summary?.period?.start || !summary?.period?.end) return null;
  const start = new Date(summary.period.start).getTime();
  const end = new Date(summary.period.end).getTime();
  const now = Date.now();
  const totalDays = Math.max(0, Math.ceil((end - start) / (24 * 60 * 60 * 1000)));
  const elapsedDays = Math.max(0, Math.min(totalDays, Math.ceil((now - start) / (24 * 60 * 60 * 1000))));
  return { elapsedDays, totalDays };
}

export function buildTimelineEntries(summary: UsageSummaryData, _plan: PlanDefinition): TimelineEntry[] {
  const entries: TimelineEntry[] = [];
  summary.alerts.forEach((alert, i) => {
    entries.push({
      id: `alert-${i}-${alert.timestamp}`,
      severity: alert.severity,
      title: alert.message,
      description: `Métrique: ${alert.metric}, seuil: ${alert.threshold}`,
      timestampLabel: new Date(alert.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      absoluteDate: new Date(alert.timestamp).toLocaleDateString('fr-FR'),
      suggestion: alert.severity === 'critical' ? 'Envisagez un top-up ou un changement de plan.' : undefined,
    });
  });
  return entries;
}

export function buildProjectionHighlights(
  summary: UsageSummaryData,
  plan: PlanDefinition,
  periodStats: PeriodStats
): ProjectionHighlight[] {
  const { elapsedDays, totalDays } = periodStats;
  const remainingDays = Math.max(0, totalDays - elapsedDays);
  return summary.metrics.map((metric) => {
    const quota = plan.quotas.find((q) => q.metric === metric.type);
    const dailyRate = elapsedDays > 0 ? metric.current / elapsedDays : 0;
    const daysToLimit = dailyRate > 0 && quota ? Math.max(0, (quota.limit - metric.current) / dailyRate) : remainingDays;
    const projectedPercentage = totalDays > 0 && quota ? (metric.current + dailyRate * remainingDays) / quota.limit * 100 : metric.percentage;
    let status: 'ok' | 'warning' | 'critical' = 'ok';
    if (projectedPercentage >= 95 || daysToLimit < 3) status = 'critical';
    else if (projectedPercentage >= 80 || daysToLimit < 7) status = 'warning';
    return {
      id: metric.type,
      metric: metric.type,
      label: quota?.label ?? metric.type,
      projectedPercentage,
      dailyRate,
      daysToLimit,
      status,
    };
  });
}

export function computeRecommendedPlan(summary: UsageSummaryData | null, currentPlan: PlanDefinition | null): PlanDefinition | null {
  if (!summary || !currentPlan) return null;
  const tiers = PLAN_CATALOG.availableTiers;
  const currentIndex = tiers.indexOf(currentPlan.id);
  if (currentIndex < 0 || currentIndex >= tiers.length - 1) return null;
  const hasCritical = summary.metrics.some((m) => m.percentage >= 90);
  if (!hasCritical) return null;
  const nextTier = tiers[currentIndex + 1];
  return nextTier ? getPlanDefinition(nextTier) : null;
}

export function computePlanCoverageInsights(summary: UsageSummaryData | null, currentPlan: PlanDefinition | null): PlanCoverageInsight[] {
  if (!summary || !currentPlan) return [];
  const tiers = PLAN_CATALOG.availableTiers;
  return tiers.map((tierId) => {
    const plan = getPlanDefinition(tierId);
    const limitingMetric = summary.metrics.reduce((a, b) => (a.percentage >= b.percentage ? a : b));
    const quota = plan.quotas.find((q) => q.metric === limitingMetric.type);
    const limitingMetricPercentage = limitingMetric.percentage;
    const limitingMetricLabel = quota?.label ?? limitingMetric.type;
    let status: 'optimal' | 'tense' | 'insufficient' = 'optimal';
    if (limitingMetricPercentage >= 95) status = 'insufficient';
    else if (limitingMetricPercentage >= 75) status = 'tense';
    const deltaPriceCents = plan.basePriceCents - currentPlan.basePriceCents;
    return {
      id: tierId,
      plan,
      limitingMetricLabel,
      limitingMetricPercentage,
      status,
      deltaPriceCents,
      isCurrent: plan.id === currentPlan.id,
    };
  });
}

export function getQuotaLabel(metricType: string, plan: PlanDefinition): string {
  const quota = plan.quotas.find((q) => q.metric === metricType);
  return quota?.label ?? metricType;
}

export function getMetricUnit(metricType: string, plan: PlanDefinition): string {
  const quota = plan.quotas.find((q) => q.metric === metricType);
  return quota?.unit ?? '';
}

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

export const currencyFormatter = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });

export function formatDaysToLimit(days: number): string {
  if (!Number.isFinite(days) || days < 0) return '—';
  if (days >= 365) return '> 1 an';
  if (days >= 30) return `${Math.round(days / 30)} mois`;
  if (days >= 7) return `${Math.round(days / 7)} sem.`;
  return `${Math.round(days)} j`;
}

export function formatMetricLabel(quota: PlanQuotaDefinition): string {
  return quota.label;
}

export function formatUnit(quota: PlanQuotaDefinition): string {
  return quota.unit;
}

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return value.toLocaleString('fr-FR');
}

export function formatRelative(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  if (diffSec < 60) return 'à l\'instant';
  if (diffMin < 60) return `il y a ${diffMin} min`;
  if (diffHour < 24) return `il y a ${diffHour} h`;
  const diffDay = Math.floor(diffHour / 24);
  return `il y a ${diffDay} j`;
}
