'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, Users, MousePointer, DollarSign } from 'lucide-react';
import { logger } from '@/lib/logger';
import { format, subDays } from 'date-fns';

export interface ARAnalyticsDashboardProps {
  projectId?: string | null;
  /** Use global analytics when projectId is not set */
  global?: boolean;
  className?: string;
}

interface KPIData {
  totalSessions?: number;
  avgDuration?: number;
  conversionRate?: number;
  revenue?: number;
  sessions?: number;
  placements?: number;
  conversions?: number;
}

export function ARAnalyticsDashboard({ projectId, global = false, className }: ARAnalyticsDashboardProps) {
  const [range, setRange] = useState<'7d' | '30d'>('7d');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<KPIData | null>(null);
  const [sessionsOverTime, setSessionsOverTime] = useState<{ date: string; count: number }[]>([]);
  const [platformDistribution, setPlatformDistribution] = useState<{ platform: string; count: number }[]>([]);
  const [topModels, setTopModels] = useState<{ modelId: string; name: string; views: number }[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const end = new Date();
    const start = subDays(end, range === '7d' ? 7 : 30);
    const params = { startDate: format(start, 'yyyy-MM-dd'), endDate: format(end, 'yyyy-MM-dd') };
    try {
      const { endpoints } = await import('@/lib/api/client');
      if (global) {
        const res = await endpoints.ar.analytics.dashboard(params) as KPIData & { sessionsTrend?: unknown[]; platformDistribution?: unknown[]; topModels?: unknown[] };
        setData(res);
        setSessionsOverTime((res.sessionsTrend as { date: string; count: number }[]) ?? []);
        setPlatformDistribution((res.platformDistribution as { platform: string; count: number }[]) ?? []);
        setTopModels((res.topModels as { modelId: string; name: string; views: number }[]) ?? []);
      } else if (projectId) {
        const res = await endpoints.ar.projects.analytics(projectId, params) as KPIData & { sessionsOverTime?: unknown[]; platformDistribution?: unknown[] };
        setData(res);
        setSessionsOverTime((res.sessionsOverTime as { date: string; count: number }[]) ?? []);
        setPlatformDistribution((res.platformDistribution as { platform: string; count: number }[]) ?? []);
        setTopModels([]);
      }
    } catch (err) {
      logger.error('ARAnalyticsDashboard: fetch failed', { error: err });
    } finally {
      setLoading(false);
    }
  }, [projectId, global, range]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const kpis = [
    { label: 'Sessions', value: data?.totalSessions ?? data?.sessions ?? 0, icon: Users },
    { label: 'Avg duration (s)', value: data?.avgDuration ?? 0, icon: TrendingUp },
    { label: 'Placements', value: data?.placements ?? 0, icon: MousePointer },
    { label: 'Conversion rate', value: data?.conversionRate != null ? `${Number(data.conversionRate).toFixed(1)}%` : '—', icon: TrendingUp },
    { label: 'Revenue', value: data?.revenue != null ? `$${Number(data.revenue).toFixed(0)}` : '—', icon: DollarSign },
  ];

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h2 className="text-lg font-semibold">AR Analytics</h2>
        <div className="flex items-center gap-2">
          <Label htmlFor="ar-dash-range" className="text-sm text-muted-foreground">Range</Label>
          <Select value={range} onValueChange={(v) => setRange(v as '7d' | '30d')}>
            <SelectTrigger id="ar-dash-range" className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {kpis.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="pt-4">
              {loading ? (
                <Skeleton className="h-16 w-full" />
              ) : (
                <>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Icon className="h-4 w-4" />
                    {label}
                  </div>
                  <p className="text-2xl font-semibold mt-1">{value}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sessions over time</CardTitle>
            <CardDescription>AR session starts by day</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-40 w-full" />
            ) : sessionsOverTime.length ? (
              <div className="space-y-1 text-sm">
                {sessionsOverTime.slice(0, 10).map(({ date, count }) => (
                  <div key={date} className="flex justify-between">
                    <span>{date}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No data for this range.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Platform distribution</CardTitle>
            <CardDescription>Sessions by device</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-40 w-full" />
            ) : platformDistribution.length ? (
              <div className="space-y-1 text-sm">
                {platformDistribution.map(({ platform, count }) => (
                  <div key={platform} className="flex justify-between">
                    <span className="capitalize">{platform}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No data.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {topModels.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base">Top models</CardTitle>
            <CardDescription>By views</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {topModels.slice(0, 5).map((m) => (
                <li key={m.modelId} className="flex justify-between">
                  <span>{m.name}</span>
                  <span className="font-medium">{m.views}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
