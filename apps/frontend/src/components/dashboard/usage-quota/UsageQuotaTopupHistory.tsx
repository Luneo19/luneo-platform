'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { PlanDefinition } from './types';
import { getQuotaLabel, getMetricUnit } from './utils';
import { currencyFormatter } from './utils';
import type { TopupHistoryEntry } from '@/lib/hooks/useTopupHistory';
import { appRoutes } from '@/lib/routes';

interface UsageQuotaTopupHistoryProps {
  topupHistory: TopupHistoryEntry[];
  topupHistoryLoading: boolean;
  topupHistoryError: string | null;
  effectivePlan: PlanDefinition | null;
  onReload: () => void;
}

export function UsageQuotaTopupHistory({
  topupHistory,
  topupHistoryLoading,
  topupHistoryError,
  effectivePlan,
  onReload,
}: UsageQuotaTopupHistoryProps) {
  return (
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
              void onReload();
            }}
            disabled={topupHistoryLoading}
          >
            Actualiser
          </Button>
          <Button asChild size="sm" variant="outline" className="border-gray-700 text-gray-200">
            <Link href={appRoutes.billing}>Ouvrir la facturation</Link>
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
            const unit = effectivePlan
              ? getMetricUnit(entry.metric, effectivePlan)
              : '';

            return (
              <div
                key={entry.id}
                className="rounded-xl border border-gray-800/60 bg-gray-950/50 px-4 py-3 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-white">
                    {label} · {entry.units.toLocaleString()} {unit}
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
        <p className="text-sm text-gray-400">Aucun top-up enregistré pour l'instant.</p>
      )}
    </Card>
  );
}
