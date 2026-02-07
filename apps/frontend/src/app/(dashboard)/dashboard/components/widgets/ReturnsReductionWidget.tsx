'use client';

import React, { useEffect } from 'react';
import { useDashboardStore } from '@/store/dashboard.store';
import { WidgetWrapper } from './WidgetWrapper';
import { TrendingDown, PiggyBank } from 'lucide-react';

const WIDGET_SLUG = 'returns-reduction';

interface ReturnsReductionData {
  reductionPercent?: number;
  savings?: number;
  beforeAr?: number;
  afterAr?: number;
}

export function ReturnsReductionWidget() {
  const { widgetData, fetchWidgetData } = useDashboardStore();
  const data = widgetData[WIDGET_SLUG] as ReturnsReductionData | undefined;
  const isLoading = data === undefined && !Object.prototype.hasOwnProperty.call(widgetData, WIDGET_SLUG);

  useEffect(() => {
    fetchWidgetData(WIDGET_SLUG);
  }, [fetchWidgetData]);

  const hasData = data && (data.reductionPercent !== undefined || data.savings !== undefined || data.beforeAr !== undefined || data.afterAr !== undefined);

  return (
    <WidgetWrapper
      title="Réduction des retours"
      subtitle="Avant / après AR"
      isLoading={isLoading}
      error={data === null ? 'Impossible de charger les données' : undefined}
    >
      {hasData && (
        <div className="space-y-4">
          <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4">
            <div className="flex items-center gap-2 text-emerald-400 text-sm mb-1">
              <TrendingDown className="h-4 w-4" />
              Réduction des retours
            </div>
            <p className="text-2xl font-semibold text-white">
              {typeof data.reductionPercent === 'number'
                ? `${data.reductionPercent}%`
                : '—'}
            </p>
          </div>
          {data.savings !== undefined && data.savings > 0 && (
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <PiggyBank className="h-4 w-4" />
              <span>
                Économies estimées :{' '}
                <span className="text-white font-medium">
                  €{typeof data.savings === 'number' ? data.savings.toLocaleString() : '0'}
                </span>
              </span>
            </div>
          )}
          {(data.beforeAr !== undefined || data.afterAr !== undefined) && (
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded bg-slate-700/30 p-2">
                <span className="text-slate-500 block text-xs">Avant AR</span>
                <span className="text-white font-medium">{data.beforeAr ?? '—'}</span>
              </div>
              <div className="rounded bg-slate-700/30 p-2">
                <span className="text-slate-500 block text-xs">Après AR</span>
                <span className="text-white font-medium">{data.afterAr ?? '—'}</span>
              </div>
            </div>
          )}
        </div>
      )}
      {!hasData && !isLoading && data !== undefined && (
        <p className="text-slate-500 text-sm">Aucune donnée de retours.</p>
      )}
    </WidgetWrapper>
  );
}
