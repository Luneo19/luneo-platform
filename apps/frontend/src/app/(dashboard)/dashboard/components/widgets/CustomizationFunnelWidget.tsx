'use client';

import React, { useEffect } from 'react';
import { useDashboardStore } from '@/store/dashboard.store';
import { WidgetWrapper } from './WidgetWrapper';

const WIDGET_SLUG = 'customization-funnel';

interface CustomizationFunnelData {
  started?: number;
  completed?: number;
  purchased?: number;
  startedPct?: number;
  completedPct?: number;
  purchasedPct?: number;
}

export function CustomizationFunnelWidget() {
  const { widgetData, fetchWidgetData } = useDashboardStore();
  const data = widgetData[WIDGET_SLUG] as CustomizationFunnelData | undefined;
  const isLoading = data === undefined && !Object.prototype.hasOwnProperty.call(widgetData, WIDGET_SLUG);

  useEffect(() => {
    fetchWidgetData(WIDGET_SLUG);
  }, [fetchWidgetData]);

  const hasData = data && (data.started !== undefined || data.completed !== undefined || data.purchased !== undefined);

  const steps = hasData
    ? [
        { label: 'Personnalisation commencée', value: data.startedPct ?? data.started ?? 0, count: data.started },
        { label: 'Personnalisation terminée', value: data.completedPct ?? data.completed ?? 0, count: data.completed },
        { label: 'Acheté', value: data.purchasedPct ?? data.purchased ?? 0, count: data.purchased },
      ]
    : [];

  return (
    <WidgetWrapper
      title="Entonnoir de personnalisation"
      subtitle="Started → Completed → Purchased"
      isLoading={isLoading}
      error={data === null ? 'Impossible de charger les données' : undefined}
    >
      {hasData && steps.length > 0 && (
        <div className="space-y-4">
          {steps.map((step, i) => (
            <div key={i}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400">{step.label}</span>
                <span className="text-white font-medium">
                  {typeof step.value === 'number' && step.value <= 100
                    ? `${step.value}%`
                    : step.count ?? step.value}
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-slate-500 transition-all"
                  style={{
                    width: `${Math.min(100, typeof step.value === 'number' ? step.value : 0)}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
      {!hasData && !isLoading && data !== undefined && (
        <p className="text-slate-500 text-sm">Aucune donnée d&apos;entonnoir.</p>
      )}
    </WidgetWrapper>
  );
}
