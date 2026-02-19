'use client';

import { usePCEMetrics } from '@/hooks/usePCE';
import { Loader2 } from 'lucide-react';

export function PCEMetricsChart() {
  const { data: metrics, isLoading } = usePCEMetrics('week');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!metrics) {
    return <p className="text-muted-foreground text-center py-8">Aucune donnée disponible</p>;
  }

  const m = metrics as Record<string, unknown>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <MetricCard label="Taux de succès" value={`${m.successRate ?? 0}%`} />
        <MetricCard label="Temps moyen" value={formatMs((m.avgDurationMs as number) ?? 0)} />
        <MetricCard label="Complétés" value={String(m.completed ?? 0)} />
        <MetricCard label="Échoués" value={String(m.failed ?? 0)} />
      </div>

      {m.stageBreakdown && Object.keys(m.stageBreakdown as Record<string, number>).length > 0 ? (
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-3">Répartition par étape</h4>
          <div className="space-y-2">
            {Object.entries(m.stageBreakdown as Record<string, number>).map(([stage, count]) => (
              <div key={stage} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{stage}</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}

function formatMs(ms: number): string {
  if (ms === 0) return '-';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}min`;
  return `${(ms / 3_600_000).toFixed(1)}h`;
}
