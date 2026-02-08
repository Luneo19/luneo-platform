'use client';

import React from 'react';
import { useDashboardStore } from '@/store/dashboard.store';
import { ArPerformanceWidget } from './widgets/ArPerformanceWidget';
import { ThreeDViewsWidget } from './widgets/ThreeDViewsWidget';
import { AiGenerationsWidget } from './widgets/AiGenerationsWidget';
import { RecentOrdersWidget } from './widgets/RecentOrdersWidget';
import { RevenueChartWidget } from './widgets/RevenueChartWidget';
import { ProductionPipelineWidget } from './widgets/ProductionPipelineWidget';
import { CustomizationFunnelWidget } from './widgets/CustomizationFunnelWidget';
import { TopProductsWidget } from './widgets/TopProductsWidget';
import { ReturnsReductionWidget } from './widgets/ReturnsReductionWidget';
import { QuickActionsWidget } from './widgets/QuickActionsWidget';
import { OnboardingProgressWidget } from './widgets/OnboardingProgressWidget';

const WIDGET_MAP: Record<
  string,
  React.ComponentType
> = {
  'ar-performance': ArPerformanceWidget,
  '3d-views': ThreeDViewsWidget,
  'ai-generations': AiGenerationsWidget,
  'recent-orders': RecentOrdersWidget,
  'revenue-chart': RevenueChartWidget,
  'production-pipeline': ProductionPipelineWidget,
  'customization-funnel': CustomizationFunnelWidget,
  'top-products': TopProductsWidget,
  'returns-reduction': ReturnsReductionWidget,
  'quick-actions': QuickActionsWidget,
  'onboarding-progress': OnboardingProgressWidget,
};

function isWidgetVisible(
  widgetSlug: string,
  isDefaultVisible: boolean,
  overrides: Record<string, unknown> | null | undefined
): boolean {
  const o = overrides?.[widgetSlug];
  if (o !== null && o !== undefined && typeof o === 'object' && 'visible' in o) {
    return Boolean((o as { visible?: boolean }).visible);
  }
  return isDefaultVisible;
}

function getWidgetOrder(
  w: { widgetSlug: string; position: number },
  overrides: Record<string, unknown> | null | undefined
): number {
  const o = overrides?.[w.widgetSlug];
  if (o !== null && o !== undefined && typeof o === 'object' && 'order' in o) {
    return Number((o as { order?: number }).order) ?? w.position;
  }
  return w.position;
}

export function WidgetGrid() {
  const { dashboardConfig, userPreferences } = useDashboardStore();
  const widgets = dashboardConfig?.widgets ?? [];
  const overrides = userPreferences?.widgetOverrides ?? null;

  const visibleWidgets = React.useMemo(() => {
    return widgets
      .filter((w) =>
        isWidgetVisible(w.widgetSlug, w.isDefaultVisible, overrides)
      )
      .sort((a, b) => getWidgetOrder(a, overrides) - getWidgetOrder(b, overrides));
  }, [widgets, overrides]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {visibleWidgets.map((w) => {
        const Component = WIDGET_MAP[w.widgetSlug];
        if (!Component) return null;
        return (
          <div
            key={w.id}
            className="min-h-[200px]"
            style={{
              gridColumn: w.gridWidth > 1 ? `span ${w.gridWidth}` : undefined,
              gridRow: w.gridHeight > 1 ? `span ${w.gridHeight}` : undefined,
            }}
          >
            <Component />
          </div>
        );
      })}
    </div>
  );
}
