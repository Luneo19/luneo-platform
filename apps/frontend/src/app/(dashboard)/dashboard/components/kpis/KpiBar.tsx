'use client';

import React, { useEffect } from 'react';
import { useDashboardStore } from '@/store/dashboard.store';
import { KpiCard } from './KpiCard';
import { Skeleton } from '@/components/ui/skeleton';

export function KpiBar() {
  const { kpiValues, dashboardConfig, fetchKpiValues, isLoading } =
    useDashboardStore();

  useEffect(() => {
    fetchKpiValues();
  }, [fetchKpiValues]);

  const visibleKpis = React.useMemo(() => {
    if (!dashboardConfig?.kpis?.length) return kpiValues;
    const visibleSlugs = new Set(
      dashboardConfig.kpis
        .filter((k) => k.isDefaultVisible)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((k) => k.kpiSlug)
    );
    return kpiValues
      .filter((k) => visibleSlugs.has(k.slug))
      .sort((a, b) => {
        const orderA = dashboardConfig.kpis.find((k) => k.kpiSlug === a.slug)?.sortOrder ?? 0;
        const orderB = dashboardConfig.kpis.find((k) => k.kpiSlug === b.slug)?.sortOrder ?? 0;
        return orderA - orderB;
      });
  }, [dashboardConfig?.kpis, kpiValues]);

  if (isLoading && kpiValues.length === 0) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton
            key={i}
            className="h-24 rounded-lg bg-slate-800/50"
          />
        ))}
      </div>
    );
  }

  if (!visibleKpis.length) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {visibleKpis.map((kpi) => (
        <KpiCard
          key={kpi.slug}
          slug={kpi.slug}
          label={kpi.labelFr || kpi.labelEn}
          value={kpi.value}
          formattedValue={kpi.formattedValue}
          trend={kpi.trend}
          icon={kpi.icon}
        />
      ))}
    </div>
  );
}
