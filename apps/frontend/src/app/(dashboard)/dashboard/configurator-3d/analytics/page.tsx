/**
 * Global Analytics Page - Across all 3D configurations
 */

'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { BarChart3, Settings, Users, DollarSign, Loader2 } from 'lucide-react';
import { configurator3dEndpoints } from '@/lib/api/configurator-3d.endpoints';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function GlobalAnalyticsPage() {
  const [dateRange, setDateRange] = useState('30d');

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['configurator3d', 'analytics', 'dashboard', dateRange],
    queryFn: () =>
      configurator3dEndpoints.analytics.dashboard({
        startDate: dateRange === '7d' ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined,
        endDate: dateRange === '7d' ? new Date().toISOString().split('T')[0] : undefined,
      }),
  });

  const { data: configsData } = useQuery({
    queryKey: ['configurator3d', 'configurations'],
    queryFn: () => configurator3dEndpoints.configurations.list<{ data?: { id: string; name: string; sessionCount?: number; conversionCount?: number; revenue?: number }[] }>({ limit: 100 }),
  });

  const d = dashboardData as {
    totalConfigurations?: number;
    totalSessions?: number;
    totalConversions?: number;
    totalRevenue?: number;
    conversionTrend?: { date: string; count: number }[];
    revenueTrend?: { date: string; amount: number }[];
    deviceBreakdown?: { device: string; count: number }[];
    topConfigurations?: { id: string; name: string; sessions: number; conversions: number; revenue: number }[];
  };

  const configs = (configsData && Array.isArray(configsData) ? configsData : (configsData as { data?: unknown[] })?.data) ?? [];
  const topConfigs = d?.topConfigurations ?? configs.slice(0, 10).map((c: { id: string; name: string; sessionCount?: number; conversionCount?: number; revenue?: number }) => ({
    id: c.id,
    name: c.name,
    sessions: c.sessionCount ?? 0,
    conversions: c.conversionCount ?? 0,
    revenue: c.revenue ?? 0,
  }));

  const kpis = [
    { label: 'Configurations', value: d?.totalConfigurations ?? configs.length, icon: Settings },
    { label: 'Total Sessions', value: d?.totalSessions ?? 0, icon: Users },
    { label: 'Total Conversions', value: d?.totalConversions ?? 0, icon: BarChart3 },
    { label: 'Total Revenue', value: `${d?.totalRevenue ?? 0}`, icon: DollarSign },
  ];

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-6">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">3D Configurator Analytics</h1>
          <p className="text-muted-foreground">Overview across all configurations</p>
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{k.label}</CardTitle>
              <k.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{k.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Conversion trend</CardTitle>
            <CardDescription>Conversions over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-48 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground">
              Chart: Conversion trend
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue chart</CardTitle>
            <CardDescription>Revenue over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-48 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground">
              Chart: Revenue
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Device breakdown</CardTitle>
            <CardDescription>Desktop, tablet, mobile</CardDescription>
          </CardHeader>
          <CardContent>
            {d?.deviceBreakdown && d.deviceBreakdown.length > 0 ? (
              <div className="space-y-2">
                {d.deviceBreakdown.map((item) => (
                  <div key={item.device} className="flex items-center justify-between rounded border px-3 py-2">
                    <span>{item.device}</span>
                    <span className="font-medium">{item.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center text-muted-foreground">
                No device data
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top configurations</CardTitle>
            <CardDescription>By sessions and conversions</CardDescription>
          </CardHeader>
          <CardContent>
            {topConfigs.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Sessions</TableHead>
                    <TableHead>Conversions</TableHead>
                    <TableHead>Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topConfigs.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <Link href={`/dashboard/configurator-3d/${c.id}`} className="font-medium hover:underline">
                          {c.name}
                        </Link>
                      </TableCell>
                      <TableCell>{c.sessions}</TableCell>
                      <TableCell>{c.conversions}</TableCell>
                      <TableCell>{c.revenue}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">No data yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
