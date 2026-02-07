'use client';

import React, { memo } from 'react';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useUsageQuota } from './useUsageQuota';
import { UsageQuotaHeader } from './UsageQuotaHeader';
import { UsageQuotaPlanSummary } from './UsageQuotaPlanSummary';
import { UsageQuotaTimelineAndProjections } from './UsageQuotaTimelineAndProjections';
import { UsageQuotaRecommendedPlanCard } from './UsageQuotaRecommendedPlanCard';
import { UsageQuotaUpgradeComparisons } from './UsageQuotaUpgradeComparisons';
import { UsageQuotaTopupSimulator } from './UsageQuotaTopupSimulator';
import { UsageQuotaTopupHistory } from './UsageQuotaTopupHistory';
import { UsageQuotaMetricsGrid } from './UsageQuotaMetricsGrid';

function UsageQuotaOverviewInner() {
  const state = useUsageQuota();
  const {
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
    topupSimulationError,
    topupCheckoutLoading,
    handleTopupCheckout,
    formatDaysToLimit,
    topupHistory,
    topupHistoryLoading,
    topupHistoryError,
    reloadTopupHistory,
  } = state;

  return (
    <div className="space-y-6">
      <UsageQuotaHeader
        liveMode={liveMode}
        isDegraded={isDegraded}
        liveStatusLabel={liveStatusLabel}
        lastLiveUpdate={lastLiveUpdate}
        onRefresh={() => refresh()}
        onExportReport={handleExportReport}
        exportingReport={exportingReport}
        emailShareLink={emailShareLink}
        effectiveSummary={effectiveSummary}
        onCopyShareLink={handleCopyShareLink}
      />

      {loading && (
        <Card className="border-gray-800 bg-gray-900/70 p-6 animate-pulse">
          <div className="h-4 w-40 rounded bg-gray-800 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-3 rounded bg-gray-800" style={{ width: i === 4 ? '75%' : i === 3 ? '83%' : i === 2 ? '91%' : '100%' }} />)}
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
          <div className="text-sm">Flux temps réel momentanément indisponible. Nous repassons sur les snapshots API et relançons une synchronisation automatique.</div>
        </Card>
      )}

      {!loading && effectiveSummary && effectivePlan && (
        <>
          <UsageQuotaPlanSummary effectivePlan={effectivePlan} effectiveSummary={effectiveSummary} periodStats={periodStats} mostCriticalMetric={mostCriticalMetric} />
          <div className="grid gap-6 lg:grid-cols-3">
            <UsageQuotaTimelineAndProjections timelineEntries={timelineEntries} projectionHighlights={projectionHighlights} effectivePlan={effectivePlan} />
            <UsageQuotaRecommendedPlanCard recommendedPlan={recommendedPlan} />
          </div>
          <UsageQuotaUpgradeComparisons upgradeComparisons={upgradeComparisons} />
          <UsageQuotaTopupSimulator
            effectiveSummary={effectiveSummary}
            effectivePlan={effectivePlan}
            topupMetric={topupMetric}
            topupUnits={topupUnits}
            topupTargetQuota={topupTargetQuota}
            topupSliderMax={topupSliderMax}
            topupSliderStep={topupSliderStep}
            topupSimulation={topupSimulation}
            topupSimulationLoading={topupSimulationLoading}
            topupSimulationSource={topupSimulationSource}
            topupSimulationError={topupSimulationError}
            topupCheckoutLoading={topupCheckoutLoading}
            onSetTopupMetric={setTopupMetric}
            onSetTopupUnits={setTopupUnits}
            onTopupCheckout={handleTopupCheckout}
            formatDaysToLimit={formatDaysToLimit}
          />
          <UsageQuotaTopupHistory topupHistory={topupHistory} topupHistoryLoading={topupHistoryLoading} topupHistoryError={topupHistoryError} effectivePlan={effectivePlan} onReload={reloadTopupHistory} />
          <UsageQuotaMetricsGrid metrics={effectiveSummary.metrics} effectivePlan={effectivePlan} />
        </>
      )}
    </div>
  );
}

export const UsageQuotaOverview = memo(UsageQuotaOverviewInner);
