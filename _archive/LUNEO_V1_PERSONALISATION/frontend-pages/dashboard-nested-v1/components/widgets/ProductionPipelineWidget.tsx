'use client';

import React, { useEffect } from 'react';
import { useDashboardStore } from '@/store/dashboard.store';
import { WidgetWrapper } from './WidgetWrapper';
import { Pencil, Factory, Truck, CheckCircle } from 'lucide-react';

const WIDGET_SLUG = 'production-pipeline';

interface ProductionPipelineData {
  design?: number;
  production?: number;
  shipped?: number;
  delivered?: number;
}

const STAGES = [
  { key: 'design' as const, label: 'Design', icon: Pencil },
  { key: 'production' as const, label: 'Production', icon: Factory },
  { key: 'shipped' as const, label: 'Expédié', icon: Truck },
  { key: 'delivered' as const, label: 'Livré', icon: CheckCircle },
];

export function ProductionPipelineWidget() {
  const { widgetData, fetchWidgetData } = useDashboardStore();
  const data = widgetData[WIDGET_SLUG] as ProductionPipelineData | undefined;
  const isLoading = data === undefined && !Object.prototype.hasOwnProperty.call(widgetData, WIDGET_SLUG);

  useEffect(() => {
    fetchWidgetData(WIDGET_SLUG);
  }, [fetchWidgetData]);

  const hasData = data && (data.design !== undefined || data.production !== undefined || data.shipped !== undefined || data.delivered !== undefined);

  return (
    <WidgetWrapper
      title="Pipeline de production"
      subtitle="Print-on-demand"
      isLoading={isLoading}
      error={data === null ? 'Impossible de charger les données' : undefined}
    >
      {hasData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {STAGES.map(({ key, label, icon: Icon }) => (
            <div
              key={key}
              className="rounded-lg bg-slate-700/30 p-3 flex flex-col items-center text-center"
            >
              <Icon className="h-5 w-5 text-slate-400 mb-2" />
              <span className="text-2xl font-semibold text-white">
                {data[key] ?? 0}
              </span>
              <span className="text-xs text-slate-500 mt-1">{label}</span>
            </div>
          ))}
        </div>
      )}
      {!hasData && !isLoading && data !== undefined && (
        <p className="text-slate-500 text-sm">Aucune donnée de pipeline.</p>
      )}
    </WidgetWrapper>
  );
}
