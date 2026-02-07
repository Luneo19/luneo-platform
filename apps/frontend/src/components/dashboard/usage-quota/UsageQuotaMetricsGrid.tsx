'use client';

import { Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { metricIcons } from './constants';
import type { PlanDefinition } from './types';
import { formatMetricLabel, formatUnit, formatCurrency } from './utils';
import type { UsageSummaryMetric } from '@/lib/hooks/useUsageSummary';

interface UsageQuotaMetricsGridProps {
  metrics: UsageSummaryMetric[];
  effectivePlan: PlanDefinition;
}

export function UsageQuotaMetricsGrid({ metrics, effectivePlan }: UsageQuotaMetricsGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {metrics.map((metric: UsageSummaryMetric) => {
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
  );
}
