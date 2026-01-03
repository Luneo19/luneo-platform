import React, { useCallback, useEffect, useMemo, useRef, useState, memo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import jsPDF from 'jspdf';
import {
  PLAN_CATALOG,
  PLAN_DEFINITIONS,
  type PlanDefinition,
  type PlanQuotaDefinition,
  type PlanTier,
  type UsageMetricType,
} from '@/lib/billing-plans';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Download,
  Mail,
  Share2,
  Shield,
  Zap,
  Server,
  Activity,
  Clock3,
  TrendingUp,
  Sparkles,
} from 'lucide-react';

import { useUsageSummary, type UsageSummaryMetric } from '@/lib/hooks/useUsageSummary';
import { useRealtimeMetrics } from '@/hooks/useRealtimeMetrics';
import { useTopupSimulation } from '@/lib/hooks/useTopupSimulation';
import { useTopupHistory } from '@/lib/hooks/useTopupHistory';
import { api } from '@/lib/api/client';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

const metricIcons: Record<string, React.ReactNode> = {
  designs_created: <Zap className="h-4 w-4 text-violet-400" />,
  renders_2d: <Server className="h-4 w-4 text-cyan-400" />,
  renders_3d: <Shield className="h-4 w-4 text-emerald-400" />,
  ai_generations: <Zap className="h-4 w-4 text-pink-400" />,
  storage_gb: <Server className="h-4 w-4 text-amber-400" />,
  api_calls: <Zap className="h-4 w-4 text-blue-400" />,
  team_members: <Shield className="h-4 w-4 text-slate-300" />,
};

const currencyFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat('fr-FR');
const relativeTimeFormatter = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' });
const MS_IN_DAY = 86_400_000;

type UsageSummaryData = NonNullable<ReturnType<typeof useUsageSummary>['summary']>;

type TimelineEntry = {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  timestampLabel: string;
  absoluteDate: string;
  suggestion?: string;
};

type ProjectionHighlight = {
  id: string;
  metric: string;
  label: string;
  projectedPercentage: number;
  dailyRate: number;
  daysToLimit: number;
  status: 'ok' | 'warning' | 'critical';
};

type PlanCoverageInsight = {
  id: PlanTier;
  plan: PlanDefinition;
  limitingMetricLabel: string;
  limitingMetricPercentage: number;
  status: 'optimal' | 'tense' | 'insufficient';
  deltaPriceCents: number;
  isCurrent: boolean;
};

type TopUpSimulation = {
  metricLabel: string;
  originalPercentage: number;
  simulatedPercentage: number;
  originalDaysToLimit: number | null;
  simulatedDaysToLimit: number | null;
  regainedDays: number | null;
  estimatedCostCents: number | null;
  unit: string;
};

function formatCurrency(amountCents: number): string {
  return currencyFormatter.format(amountCents / 100);
}

function formatNumber(value: number): string {
  return numberFormatter.format(Math.max(0, Math.round(value)));
}

function formatRelative(date: Date): string {
  const diff = date.getTime() - Date.now();
  const diffMinutes = Math.round(diff / 60000);
  if (Math.abs(diffMinutes) < 60) {
    return relativeTimeFormatter.format(diffMinutes, 'minute');
  }
  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return relativeTimeFormatter.format(diffHours, 'hour');
  }
  const diffDays = Math.round(diffHours / 24);
  return relativeTimeFormatter.format(diffDays, 'day');
}

function formatMetricLabel(quota: PlanQuotaDefinition): string {
  return quota.label;
}

function formatUnit(quota: PlanQuotaDefinition): string {
  return quota.unit;
}

function getQuotaLabel(metric: string, plan: PlanDefinition): string {
  return plan.quotas.find((quota) => quota.metric === metric)?.label ?? metric;
}

function getMetricUnit(metric: string, plan: PlanDefinition): string {
  return plan.quotas.find((quota) => quota.metric === metric)?.unit ?? '';
}

function getProjectionStatus(value: number): 'ok' | 'warning' | 'critical' {
  if (!Number.isFinite(value)) {
    return 'ok';
  }
  if (value >= 105) {
    return 'critical';
  }
  if (value >= 90) {
    return 'warning';
  }
  return 'ok';
}

function formatDaysToLimit(days: number): string {
  if (!Number.isFinite(days)) {
    return 'Stable';
  }
  if (days < 0) {
    return 'Limite atteinte';
  }
  if (days < 1) {
    return 'Sous 24h';
  }
  return `${Math.round(days)} j`;
}

function computePeriodStats(summary: UsageSummaryData | null) {
  if (!summary) {
    return null;
  }
  const start = new Date(summary.period.start);
  const end = new Date(summary.period.end);
  const now = new Date();
  const totalDays = Math.max(1, (end.getTime() - start.getTime()) / MS_IN_DAY);
  const elapsedDays = Math.min(
    totalDays,
    Math.max(1, (now.getTime() - start.getTime()) / MS_IN_DAY),
  );
  const remainingDays = Math.max(0, totalDays - elapsedDays);
  return { totalDays, elapsedDays, remainingDays };
}

