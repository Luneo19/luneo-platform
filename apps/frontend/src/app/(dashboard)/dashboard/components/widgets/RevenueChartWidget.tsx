'use client';

import React, { useEffect } from 'react';
import { useDashboardStore } from '@/store/dashboard.store';
import { WidgetWrapper } from './WidgetWrapper';

const WIDGET_SLUG = 'revenue-chart';

interface MonthData {
  month: string;
  revenue: number;
  label?: string;
}

interface RevenueChartData {
  months?: MonthData[];
}

export function RevenueChartWidget() {
  const { widgetData, fetchWidgetData } = useDashboardStore();
  const data = widgetData[WIDGET_SLUG] as RevenueChartData | undefined;
  const isLoading = data === undefined && !Object.prototype.hasOwnProperty.call(widgetData, WIDGET_SLUG);

  useEffect(() => {
    fetchWidgetData(WIDGET_SLUG);
  }, [fetchWidgetData]);

  const months = data?.months ?? [];
  const hasData = months.length > 0;
  const maxRevenue = hasData ? Math.max(...months.map((m) => m.revenue), 1) : 1;

  return (
    <WidgetWrapper
      title="Chiffre d'affaires"
      subtitle="6 derniers mois"
      isLoading={isLoading}
      error={data === null ? 'Impossible de charger les données' : undefined}
    >
      {hasData && (
        <div className="space-y-3">
          <div className="flex items-end gap-2 h-32">
            {months.map((m, i) => (
              <div
                key={i}
                className="flex-1 flex flex-col items-center gap-1 min-w-0"
              >
                <div
                  className="w-full rounded-t bg-slate-600 min-h-[4px] transition-all"
                  style={{
                    height: `${Math.max(4, (m.revenue / maxRevenue) * 100)}%`,
                  }}
                />
                <span className="text-xs text-slate-500 truncate w-full text-center">
                  {m.label ?? m.month}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-slate-500 pt-1 border-t border-slate-700">
            <span>0</span>
            <span>€{maxRevenue.toLocaleString()}</span>
          </div>
        </div>
      )}
      {!hasData && !isLoading && data !== undefined && (
        <p className="text-slate-500 text-sm">Aucune donnée de CA.</p>
      )}
    </WidgetWrapper>
  );
}
