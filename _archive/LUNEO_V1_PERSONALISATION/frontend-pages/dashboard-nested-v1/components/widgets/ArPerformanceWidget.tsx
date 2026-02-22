'use client';

import React, { useEffect } from 'react';
import { useDashboardStore } from '@/store/dashboard.store';
import { WidgetWrapper } from './WidgetWrapper';
import { Eye, ShoppingBag, Sparkles } from 'lucide-react';

const WIDGET_SLUG = 'ar-performance';

interface ArPerformanceData {
  sessionsCount?: number;
  conversionRate?: number;
  popularProducts?: Array<{ name: string; tryOnCount: number }>;
}

export function ArPerformanceWidget() {
  const { widgetData, fetchWidgetData } = useDashboardStore();
  const data = widgetData[WIDGET_SLUG] as ArPerformanceData | undefined;
  const isLoading = data === undefined && !Object.prototype.hasOwnProperty.call(widgetData, WIDGET_SLUG);

  useEffect(() => {
    fetchWidgetData(WIDGET_SLUG);
  }, [fetchWidgetData]);

  const hasData = data && (data.sessionsCount !== undefined || data.conversionRate !== undefined || (data.popularProducts?.length ?? 0) > 0);

  return (
    <WidgetWrapper
      title="AR Try-on"
      subtitle="Sessions et conversion"
      isLoading={isLoading}
      error={data === null ? 'Impossible de charger les données' : undefined}
    >
      {hasData && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-slate-700/30 p-3">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Eye className="h-3.5 w-3.5" />
                Sessions
              </div>
              <p className="text-lg font-semibold text-white">
                {data.sessionsCount ?? 0}
              </p>
            </div>
            <div className="rounded-lg bg-slate-700/30 p-3">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <ShoppingBag className="h-3.5 w-3.5" />
                Taux conversion
              </div>
              <p className="text-lg font-semibold text-white">
                {typeof data.conversionRate === 'number'
                  ? `${data.conversionRate.toFixed(1)}%`
                  : '—'}
              </p>
            </div>
          </div>
          {data.popularProducts && data.popularProducts.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                <Sparkles className="h-3.5 w-3.5" />
                Produits populaires
              </div>
              <ul className="space-y-2">
                {data.popularProducts.slice(0, 5).map((p, i) => (
                  <li
                    key={i}
                    className="flex justify-between text-sm text-slate-300"
                  >
                    <span className="truncate">{p.name}</span>
                    <span className="text-white font-medium shrink-0 ml-2">
                      {p.tryOnCount}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      {!hasData && !isLoading && data !== undefined && (
        <p className="text-slate-500 text-sm">Aucune donnée AR pour le moment.</p>
      )}
    </WidgetWrapper>
  );
}