function buildTimelineEntries(summary: UsageSummaryData, plan: PlanDefinition): TimelineEntry[] {
  if (!summary.alerts?.length) {
    return [
      {
        id: 'stable',
        severity: 'info',
        title: 'Consommation stable',
        description: 'Aucune alerte déclenchée sur la période en cours.',
        timestampLabel: 'À jour',
        absoluteDate: new Date(summary.period.start).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'short',
        }),
        suggestion: 'Continuez à surveiller vos indicateurs clés depuis ce cockpit.',
      },
    ];
  }

  return [...summary.alerts]
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
    .map((alert, index) => {
      const date = new Date(alert.timestamp);
      const label = getQuotaLabel(alert.metric, plan);
      return {
        id: `${alert.metric}-${alert.threshold}-${index}`,
        severity: alert.severity,
        title: label,
        description: alert.message,
        timestampLabel: formatRelative(date),
        absoluteDate: date.toLocaleString('fr-FR', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        }),
        suggestion:
          alert.severity === 'critical'
            ? 'Planifier un top-up ou un upgrade immédiat.'
            : 'Mettre sous surveillance et déclencher un rappel auto.',
      };
    });
}

function buildProjectionHighlights(
  summary: UsageSummaryData,
  plan: PlanDefinition,
  stats: { totalDays: number; elapsedDays: number },
): ProjectionHighlight[] {
  return summary.metrics
    .map((metric) => {
      const dailyRate = metric.current / Math.max(1, stats.elapsedDays);
      const projectedUnits = dailyRate * stats.totalDays;
      const projectedPercentage =
        metric.limit > 0 ? (projectedUnits / metric.limit) * 100 : 0;
      const daysToLimit =
        dailyRate > 0 ? (metric.limit - metric.current) / dailyRate : Infinity;
      return {
        id: metric.type,
        metric: metric.type,
        label: getQuotaLabel(metric.type, plan),
        projectedPercentage,
        dailyRate,
        daysToLimit,
        status: getProjectionStatus(projectedPercentage),
      };
    })
    .sort((a, b) => b.projectedPercentage - a.projectedPercentage);
}

function computeRecommendedPlan(
  currentPlan: PlanDefinition,
  summary: UsageSummaryData,
): PlanDefinition | null {
  const tiers = PLAN_CATALOG.availableTiers;
  const currentIndex = tiers.indexOf(currentPlan.id);
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
      const projectedRatio =
        quota.limit > 0 ? (metric.current / quota.limit) * 100 : 0;
      return projectedRatio >= 90;
    });

    if (!stillTense) {
      return candidate;
    }
  }

  return PLAN_DEFINITIONS[tiers[tiers.length - 1]];
}

const timelineSeverityDot: Record<string, string> = {
  info: 'bg-sky-400 border-sky-200 shadow-[0_0_15px_rgba(56,189,248,0.5)]',
  warning: 'bg-amber-400 border-amber-100 shadow-[0_0_15px_rgba(251,191,36,0.5)]',
  critical: 'bg-rose-500 border-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.7)]',
};

const projectionStatusBadge: Record<'ok' | 'warning' | 'critical', 'outline' | 'secondary' | 'destructive'> = {
  ok: 'outline',
  warning: 'secondary',
  critical: 'destructive',
};

const projectionStatusLabel: Record<'ok' | 'warning' | 'critical', string> = {
  ok: 'Stable',
  warning: 'Sous tension',
  critical: 'Action immédiate',
};

function computePlanCoverageInsights(
  summary: UsageSummaryData,
  currentPlan: PlanDefinition,
): PlanCoverageInsight[] {
  const tiers = PLAN_CATALOG.availableTiers;
  return tiers.map((tierId) => {
    const plan = PLAN_DEFINITIONS[tierId];
    let limitingMetricLabel = 'N/A';
    let limitingMetricPercentage = 0;

    summary.metrics.forEach((metric) => {
      const quota = plan.quotas.find((q) => q.metric === metric.type);
      if (!quota) {
        if (limitingMetricPercentage < 999) {
          limitingMetricPercentage = 999;
          limitingMetricLabel = `${metric.type} (non inclus)`;
        }
        return;
      }
      const percentage = quota.limit > 0 ? (metric.current / quota.limit) * 100 : 0;
      if (percentage > limitingMetricPercentage) {
        limitingMetricPercentage = percentage;
        limitingMetricLabel = formatMetricLabel(quota);
      }
    });

    let status: PlanCoverageInsight['status'] = 'optimal';
    if (limitingMetricPercentage >= 105 || limitingMetricPercentage === 999) {
      status = 'insufficient';
    } else if (limitingMetricPercentage >= 85) {
      status = 'tense';
    }

    return {
      id: plan.id,
      plan,
      limitingMetricLabel,
      limitingMetricPercentage,
      status,
      deltaPriceCents: plan.basePriceCents - currentPlan.basePriceCents,
      isCurrent: plan.id === currentPlan.id,
    };
  });
}

