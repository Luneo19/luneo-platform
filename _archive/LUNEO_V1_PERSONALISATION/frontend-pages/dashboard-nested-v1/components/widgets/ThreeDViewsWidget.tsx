'use client';

import React, { useEffect } from 'react';
import { useDashboardStore } from '@/store/dashboard.store';
import { WidgetWrapper } from './WidgetWrapper';
import { Box, Clock, TrendingUp } from 'lucide-react';

const WIDGET_SLUG = '3d-views';

interface ThreeDViewsData {
  viewsToday?: number;
  popularModels?: Array<{ name: string; views: number }>;
  avgViewTimeSeconds?: number;
}

export function ThreeDViewsWidget() {
  const { widgetData, fetchWidgetData } = useDashboardStore();
  const data = widgetData[WIDGET_SLUG] as ThreeDViewsData | undefined;
  const isLoading = data === undefined && !Object.prototype.hasOwnProperty.call(widgetData, WIDGET_SLUG);

  useEffect(() => {
    fetchWidgetData(WIDGET_SLUG);
  }, [fetchWidgetData]);

  const hasData = data && (data.viewsToday !== undefined || (data.popularModels?.length ?? 0) > 0 || data.avgViewTimeSeconds !== undefined);

  return (
    <WidgetWrapper
      title="Vues 3D"
      subtitle="Statistiques du configurateur 3D"
      isLoading={isLoading}
      error={data === null ? 'Impossible de charger les données' : undefined}
    >
      {hasData && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-slate-700/30 p-3">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Box className="h-3.5 w-3.5" />
                Vues aujourd&apos;hui
              </div>
              <p className="text-lg font-semibold text-white">
                {data.viewsToday ?? 0}
              </p>
            </div>
            <div className="rounded-lg bg-slate-700/30 p-3">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Clock className="h-3.5 w-3.5" />
                Temps moyen
              </div>
              <p className="text-lg font-semibold text-white">
                {typeof data.avgViewTimeSeconds === 'number'
                  ? `${Math.round(data.avgViewTimeSeconds)}s`
                  : '—'}
              </p>
            </div>
          </div>
          {data.popularModels && data.popularModels.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                <TrendingUp className="h-3.5 w-3.5" />
                Modèles populaires
              </div>
              <ul className="space-y-2">
                {data.popularModels.slice(0, 5).map((m, i) => (
                  <li
                    key={i}
                    className="flex justify-between text-sm text-slate-300"
                  >
                    <span className="truncate">{m.name}</span>
                    <span className="text-white font-medium shrink-0 ml-2">
                      {m.views}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      {!hasData && !isLoading && data !== undefined && (
        <p className="text-slate-500 text-sm">Aucune donnée 3D pour le moment.</p>
      )}
    </WidgetWrapper>
  );
}
