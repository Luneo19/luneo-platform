'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface UsageMetric {
  label: string;
  used: number;
  limit: number;
  unit?: string;
  icon?: React.ReactNode;
}

interface UsageGaugeProps {
  metric: UsageMetric;
  className?: string;
}

function getProgressColor(percent: number): string {
  if (percent >= 90) return 'bg-red-500';
  if (percent >= 75) return 'bg-amber-500';
  if (percent >= 50) return 'bg-blue-500';
  return 'bg-emerald-500';
}

function formatValue(value: number, unit?: string): string {
  if (unit === 'GB') return `${value.toFixed(1)} GB`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return value.toString();
}

function formatLimit(limit: number, unit?: string): string {
  if (limit < 0) return 'Illimité';
  return formatValue(limit, unit);
}

export function UsageGauge({ metric, className }: UsageGaugeProps) {
  const isUnlimited = metric.limit < 0;
  const percent = isUnlimited ? 0 : Math.min((metric.used / Math.max(metric.limit, 1)) * 100, 100);
  const isWarning = percent >= 80;
  const isCritical = percent >= 95;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {metric.icon}
          <span className="text-gray-300 font-medium">{metric.label}</span>
          {isWarning && !isUnlimited && (
            <AlertTriangle className={cn('w-3.5 h-3.5', isCritical ? 'text-red-400' : 'text-amber-400')} />
          )}
        </div>
        <div className="text-gray-400">
          <span className="text-white font-semibold">{formatValue(metric.used, metric.unit)}</span>
          {' / '}
          <span>{formatLimit(metric.limit, metric.unit)}</span>
        </div>
      </div>

      {!isUnlimited ? (
        <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', getProgressColor(percent))}
            style={{ width: `${percent}%` }}
          />
        </div>
      ) : (
        <div className="h-2 bg-emerald-900/30 rounded-full">
          <div className="h-full w-full bg-emerald-500/20 rounded-full" />
        </div>
      )}

      {!isUnlimited && (
        <div className="flex justify-between text-xs text-gray-500">
          <span>{Math.round(percent)}% utilisé</span>
          <span>{formatValue(Math.max(0, metric.limit - metric.used), metric.unit)} restant</span>
        </div>
      )}
    </div>
  );
}

interface UsageOverviewProps {
  metrics: UsageMetric[];
  planName?: string;
  renewalDate?: string;
  className?: string;
}

export function UsageOverview({ metrics, planName, renewalDate, className }: UsageOverviewProps) {
  const warningCount = metrics.filter((m) => {
    if (m.limit < 0) return false;
    return (m.used / Math.max(m.limit, 1)) * 100 >= 80;
  }).length;

  return (
    <Card className={cn('bg-dark-card border-white/[0.06]', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-white">Utilisation du plan</CardTitle>
          <div className="flex items-center gap-2">
            {planName && (
              <Badge variant="outline" className="bg-purple-900/30 border-purple-500/30 text-purple-300">
                {planName}
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge variant="outline" className="bg-amber-900/30 border-amber-500/30 text-amber-300">
                {warningCount} limite{warningCount > 1 ? 's' : ''} proche{warningCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>
        {renewalDate && (
          <p className="text-xs text-gray-500">Renouvellement le {renewalDate}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-5">
        {metrics.map((metric) => (
          <UsageGauge key={metric.label} metric={metric} />
        ))}
      </CardContent>
    </Card>
  );
}
