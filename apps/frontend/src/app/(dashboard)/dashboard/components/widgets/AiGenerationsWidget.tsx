'use client';

import React, { useEffect } from 'react';
import { useDashboardStore } from '@/store/dashboard.store';
import { WidgetWrapper } from './WidgetWrapper';
import { Sparkles, Zap, Palette } from 'lucide-react';

const WIDGET_SLUG = 'ai-generations';

interface AiGenerationsData {
  generationsToday?: number;
  tokensUsed?: number;
  popularStyles?: Array<{ name: string; count: number }>;
}

export function AiGenerationsWidget() {
  const { widgetData, fetchWidgetData } = useDashboardStore();
  const data = widgetData[WIDGET_SLUG] as AiGenerationsData | undefined;
  const isLoading = data === undefined && !Object.prototype.hasOwnProperty.call(widgetData, WIDGET_SLUG);

  useEffect(() => {
    fetchWidgetData(WIDGET_SLUG);
  }, [fetchWidgetData]);

  const hasData = data && (data.generationsToday !== undefined || data.tokensUsed !== undefined || (data.popularStyles?.length ?? 0) > 0);

  return (
    <WidgetWrapper
      title="Générations IA"
      subtitle="Activité et styles"
      isLoading={isLoading}
      error={data === null ? 'Impossible de charger les données' : undefined}
    >
      {hasData && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-slate-700/30 p-3">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Sparkles className="h-3.5 w-3.5" />
                Aujourd&apos;hui
              </div>
              <p className="text-lg font-semibold text-white">
                {data.generationsToday ?? 0}
              </p>
            </div>
            <div className="rounded-lg bg-slate-700/30 p-3">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Zap className="h-3.5 w-3.5" />
                Tokens utilisés
              </div>
              <p className="text-lg font-semibold text-white">
                {data.tokensUsed ?? 0}
              </p>
            </div>
          </div>
          {data.popularStyles && data.popularStyles.length > 0 && (
            <div>
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                <Palette className="h-3.5 w-3.5" />
                Styles populaires
              </div>
              <ul className="space-y-2">
                {data.popularStyles.slice(0, 5).map((s, i) => (
                  <li
                    key={i}
                    className="flex justify-between text-sm text-slate-300"
                  >
                    <span className="truncate">{s.name}</span>
                    <span className="text-white font-medium shrink-0 ml-2">
                      {s.count}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      {!hasData && !isLoading && data !== undefined && (
        <p className="text-slate-500 text-sm">Aucune génération récente.</p>
      )}
    </WidgetWrapper>
  );
}
