'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PlanCoverageInsight } from './types';
import { formatCurrency } from './utils';

interface UsageQuotaUpgradeComparisonsProps {
  upgradeComparisons: PlanCoverageInsight[];
}

export function UsageQuotaUpgradeComparisons({ upgradeComparisons }: UsageQuotaUpgradeComparisonsProps) {
  if (upgradeComparisons.length === 0) {
    return null;
  }

  return (
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
  );
}
