'use client';

import { Card } from '@/components/ui/card';
import type { PlanDefinition } from './types';
import type { UsageSummaryData } from './types';
import type { PeriodStats } from './utils';
import type { UsageSummaryMetric } from '@/lib/hooks/useUsageSummary';
import { getQuotaLabel } from './utils';
import { formatCurrency } from './utils';

interface UsageQuotaPlanSummaryProps {
  effectivePlan: PlanDefinition;
  effectiveSummary: UsageSummaryData;
  periodStats: PeriodStats | null;
  mostCriticalMetric: UsageSummaryMetric | null;
}

export function UsageQuotaPlanSummary({
  effectivePlan,
  effectiveSummary,
  periodStats,
  mostCriticalMetric,
}: UsageQuotaPlanSummaryProps) {
  const periodLabel = periodStats
    ? `Jours ${periodStats.elapsedDays}/${periodStats.totalDays}`
    : '—';

  return (
    <Card className="border-gray-800 bg-gray-900/50 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-400">Plan actuel</p>
          <h3 className="text-xl font-semibold text-white">{effectivePlan.name}</h3>
          <p className="text-xs text-gray-500 mt-1">{periodLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {mostCriticalMetric && (
            <div className="rounded-lg border border-gray-700 bg-gray-800/60 px-4 py-2">
              <p className="text-xs text-gray-400">
                {getQuotaLabel(mostCriticalMetric.type, effectivePlan)}
              </p>
              <p className="text-lg font-semibold text-white">
                {mostCriticalMetric.percentage.toFixed(0)}% utilisé
              </p>
            </div>
          )}
          <div className="rounded-lg border border-gray-700 bg-gray-800/60 px-4 py-2">
            <p className="text-xs text-gray-400">Overage estimé</p>
            <p className="text-lg font-semibold text-white">
              {formatCurrency(effectiveSummary.estimatedCost.overage)}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
