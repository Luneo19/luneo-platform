'use client';

import React, { useEffect } from 'react';
import { useDashboardStore } from '@/store/dashboard.store';
import { useIndustryStore } from '@/store/industry.store';
import { DashboardHeader } from './DashboardHeader';
import { KpiBar } from './kpis/KpiBar';
import { WidgetGrid } from './WidgetGrid';
import { DashboardCustomizer } from './DashboardCustomizer';
import { Skeleton } from '@/components/ui/skeleton';

export type InitialNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
};

interface DashboardShellProps {
  initialNotifications?: InitialNotification[];
}

export function DashboardShell({ initialNotifications = [] }: DashboardShellProps) {
  void initialNotifications;
  const {
    fetchDashboardConfig,
    fetchKpiValues,
    dashboardConfig,
    isLoading,
    error,
  } = useDashboardStore();
  const { currentIndustry, fetchCurrentIndustry } = useIndustryStore();

  useEffect(() => {
    fetchDashboardConfig();
    fetchKpiValues();
  }, [fetchDashboardConfig, fetchKpiValues]);

  useEffect(() => {
    if (currentIndustry?.slug) {
      fetchCurrentIndustry(currentIndustry.slug);
    }
  }, [currentIndustry?.slug, fetchCurrentIndustry]);

  if (isLoading && !dashboardConfig) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <Skeleton className="h-9 w-48 bg-slate-800" />
            <Skeleton className="h-5 w-64 mt-2 bg-slate-800" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-24 rounded-lg bg-slate-800" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64 rounded-lg bg-slate-800" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 py-4 px-4">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6 min-w-0 overflow-x-hidden">
      <DashboardHeader />
      <KpiBar />
      <WidgetGrid />
      <DashboardCustomizer />
    </div>
  );
}