export function UsageQuotaOverview() {
  const { loading, error, summary, plan, refresh } = useUsageSummary();
  const { quotaSummaries, isConnected, isDegraded } = useRealtimeMetrics();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [lastLiveUpdate, setLastLiveUpdate] = useState<number | null>(null);
  const degradedRefreshRef = useRef(false);
  const [topupMetric, setTopupMetric] = useState<string | null>(null);
  const [topupUnits, setTopupUnits] = useState<number>(0);
  const [exportingReport, setExportingReport] = useState(false);
  const [topupCheckoutLoading, setTopupCheckoutLoading] = useState(false);

  const {
    data: topupHistory,
    loading: topupHistoryLoading,
    error: topupHistoryError,
    reload: reloadTopupHistory,
  } = useTopupHistory();

  const currentBrandId = summary?.brandId;
  const liveSnapshot = useMemo(() => {
    if (!currentBrandId) {
      return null;
    }
    return quotaSummaries.find((entry) => entry.brandId === currentBrandId) ?? null;
  }, [quotaSummaries, currentBrandId]);
  const effectiveSummary = liveSnapshot?.summary ?? summary;
  const effectivePlan = liveSnapshot?.plan ?? plan;
  const liveMode = Boolean(liveSnapshot && isConnected);

  useEffect(() => {
    if (liveSnapshot) {
      setLastLiveUpdate(Date.now());
    }
  }, [liveSnapshot]);

  useEffect(() => {
    const topupStatus = searchParams?.get('topup');
    if (!topupStatus) {
      return;
    }

    if (topupStatus === 'success') {
      toast({
        description: 'Top-up confirmé ! Vos quotas seront mis à jour sous quelques secondes.',
      });
      void refresh();
      void reloadTopupHistory();
    } else if (topupStatus === 'cancel') {
      toast({
        variant: 'destructive',
        description: 'Top-up annulé. Vous pouvez relancer l’opération depuis ce cockpit.',
      });
    }

    router.replace('/analytics');
  }, [searchParams, toast, refresh, reloadTopupHistory, router]);

  useEffect(() => {
    if (!topupMetric && effectiveSummary?.metrics.length) {
      setTopupMetric(effectiveSummary.metrics[0].type);
    }
  }, [effectiveSummary, topupMetric]);

  const {
    data: apiTopupSimulation,
    loading: topupSimulationLoading,
    error: topupSimulationError,
  } = useTopupSimulation(
    (topupMetric as UsageMetricType) ?? null,
    topupUnits,
    Boolean(topupMetric),
  );

  const periodStats = useMemo(
    () => computePeriodStats(effectiveSummary ?? null),
    [effectiveSummary],
  );
  const timelineEntries = useMemo(
    () =>
      effectiveSummary && effectivePlan
        ? buildTimelineEntries(effectiveSummary, effectivePlan)
        : [],
    [effectiveSummary, effectivePlan],
  );
  const projectionHighlights = useMemo(
    () =>
      effectiveSummary && effectivePlan && periodStats
        ? buildProjectionHighlights(effectiveSummary, effectivePlan, periodStats)
        : [],
    [effectiveSummary, effectivePlan, periodStats],
  );
  const recommendedPlan = useMemo(
    () =>
      effectiveSummary && effectivePlan
        ? computeRecommendedPlan(effectivePlan, effectiveSummary)
        : null,
    [effectiveSummary, effectivePlan],
  );
  const planCoverage = useMemo(
    () =>
      effectiveSummary && effectivePlan
        ? computePlanCoverageInsights(effectiveSummary, effectivePlan)
        : [],
    [effectiveSummary, effectivePlan],
  );
  const upgradeComparisons = useMemo(() => {
    if (!effectivePlan || !planCoverage.length) {
      return [];
    }
    const tiers = PLAN_CATALOG.availableTiers;
    const currentIndex = tiers.indexOf(effectivePlan.id);
    return planCoverage
      .filter((insight) => tiers.indexOf(insight.id) >= currentIndex)
      .slice(0, 4);
  }, [planCoverage, effectivePlan]);

  const mostCriticalMetric = useMemo(() => {
    if (!effectiveSummary) {
      return null;
    }
    return [...effectiveSummary.metrics].sort((a, b) => b.percentage - a.percentage)[0];
  }, [effectiveSummary]);

  const emailShareLink = useMemo(() => {
    if (!effectiveSummary || !effectivePlan) {
      return null;
    }
    const lines = [
      `Brand: ${effectiveSummary.brandId}`,
      `Plan actuel: ${effectivePlan.name}`,
      mostCriticalMetric
        ? `Pression max: ${getQuotaLabel(mostCriticalMetric.type, effectivePlan)} (${mostCriticalMetric.percentage.toFixed(0)}%)`
        : null,
      `Overage estimé: ${formatCurrency(effectiveSummary.estimatedCost.overage)}`,
      recommendedPlan
        ? `Recommandation: ${recommendedPlan.name}`
        : 'Plan actuel suffisant',
    ].filter(Boolean) as string[];
    const subject = encodeURIComponent(`Rapport quotas ${effectiveSummary.brandId}`);
    const body = encodeURIComponent(lines.join('\n'));
    return `mailto:?subject=${subject}&body=${body}`;
  }, [effectiveSummary, effectivePlan, mostCriticalMetric, recommendedPlan]);

  const topupTargetQuota = useMemo(() => {
    if (!effectivePlan || !topupMetric) {
      return null;
    }
    return effectivePlan.quotas.find((quota) => quota.metric === topupMetric) ?? null;
  }, [effectivePlan, topupMetric]);

  const localTopupSimulation = useMemo<TopUpSimulation | null>(() => {
    if (!effectiveSummary || !effectivePlan || !topupMetric) {
      return null;
    }
    const metric = effectiveSummary.metrics.find((item) => item.type === topupMetric);
    const quota = effectivePlan.quotas.find((item) => item.metric === topupMetric);
    if (!metric || !quota) {
      return null;
    }

    const adjustedLimit = quota.limit + topupUnits;
    const originalPercentage = metric.percentage;
    const simulatedPercentage =
      adjustedLimit > 0 ? (metric.current / adjustedLimit) * 100 : originalPercentage;

    const elapsedDays = periodStats?.elapsedDays ?? null;
    const dailyRate =
      elapsedDays && elapsedDays > 0 ? metric.current / Math.max(1, elapsedDays) : null;

    const originalDaysToLimit =
      dailyRate && dailyRate > 0 ? (quota.limit - metric.current) / dailyRate : null;
    const simulatedDaysToLimit =
      dailyRate && dailyRate > 0 ? (adjustedLimit - metric.current) / dailyRate : null;
    const regainedDays =
      originalDaysToLimit !== null && simulatedDaysToLimit !== null
        ? simulatedDaysToLimit - originalDaysToLimit
        : null;

    const estimatedCostCents =
      quota.overage === 'charge' && quota.overageRate ? quota.overageRate * topupUnits : null;

    return {
      metricLabel: formatMetricLabel(quota),
      originalPercentage,
      simulatedPercentage,
      originalDaysToLimit,
      simulatedDaysToLimit,
      regainedDays,
      estimatedCostCents,
      unit: quota.unit,
    };
  }, [effectiveSummary, effectivePlan, topupMetric, topupUnits, periodStats]);

  const topupSliderMax = Math.max(50, (topupTargetQuota?.limit ?? 100) * 2);
  const topupSliderStep = Math.max(1, Math.round(topupSliderMax / 40));

  const serverTopupSimulation = useMemo<TopUpSimulation | null>(() => {
    if (!apiTopupSimulation || !effectivePlan) {
      return null;
    }
    return {
      metricLabel: getQuotaLabel(apiTopupSimulation.metric, effectivePlan),
      originalPercentage: apiTopupSimulation.currentPercentage,
      simulatedPercentage: apiTopupSimulation.simulatedPercentage,
      originalDaysToLimit: apiTopupSimulation.originalDaysToLimit,
      simulatedDaysToLimit: apiTopupSimulation.simulatedDaysToLimit,
      regainedDays: apiTopupSimulation.regainedDays,
      estimatedCostCents: apiTopupSimulation.estimatedCostCents,
      unit: apiTopupSimulation.unit,
    };
  }, [apiTopupSimulation, effectivePlan]);

  const topupSimulation = serverTopupSimulation ?? localTopupSimulation;
  const topupSimulationSource = serverTopupSimulation ? 'backend' : 'local';

  const liveStatusLabel = liveMode
    ? 'Flux live'
    : !isConnected
      ? 'Flux interrompu'
      : isDegraded
        ? 'Flux instable'
        : 'Flux standby';

  const handleExportReport = useCallback(() => {
    if (!effectiveSummary || !effectivePlan) {
      return;
    }
    setExportingReport(true);
    try {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text('Luneo · Rapport Usage & Quotas', 14, 20);

      doc.setFontSize(11);
      doc.text(`Brand : ${effectiveSummary.brandId}`, 14, 32);
      doc.text(`Plan actuel : ${effectivePlan.name}`, 14, 40);
      doc.text(
        `Overage estimé : ${formatCurrency(effectiveSummary.estimatedCost.overage)}`,
        14,
        48,
      );
      if (recommendedPlan) {
        doc.text(`Plan recommandé : ${recommendedPlan.name}`, 14, 56);
      }

      doc.text('Pression par métrique :', 14, 70);
      let cursorY = 78;
      effectiveSummary.metrics.slice(0, 6).forEach((metric) => {
        const label = getQuotaLabel(metric.type, effectivePlan);
        doc.text(
          `• ${label} : ${metric.current.toLocaleString()} / ${metric.limit.toLocaleString()} (${metric.percentage.toFixed(0)}%)`,
          16,
          cursorY,
        );
        cursorY += 8;
      });

      if (effectiveSummary.alerts.length) {
        doc.text('Alertes récentes :', 14, cursorY + 4);
        cursorY += 12;
        effectiveSummary.alerts.slice(0, 3).forEach((alert) => {
          doc.text(
            `• [${alert.severity}] ${alert.message}`,
            16,
            cursorY,
          );
          cursorY += 8;
        });
      }

      doc.text(
        `Rapport généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`,
        14,
        cursorY + 6,
      );

      doc.save(`luneo-quota-${effectiveSummary.brandId}.pdf`);
    } catch (error) {
      logger.error('Failed to export quota report', {
        error,
        brandId: effectiveSummary?.brandId,
      });
    } finally {
      setExportingReport(false);
    }
  }, [effectiveSummary, effectivePlan, recommendedPlan]);

  const handleCopyShareLink = useCallback(async () => {
    if (!effectiveSummary) {
      toast({
        variant: 'destructive',
        description: 'Résumé indisponible pour générer un lien.',
      });
      return;
    }

    if (typeof window === 'undefined' || !navigator?.clipboard) {
      toast({
        variant: 'destructive',
        description: 'Clipboard indisponible sur cet appareil.',
      });
      return;
    }

    try {
      const response = await api.post<{
        token: string;
        url?: string;
      }>('/usage-billing/share', {
        brandId: effectiveSummary.brandId,
      });
      const shareUrl =
        response?.url ?? `${window.location.origin}/share/quota/${response?.token ?? ''}`;
      await navigator.clipboard.writeText(shareUrl);
      toast({
        description: 'Lien partageable copié !',
      });
    } catch (error) {
      logger.error('Failed to create share token', {
        error,
        brandId: effectiveSummary?.brandId,
      });
      toast({
        variant: 'destructive',
        description: 'Impossible de générer le lien.',
      });
    }
  }, [effectiveSummary, toast]);

  const handleTopupCheckout = useCallback(async () => {
    if (!topupMetric || topupUnits <= 0) {
      toast({
        variant: 'destructive',
        description: 'Sélectionnez une métrique et un volume de crédits.',
      });
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    setTopupCheckoutLoading(true);
    try {
      const origin = window.location.origin;
      const response = await api.post<{ checkoutUrl: string }>(
        '/usage-billing/topups/checkout',
        {
          metric: topupMetric,
          units: topupUnits,
          successUrl: `${origin}/analytics?topup=success`,
          cancelUrl: `${origin}/analytics?topup=cancel`,
        },
      );
      if (response?.checkoutUrl) {
        window.location.href = response.checkoutUrl;
      } else {
        toast({
          variant: 'destructive',
          description: 'Impossible de créer la session Stripe.',
        });
      }
    } catch (error) {
      logger.error('Failed to create top-up checkout', {
        error,
        metric: topupMetric,
        units: topupUnits,
      });
      toast({
        variant: 'destructive',
        description: 'La création du top-up a échoué. Réessayez.',
      });
    } finally {
      setTopupCheckoutLoading(false);
    }
  }, [topupMetric, topupUnits, toast]);

  useEffect(() => {
    if (isDegraded && !degradedRefreshRef.current) {
      degradedRefreshRef.current = true;
      void refresh();
    }
    if (!isDegraded) {
      degradedRefreshRef.current = false;
    }
  }, [isDegraded, refresh]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Usage & quotas</h2>
          <p className="text-sm text-gray-400">
            Surveillez vos consommations clés, anticipez les dépassements et transformez chaque alerte en action.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div
            className={cn(
              'flex items-center gap-2 rounded-full border px-3 py-1 text-xs',
              liveMode
                ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-300'
                : isDegraded
                  ? 'border-amber-500/60 bg-amber-500/10 text-amber-100'
                  : 'border-gray-700 bg-gray-900/60 text-gray-400',
            )}
          >
            <span
              className={cn(
                'h-2 w-2 rounded-full',
                liveMode
                  ? 'bg-emerald-400 animate-pulse'
                  : isDegraded
                    ? 'bg-amber-400 animate-pulse'
                    : 'bg-gray-500',
              )}
            />
            <span className="font-medium">{liveStatusLabel}</span>
            {lastLiveUpdate && (
              <span className="text-[11px] text-gray-500">
                MAJ {formatRelative(new Date(lastLiveUpdate))}
              </span>
            )}
          </div>
          <Button variant="outline" className="border-gray-700" onClick={() => refresh()}>
            <ArrowUpRight className="mr-2 h-4 w-4" />
            Actualiser
          </Button>
          <Button
            variant="outline"
            className="border-gray-700"
            onClick={handleExportReport}
            disabled={exportingReport || !effectiveSummary}
          >
            <Download className="mr-2 h-4 w-4" />
            {exportingReport ? 'Export...' : 'Exporter PDF'}
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-gray-700"
            disabled={!emailShareLink}
          >
            <a href={emailShareLink ?? '#'} rel="noopener noreferrer">
              <Mail className="mr-2 h-4 w-4" />
              Envoyer par email
            </a>
          </Button>
          <Button
            variant="outline"
            className="border-gray-700"
            onClick={() => {
              void handleCopyShareLink();
            }}
            disabled={!effectiveSummary}
          >
            <Share2 className="mr-2 h-4 w-4" />
            Copier le lien
          </Button>
        </div>
      </div>

      {loading && (
        <Card className="border-gray-800 bg-gray-900/70 p-6 animate-pulse">
          <div className="h-4 w-40 rounded bg-gray-800 mb-4" />
          <div className="space-y-3">
            <div className="h-3 w-full rounded bg-gray-800" />
            <div className="h-3 w-5/6 rounded bg-gray-800" />
            <div className="h-3 w-4/6 rounded bg-gray-800" />
            <div className="h-3 w-3/6 rounded bg-gray-800" />
          </div>
        </Card>
      )}

      {error && (
        <Card className="border-red-500/40 bg-red-500/10 p-6 flex items-center gap-3 text-red-200">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </Card>
      )}

      {isDegraded && (
        <Card className="border-amber-500/40 bg-amber-500/10 p-4 flex items-center gap-3 text-amber-100">
          <AlertTriangle className="h-5 w-5" />
          <div className="text-sm">
            Flux temps réel momentanément indisponible. Nous repassons sur les snapshots API et
            relançons une synchronisation automatique.
          </div>
        </Card>
      )}

      {!loading && effectiveSummary && effectivePlan && (
        <>
          <motion
            className="rounded-xl border border-gray-800 bg-gradient-to-br from-gray-950 via-gray-900/80 to-gray-900/40 p-6 shadow-xl space-y-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="space-y-1">
                <p className="text-sm uppercase tracking-wider text-gray-400">Plan actuel</p>
                <h3 className="text-2xl font-bold text-white">{effectivePlan.name}</h3>
                {effectivePlan.headline && (
                  <p className="text-sm text-gray-400 mt-1 max-w-lg">{effectivePlan.headline}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Facturation mensuelle</p>
                <p className="text-2xl font-semibold text-white">
                  {formatCurrency(effectivePlan.basePriceCents)}
                </p>
                {effectiveSummary.estimatedCost.overage > 0 && (
                  <p className="text-sm text-amber-300 mt-1">
                    +{formatCurrency(effectiveSummary.estimatedCost.overage)} de dépassements prévisionnels
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Activity className="h-4 w-4 text-violet-300" />
                  Pression maximale
                </div>
                <p className="mt-2 text-lg text-white font-semibold">
                  {mostCriticalMetric ? `${mostCriticalMetric.percentage.toFixed(0)}%` : '--'}
                </p>
                {mostCriticalMetric && (
                  <p className="text-xs text-gray-500">
                    {getQuotaLabel(mostCriticalMetric.type, effectivePlan)}
                  </p>
                )}
              </div>
              <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <TrendingUp className="h-4 w-4 text-amber-300" />
                  Overage estimé
                </div>
                <p className="mt-2 text-lg text-white font-semibold">
                  {formatCurrency(effectiveSummary.estimatedCost.overage)}
                </p>
                <p className="text-xs text-gray-500">Prévision à fin de période</p>
              </div>
              <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Clock3 className="h-4 w-4 text-sky-300" />
                  Temps restant
                </div>
                <p className="mt-2 text-lg text-white font-semibold">
                  {periodStats ? `${Math.round(periodStats.remainingDays)} j` : '--'}
                </p>
                <p className="text-xs text-gray-500">
                  Jusqu’au {new Date(effectiveSummary.period.end).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
          </motion>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2 border-gray-800 bg-gray-900/50 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Alertes & événements</p>
                  <h3 className="text-lg text-white font-semibold">Surveillance temps réel</h3>
                </div>
                <Badge variant="outline">{timelineEntries.length} évènement(s)</Badge>
              </div>
              <ScrollArea className="h-[240px] pr-2">
                <div className="space-y-6">
                  {timelineEntries.map((entry, index) => (
                    <div className="flex gap-3" key={entry.id}>
                      <div className="flex flex-col items-center">
                        <span
                          className={cn(
                            'h-3 w-3 rounded-full border-2',
                            timelineSeverityDot[entry.severity],
                          )}
                        />
                        {index !== timelineEntries.length - 1 && (
                          <div className="w-px flex-1 bg-gray-800" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <p className="text-white font-medium">{entry.title}</p>
                          <span className="text-xs text-gray-500">{entry.timestampLabel}</span>
                        </div>
                        <p className="text-sm text-gray-400">{entry.description}</p>
                        <p className="text-xs text-gray-500">{entry.absoluteDate}</p>
                        {entry.suggestion && (
                          <p className="text-xs text-indigo-200">
                            Suggestion · {entry.suggestion}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div>
                <p className="text-sm text-gray-400 mb-3">Projections sur la période</p>
                <div className="grid gap-3 md:grid-cols-2">
                  {projectionHighlights.slice(0, 4).map((highlight) => (
                    <div
                      key={highlight.id}
                      className="rounded-lg border border-gray-800 bg-gray-900/60 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs uppercase text-gray-500">{highlight.label}</p>
                          <p className="text-lg text-white font-semibold">
                            {Number.isFinite(highlight.projectedPercentage)
                              ? `${highlight.projectedPercentage.toFixed(0)}%`
                              : 'Stable'}
                          </p>
                        </div>
                        <Badge variant={projectionStatusBadge[highlight.status]}>
                          {projectionStatusLabel[highlight.status]}
                        </Badge>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-4 text-xs text-gray-400">
                        <div>
                          <p>Rythme quotidien</p>
                          <p className="text-sm text-white font-medium">
                            {formatNumber(highlight.dailyRate)} {getMetricUnit(highlight.metric, effectivePlan)}/j
                          </p>
                        </div>
                        <div>
                          <p>Atteindra la limite</p>
                          <p className="text-sm text-white font-medium">
                            {formatDaysToLimit(highlight.daysToLimit)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <Card className="border-gray-800 bg-gradient-to-b from-violet-950/60 via-gray-950 to-gray-900 p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-violet-200 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Pilotage pro
                  </p>
                  <h3 className="text-xl text-white font-semibold">
                    {recommendedPlan ? 'Plan recommandé' : 'Plan optimisé'}
                  </h3>
                  <p className="text-sm text-violet-100/70">
                    {recommendedPlan
                      ? `Passez sur ${recommendedPlan.name} pour absorber vos pics critiques.`
                      : 'Votre plan couvre confortablement vos usages actuels.'}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {recommendedPlan ? 'Upgrade conseillé' : 'OK'}
                </Badge>
              </div>

              {recommendedPlan && (
                <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-4 space-y-2 text-sm text-violet-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase text-violet-200/80">Plan cible</p>
                      <p className="text-lg font-semibold">{recommendedPlan.name}</p>
                    </div>
                    <p className="text-sm font-medium">
                      {formatCurrency(recommendedPlan.basePriceCents)}
                    </p>
                  </div>
                  <ul className="space-y-1 text-xs text-violet-100/80">
                    <li>• Jusqu’à 3x plus de capacité sur les métriques critiques.</li>
                    <li>• Support prioritaire et quotas API élargis.</li>
                    <li>• Déploiement instantané côté backend (aucune coupure).</li>
                  </ul>
                </div>
              )}

              <div className="flex gap-2">
                <Button asChild className="flex-1">
                  <Link href="/pricing">
                    Comparer les plans
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/contact">Parler à un expert</Link>
                </Button>
              </div>
            </Card>
          </div>

          {upgradeComparisons.length > 0 && (
            <Card className="border-gray-800 bg-gray-900/50 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Comparateur express</p>
                  <h3 className="text-lg text-white font-semibold">Headroom par plan</h3>
                </div>
                <Badge variant="outline">{upgradeComparisons.length} option(s)</Badge>
              </div>
              <div className="space-y-3">
                {upgradeComparisons.map((insight) => {
                  const statusLabel =
                    insight.status === 'optimal'
                      ? 'Confort'
                      : insight.status === 'tense'
                        ? 'Sous tension'
                        : 'Insuffisant';
                  const badgeClass =
                    insight.status === 'optimal'
                      ? 'bg-emerald-500/10 text-emerald-200 border-emerald-500/40'
                      : insight.status === 'tense'
                        ? 'bg-amber-500/10 text-amber-100 border-amber-500/40'
                        : 'bg-rose-500/10 text-rose-100 border-rose-500/40';
                  const priceDelta =
                    insight.deltaPriceCents === 0
                      ? 'Tarif identique'
                      : insight.deltaPriceCents > 0
                        ? `+${formatCurrency(insight.deltaPriceCents)}`
                        : `-${formatCurrency(Math.abs(insight.deltaPriceCents))}`;
                  return (
                    <div
                      key={insight.id}
                      className="rounded-xl border border-gray-800/80 bg-gray-900/70 px-4 py-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-3">
                          <p className="text-white font-semibold">{insight.plan.name}</p>
                          {insight.isCurrent && (
                            <Badge variant="outline" className="border-violet-400/60 text-violet-200">
                              Plan actuel
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-400">
                          Limite critique :{' '}
                          <span className="text-white font-medium">
                            {insight.limitingMetricLabel}
                          </span>{' '}
                          (
                          {insight.limitingMetricPercentage >= 999
                            ? 'non dispo'
                            : `${insight.limitingMetricPercentage.toFixed(0)}%`})
                        </p>
                      </div>
                      <div className="flex flex-col md:items-end text-sm text-gray-300 gap-1">
                        <div className="flex items-center gap-2">
                          <span>{formatCurrency(insight.plan.basePriceCents)}</span>
                          {!insight.isCurrent && (
                            <span className="text-xs text-gray-500">{priceDelta}/mois</span>
                          )}
                        </div>
                        <Badge className={badgeClass}>{statusLabel}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {effectiveSummary && effectivePlan && (
            <Card className="border-gray-800 bg-gray-900/60 p-6 space-y-5">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm text-gray-400">Simulateur de top-up</p>
                  <h3 className="text-lg text-white font-semibold">
                    Ajoutez des crédits et visualisez l’impact instantanément
                  </h3>
                </div>
                <Badge variant="outline" className="text-xs">
                  Beta
                </Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs uppercase text-gray-400">Métrique à renforcer</Label>
                  <Select
                    value={topupMetric ?? undefined}
                    onValueChange={(value) => {
                      setTopupMetric(value);
                      setTopupUnits(0);
                    }}
                  >
                    <SelectTrigger className="bg-gray-900 border-gray-800 text-white">
                      <SelectValue placeholder="Choisissez une métrique" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-gray-800 text-white">
                      {effectiveSummary.metrics.map((metric) => (
                        <SelectItem key={metric.type} value={metric.type}>
                          {getQuotaLabel(metric.type, effectivePlan)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase text-gray-400">Crédits supplémentaires</Label>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[topupUnits]}
                      min={0}
                      step={topupSliderStep}
                      max={topupSliderMax}
                      onValueChange={(values) => setTopupUnits(Math.max(0, values[0] ?? 0))}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      className="w-24 bg-gray-900 border-gray-800 text-white"
                      value={topupUnits}
                      min={0}
                      onChange={(event) => {
                        const next = Number(event.target.value);
                        setTopupUnits(Number.isNaN(next) ? 0 : Math.max(0, next));
                      }}
                    />
                  </div>
                  {topupTargetQuota && (
                    <p className="text-xs text-gray-500">
                      Base plan : {topupTargetQuota.limit.toLocaleString()} {topupTargetQuota.unit}
                      {' · '}
                      Simulation max : {topupSliderMax.toLocaleString()} {topupTargetQuota.unit}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    {topupSimulationLoading
                      ? 'Simulation backend en cours…'
                      : topupSimulationSource === 'backend'
                        ? 'Projection validée côté backend.'
                        : 'Projection locale — augmentez les crédits pour déclencher la simulation API.'}
                  </p>
                  {topupSimulationError && (
                    <p className="text-xs text-amber-200">{topupSimulationError}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-gray-800 bg-gray-950/70 p-4">
                  <p className="text-xs uppercase text-gray-400">Pression projetée</p>
                  {topupSimulation ? (
                    <>
                      <p className="mt-2 text-2xl text-white font-semibold">
                        {topupSimulation.simulatedPercentage.toFixed(0)}%
                      </p>
                      <p className="text-xs text-gray-500">
                        Actuel : {topupSimulation.originalPercentage.toFixed(0)}%
                      </p>
                      <p className="text-xs text-gray-500">{topupSimulation.metricLabel}</p>
                    </>
                  ) : (
                    <p className="mt-2 text-sm text-gray-500">Sélectionnez une métrique.</p>
                  )}
                </div>
                <div className="rounded-lg border border-gray-800 bg-gray-950/70 p-4">
                  <p className="text-xs uppercase text-gray-400">Horizon supplémentaire</p>
                  {topupSimulation ? (
                    <>
                      <p className="mt-2 text-2xl text-white font-semibold">
                        {topupSimulation.simulatedDaysToLimit
                          ? formatDaysToLimit(topupSimulation.simulatedDaysToLimit)
                          : 'Stable'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Avant :{' '}
                        {topupSimulation.originalDaysToLimit
                          ? formatDaysToLimit(topupSimulation.originalDaysToLimit)
                          : 'Stable'}
                      </p>
                      {topupSimulation.regainedDays !== null &&
                        Number.isFinite(topupSimulation.regainedDays) &&
                        topupSimulation.regainedDays > 0 && (
                          <p className="text-xs text-emerald-300">
                            +{topupSimulation.regainedDays.toFixed(1)} jour(s) de marge
                          </p>
                        )}
                    </>
                  ) : (
                    <p className="mt-2 text-sm text-gray-500">Ajustez votre top-up.</p>
                  )}
                </div>
                <div className="rounded-lg border border-gray-800 bg-gray-950/70 p-4">
                  <p className="text-xs uppercase text-gray-400">Investissement estimé</p>
                  {topupSimulation ? (
                    <>
                      <p className="mt-2 text-2xl text-white font-semibold">
                        {topupSimulation.estimatedCostCents !== null
                          ? formatCurrency(topupSimulation.estimatedCostCents)
                          : 'Gratuit'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {topupTargetQuota?.overageRate
                          ? `${formatCurrency(topupTargetQuota.overageRate)} / ${topupTargetQuota.unit}`
                          : 'Aucun tarif unitaire défini'}
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 text-sm text-gray-500">Sélectionnez une métrique.</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="text-sm text-gray-400">
                  {topupMetric && topupUnits > 0
                    ? `Prêt à ajouter ${topupUnits.toLocaleString()} ${topupSimulation?.unit ?? ''} sur ${getQuotaLabel(
                        topupMetric,
                        effectivePlan,
                      )}`
                    : 'Définissez une simulation pour accéder au paiement Stripe.'}
                </div>
                <Button
                  onClick={() => {
                    void handleTopupCheckout();
                  }}
                  disabled={!topupMetric || topupUnits <= 0 || topupCheckoutLoading}
                >
                  {topupCheckoutLoading ? 'Création en cours...' : 'Acheter ce top-up'}
                </Button>
              </div>
            </Card>
          )}

          <Card className="border-gray-800 bg-gray-900/60 p-6 space-y-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-gray-400">Historique des top-ups</p>
                <h3 className="text-lg text-white font-semibold">Dernières opérations</h3>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-700 text-gray-200"
                  onClick={() => {
                    void reloadTopupHistory();
                  }}
                  disabled={topupHistoryLoading}
                >
                  Actualiser
                </Button>
                <Button asChild size="sm" variant="outline" className="border-gray-700 text-gray-200">
                  <Link href="/billing">Ouvrir la facturation</Link>
                </Button>
              </div>
            </div>
            {topupHistoryError && (
              <p className="text-sm text-amber-200">{topupHistoryError}</p>
            )}
            {topupHistoryLoading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((index) => (
                  <div key={index} className="h-12 rounded-lg bg-gray-800 animate-pulse" />
                ))}
              </div>
            ) : topupHistory.length > 0 ? (
              <div className="space-y-4">
                {topupHistory.slice(0, 5).map((entry) => {
                  const statusTone =
                    entry.status === 'completed'
                      ? 'bg-emerald-500/10 text-emerald-200 border-emerald-500/40'
                      : entry.status === 'pending'
                        ? 'bg-amber-500/10 text-amber-200 border-amber-500/40'
                        : 'bg-rose-500/10 text-rose-200 border-rose-500/40';

                  const label = effectivePlan
                    ? getQuotaLabel(entry.metric, effectivePlan)
                    : entry.metric;

                  return (
                    <div
                      key={entry.id}
                      className="rounded-xl border border-gray-800/60 bg-gray-950/50 px-4 py-3 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-white">
                          {label} · {entry.units.toLocaleString()} {getMetricUnit(entry.metric, effectivePlan)}
                        </p>
                        <Badge className={cn('text-xs', statusTone)}>
                          {entry.status === 'completed'
                            ? 'Confirmé'
                            : entry.status === 'pending'
                              ? 'En cours'
                              : 'Échec'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>{currencyFormatter.format(entry.totalPriceCents / 100)}</span>
                        <span>{new Date(entry.createdAt).toLocaleString('fr-FR')}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Aucun top-up enregistré pour l’instant.</p>
            )}
          </Card>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {effectiveSummary.metrics.map((metric: UsageSummaryMetric) => {
              const quota = effectivePlan.quotas.find((item) => item.metric === metric.type);
              if (!quota) {
                return null;
              }

              const icon = metricIcons[metric.type] ?? <Zap className="h-4 w-4 text-sky-400" />;
              const usagePercentage = Number.isFinite(metric.percentage)
                ? Math.min(100, Math.max(0, metric.percentage))
                : 0;
              const remaining = Math.max(metric.limit - metric.current, 0);

              return (
                <Card
                  key={metric.type}
                  className="border-gray-800 bg-gray-900/60 p-5 hover:border-violet-500/40 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-400">
                        {formatUnit(quota)}
                      </p>
                      <h4 className="mt-1 text-lg font-semibold text-white">
                        {formatMetricLabel(quota)}
                      </h4>
                    </div>
                    <div className="rounded-lg bg-gray-800/80 p-2">{icon}</div>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="text-white font-medium">
                        {metric.current.toLocaleString()} / {metric.limit.toLocaleString()}
                      </span>
                      <span
                        className={cn(
                          'text-xs',
                          usagePercentage >= 90
                            ? 'text-red-300'
                            : usagePercentage >= 75
                              ? 'text-amber-200'
                              : 'text-gray-400',
                        )}
                      >
                        {usagePercentage.toFixed(0)}% utilisé
                      </span>
                    </div>
                    <Progress
                      value={usagePercentage}
                      className="mt-2 h-2 rounded-full bg-gray-800"
                      indicatorClassName="rounded-full bg-gradient-to-r from-violet-500 via-indigo-400 to-sky-400"
                    />
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                    <span>
                      Restant : {remaining.toLocaleString()} {quota.unit}
                    </span>
                    {quota.overage === 'charge' && quota.overageRate && (
                      <span>
                        {formatCurrency(quota.overageRate)} / {quota.unit}
                      </span>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// Optimisation avec React.memo pour éviter les re-renders inutiles
const UsageQuotaOverviewMemo = memo(UsageQuotaOverview);

export default function UsageQuotaOverviewWrapper() {
  return (
    <ErrorBoundary componentName="UsageQuotaOverview">
      <UsageQuotaOverviewMemo />
    </ErrorBoundary>
  );
}

