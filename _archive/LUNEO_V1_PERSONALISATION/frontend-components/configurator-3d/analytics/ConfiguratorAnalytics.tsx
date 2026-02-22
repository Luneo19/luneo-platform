'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  Calendar,
  TrendingUp,
  Users,
  ShoppingCart,
  Clock,
  DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { configurator3dEndpoints } from '@/lib/api/configurator-3d.endpoints';
import { format, subDays } from 'date-fns';
import { SessionsTable } from './SessionsTable';
import { ConversionFunnel } from './ConversionFunnel';
import { OptionHeatmap } from './OptionHeatmap';
import { RevenueChart } from './RevenueChart';

const RANGE_OPTIONS = [
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
] as const;

export interface ConfiguratorAnalyticsProps {
  configId?: string;
  projectId?: string;
  className?: string;
}

interface DashboardData {
  sessions?: number;
  conversions?: number;
  revenue?: number;
  avgDuration?: number;
  sessionsList?: unknown[];
  funnel?: { step: string; count: number; rate?: number }[];
  options?: { componentId: string; optionId: string; count: number; percentage?: number }[];
  revenueOverTime?: { date: string; revenue: number; sessions: number }[];
}

export function ConfiguratorAnalytics({
  configId,
  projectId,
  className,
}: ConfiguratorAnalyticsProps) {
  const [rangeDays, setRangeDays] = useState(30);
  const [customStart, setCustomStart] = useState(
    format(subDays(new Date(), 30), 'yyyy-MM-dd')
  );
  const [customEnd, setCustomEnd] = useState(format(new Date(), 'yyyy-MM-dd'));

  const params = useMemo(
    () => ({
      startDate: customStart,
      endDate: customEnd,
      ...(configId && { configId }),
      ...(projectId && { projectId }),
    }),
    [customStart, customEnd, configId, projectId]
  );

  const { data, isLoading } = useQuery({
    queryKey: ['configurator-analytics', params],
    queryFn: async () => {
      const res = await configurator3dEndpoints.analytics.dashboard<DashboardData>(params);
      return (typeof res === 'object' && res !== null ? res : {}) as DashboardData;
    },
  });

  const handleRangeSelect = (days: number) => {
    setRangeDays(days);
    setCustomStart(format(subDays(new Date(), days), 'yyyy-MM-dd'));
    setCustomEnd(format(new Date(), 'yyyy-MM-dd'));
  };

  const dashboard = data ?? {};
  const sessions = dashboard.sessions ?? 0;
  const conversions = dashboard.conversions ?? 0;
  const revenue = dashboard.revenue ?? 0;
  const avgDuration = dashboard.avgDuration ?? 0;

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
          <p className="text-muted-foreground">
            Configurator performance and insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          {RANGE_OPTIONS.map((r) => (
            <Button
              key={r.days}
              variant={rangeDays === r.days ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleRangeSelect(r.days)}
            >
              {r.label}
            </Button>
          ))}
          <div className="flex items-center gap-2 border-l pl-4">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="rounded border border-input bg-background px-2 py-1 text-sm"
            />
            <span className="text-muted-foreground">–</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="rounded border border-input bg-background px-2 py-1 text-sm"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              title="Sessions"
              value={sessions.toLocaleString()}
              icon={Users}
              description="Total configurator sessions"
            />
            <KpiCard
              title="Conversions"
              value={conversions.toLocaleString()}
              icon={ShoppingCart}
              description="Add to cart / Purchase"
            />
            <KpiCard
              title="Revenue"
              value={`€${revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
              icon={DollarSign}
              description="From configurator"
            />
            <KpiCard
              title="Avg. Duration"
              value={`${Math.round(avgDuration / 60)}m`}
              icon={Clock}
              description="Session length"
            />
          </div>

          {configId && (
            <RevenueChart
              configId={configId}
              startDate={customStart}
              endDate={customEnd}
            />
          )}

          {configId && dashboard.funnel && (
            <ConversionFunnel steps={dashboard.funnel} />
          )}

          {configId && dashboard.options && (
            <OptionHeatmap options={dashboard.options} />
          )}

          <SessionsTable
            params={params}
            configId={configId}
          />
        </>
      )}
    </div>
  );
}

function KpiCard({
  title,
  value,
  icon: Icon,
  description,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  description: string;
}) {
  const IconComponent = Icon as React.ComponentType<{ className?: string }>;
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <IconComponent className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
