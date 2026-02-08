'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUsageSummary, type UsageSummaryMetric } from '@/lib/hooks/useUsageSummary';
import { useRealtimeMetrics } from '@/hooks/useRealtimeMetrics';
import { useTopupSimulation } from '@/lib/hooks/useTopupSimulation';
import { useTopupHistory } from '@/lib/hooks/useTopupHistory';
import { api } from '@/lib/api/client';
import { useToast } from '@/components/ui/use-toast';
import type { UsageMetricType } from '@/lib/billing-plans';
import { PLAN_CATALOG } from '@/lib/billing-plans';
import { logger } from '@/lib/logger';
import type { UsageSummaryData, TopUpSimulation, PlanCoverageInsight } from './types';
import {
  computePeriodStats,
  buildTimelineEntries,
  buildProjectionHighlights,
  computeRecommendedPlan,
  computePlanCoverageInsights,
  getQuotaLabel,
  formatCurrency,
  formatDaysToLimit,
} from './utils';

export function useUsageQuota() {
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

  const { data: topupHistory, loading: topupHistoryLoading, error: topupHistoryError, reload: reloadTopupHistory } = useTopupHistory();
  const currentBrandId = summary?.brandId;
  const liveSnapshot = useMemo(
    () => (currentBrandId ? quotaSummaries.find((e) => e.brandId === currentBrandId) ?? null : null),
    [quotaSummaries, currentBrandId],
  );
  const effectiveSummary = (liveSnapshot?.summary ?? summary) as UsageSummaryData | null;
  const effectivePlan = liveSnapshot?.plan ?? plan;
  const liveMode = Boolean(liveSnapshot && isConnected);

  useEffect(() => { if (liveSnapshot) setLastLiveUpdate(Date.now()); }, [liveSnapshot]);
  useEffect(() => {
    const topupStatus = searchParams?.get('topup');
    if (!topupStatus) return;
    if (topupStatus === 'success') {
      toast({ description: 'Top-up confirmé ! Vos quotas seront mis à jour sous quelques secondes.' });
      void refresh();
      void reloadTopupHistory();
    } else if (topupStatus === 'cancel') {
      toast({ variant: 'destructive', description: "Top-up annulé. Vous pouvez relancer l'opération depuis ce cockpit." });
    }
    router.replace('/analytics');
  }, [searchParams, toast, refresh, reloadTopupHistory, router]);
  useEffect(() => { if (!topupMetric && effectiveSummary?.metrics.length) setTopupMetric(effectiveSummary.metrics[0].type); }, [effectiveSummary, topupMetric]);
  useEffect(() => {
    if (isDegraded && !degradedRefreshRef.current) { degradedRefreshRef.current = true; void refresh(); }
    if (!isDegraded) degradedRefreshRef.current = false;
  }, [isDegraded, refresh]);

  const { data: apiTopupSimulation, loading: topupSimulationLoading, error: topupSimulationError } = useTopupSimulation(
    (topupMetric as UsageMetricType) ?? null,
    topupUnits,
    Boolean(topupMetric),
  );

  const periodStats = useMemo(() => computePeriodStats(effectiveSummary ?? null), [effectiveSummary]);
  const timelineEntries = useMemo(
    () => (effectiveSummary && effectivePlan ? buildTimelineEntries(effectiveSummary, effectivePlan) : []),
    [effectiveSummary, effectivePlan],
  );
  const projectionHighlights = useMemo(
    () => (effectiveSummary && effectivePlan && periodStats ? buildProjectionHighlights(effectiveSummary, effectivePlan, periodStats) : []),
    [effectiveSummary, effectivePlan, periodStats],
  );
  const recommendedPlan = useMemo(
    () => (effectiveSummary && effectivePlan ? computeRecommendedPlan(effectiveSummary, effectivePlan) : null),
    [effectiveSummary, effectivePlan],
  );
  const planCoverage = useMemo(
    () => (effectiveSummary && effectivePlan ? computePlanCoverageInsights(effectiveSummary, effectivePlan) : []),
    [effectiveSummary, effectivePlan],
  );
  const upgradeComparisons = useMemo(() => {
    if (!effectivePlan || !planCoverage.length) return [];
    const tiers = PLAN_CATALOG.availableTiers;
    const currentIndex = tiers.indexOf(effectivePlan.id);
    return planCoverage.filter((insight: PlanCoverageInsight) => tiers.indexOf(insight.id) >= currentIndex).slice(0, 4);
  }, [planCoverage, effectivePlan]);
  const mostCriticalMetric = useMemo(
    () => (effectiveSummary ? [...effectiveSummary.metrics].sort((a, b) => b.percentage - a.percentage)[0] : null),
    [effectiveSummary],
  ) as UsageSummaryMetric | null;
  const emailShareLink = useMemo(() => {
    if (!effectiveSummary || !effectivePlan) return null;
    const lines = [
      `Brand: ${effectiveSummary.brandId}`,
      `Plan actuel: ${effectivePlan.name}`,
      mostCriticalMetric ? `Pression max: ${getQuotaLabel(mostCriticalMetric.type, effectivePlan)} (${mostCriticalMetric.percentage.toFixed(0)}%)` : null,
      `Overage estimé: ${formatCurrency(effectiveSummary.estimatedCost.overage)}`,
      recommendedPlan ? `Recommandation: ${recommendedPlan.name}` : 'Plan actuel suffisant',
    ].filter(Boolean) as string[];
    return `mailto:?subject=${encodeURIComponent(`Rapport quotas ${effectiveSummary.brandId}`)}&body=${encodeURIComponent(lines.join('\n'))}`;
  }, [effectiveSummary, effectivePlan, mostCriticalMetric, recommendedPlan]);

  const topupTargetQuota = useMemo(
    () => (effectivePlan && topupMetric ? effectivePlan.quotas.find((q) => q.metric === topupMetric) ?? null : null),
    [effectivePlan, topupMetric],
  );
  const topupSliderMax = Math.max(50, (topupTargetQuota?.limit ?? 100) * 2);
  const topupSliderStep = Math.max(1, Math.round(topupSliderMax / 40));

  const localTopupSimulation = useMemo<TopUpSimulation | null>(() => {
    if (!effectiveSummary || !effectivePlan || !topupMetric) return null;
    const metric = effectiveSummary.metrics.find((m) => m.type === topupMetric);
    const quota = effectivePlan.quotas.find((q) => q.metric === topupMetric);
    if (!metric || !quota) return null;
    const adjustedLimit = quota.limit + topupUnits;
    const elapsedDays = periodStats?.elapsedDays ?? null;
    const dailyRate = elapsedDays && elapsedDays > 0 ? metric.current / Math.max(1, elapsedDays) : null;
    const originalDaysToLimit = dailyRate && dailyRate > 0 ? (quota.limit - metric.current) / dailyRate : null;
    const simulatedDaysToLimit = dailyRate && dailyRate > 0 ? (adjustedLimit - metric.current) / dailyRate : null;
    return {
      metricLabel: quota.label,
      originalPercentage: metric.percentage,
      simulatedPercentage: adjustedLimit > 0 ? (metric.current / adjustedLimit) * 100 : metric.percentage,
      originalDaysToLimit,
      simulatedDaysToLimit,
      regainedDays: originalDaysToLimit != null && simulatedDaysToLimit != null ? simulatedDaysToLimit - originalDaysToLimit : null,
      estimatedCostCents: quota.overage === 'charge' && quota.overageRate ? quota.overageRate * topupUnits : null,
      unit: quota.unit,
    };
  }, [effectiveSummary, effectivePlan, topupMetric, topupUnits, periodStats]);

  const serverTopupSimulation = useMemo<TopUpSimulation | null>(() => {
    if (!apiTopupSimulation || !effectivePlan) return null;
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
  const topupSimulationSource = (serverTopupSimulation ? 'backend' : 'local') as 'backend' | 'local';
  const liveStatusLabel = liveMode ? 'Flux live' : !isConnected ? 'Flux interrompu' : isDegraded ? 'Flux instable' : 'Flux standby';

  const handleExportReport = useCallback(async () => {
    if (!effectiveSummary || !effectivePlan) return;
    setExportingReport(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text('Luneo · Rapport Usage & Quotas', 14, 20);
      doc.setFontSize(11);
      doc.text(`Brand : ${effectiveSummary.brandId}`, 14, 32);
      doc.text(`Plan actuel : ${effectivePlan.name}`, 14, 40);
      doc.text(`Overage estimé : ${formatCurrency(effectiveSummary.estimatedCost.overage)}`, 14, 48);
      if (recommendedPlan) doc.text(`Plan recommandé : ${recommendedPlan.name}`, 14, 56);
      doc.text('Pression par métrique :', 14, 70);
      let cursorY = 78;
      effectiveSummary.metrics.slice(0, 6).forEach((metric) => {
        doc.text(`• ${getQuotaLabel(metric.type, effectivePlan)} : ${metric.current.toLocaleString()} / ${metric.limit.toLocaleString()} (${metric.percentage.toFixed(0)}%)`, 16, cursorY);
        cursorY += 8;
      });
      if (effectiveSummary.alerts.length) {
        doc.text('Alertes récentes :', 14, cursorY + 4);
        cursorY += 12;
        effectiveSummary.alerts.slice(0, 3).forEach((alert) => {
          doc.text(`• [${alert.severity}] ${alert.message}`, 16, cursorY);
          cursorY += 8;
        });
      }
      doc.text(`Rapport généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 14, cursorY + 6);
      doc.save(`luneo-quota-${effectiveSummary.brandId}.pdf`);
    } catch (err) {
      logger.error('Failed to export quota report', { error: err, brandId: effectiveSummary?.brandId });
    } finally {
      setExportingReport(false);
    }
  }, [effectiveSummary, effectivePlan, recommendedPlan]);

  const handleCopyShareLink = useCallback(async () => {
    if (!effectiveSummary) { toast({ variant: 'destructive', description: 'Résumé indisponible pour générer un lien.' }); return; }
    if (typeof window === 'undefined' || !navigator?.clipboard) { toast({ variant: 'destructive', description: 'Clipboard indisponible sur cet appareil.' }); return; }
    try {
      const response = await api.post<{ token: string; url?: string }>('/usage-billing/share', { brandId: effectiveSummary.brandId });
      const shareUrl = response?.url ?? `${window.location.origin}/share/quota/${response?.token ?? ''}`;
      await navigator.clipboard.writeText(shareUrl);
      toast({ description: 'Lien partageable copié !' });
    } catch (err) {
      logger.error('Failed to create share token', { error: err, brandId: effectiveSummary?.brandId });
      toast({ variant: 'destructive', description: 'Impossible de générer le lien.' });
    }
  }, [effectiveSummary, toast]);

  const handleTopupCheckout = useCallback(async () => {
    if (!topupMetric || topupUnits <= 0) { toast({ variant: 'destructive', description: 'Sélectionnez une métrique et un volume de crédits.' }); return; }
    if (typeof window === 'undefined') return;
    setTopupCheckoutLoading(true);
    try {
      const origin = window.location.origin;
      const response = await api.post<{ checkoutUrl: string }>('/usage-billing/topups/checkout', {
        metric: topupMetric,
        units: topupUnits,
        successUrl: `${origin}/analytics?topup=success`,
        cancelUrl: `${origin}/analytics?topup=cancel`,
      });
      if (response?.checkoutUrl) window.location.href = response.checkoutUrl;
      else toast({ variant: 'destructive', description: 'Impossible de créer la session Stripe.' });
    } catch (err) {
      logger.error('Failed to create top-up checkout', { error: err, metric: topupMetric, units: topupUnits });
      toast({ variant: 'destructive', description: 'La création du top-up a échoué. Réessayez.' });
    } finally {
      setTopupCheckoutLoading(false);
    }
  }, [topupMetric, topupUnits, toast]);

  return {
    loading,
    error,
    effectiveSummary,
    effectivePlan,
    isDegraded,
    liveMode,
    liveStatusLabel,
    lastLiveUpdate,
    refresh,
    handleExportReport,
    exportingReport,
    emailShareLink,
    handleCopyShareLink,
    periodStats,
    timelineEntries,
    projectionHighlights,
    recommendedPlan,
    upgradeComparisons,
    mostCriticalMetric,
    topupMetric,
    setTopupMetric,
    topupUnits,
    setTopupUnits,
    topupTargetQuota,
    topupSliderMax,
    topupSliderStep,
    topupSimulation,
    topupSimulationLoading,
    topupSimulationSource,
    topupSimulationError: topupSimulationError ?? null,
    topupCheckoutLoading,
    handleTopupCheckout,
    formatDaysToLimit,
    topupHistory,
    topupHistoryLoading,
    topupHistoryError,
    reloadTopupHistory,
  };
}
