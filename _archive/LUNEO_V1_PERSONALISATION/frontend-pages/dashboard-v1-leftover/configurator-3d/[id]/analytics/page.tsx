/**
 * Configuration Analytics Page - Sessions, conversions, funnel, heatmap
 */

'use client';

import { use, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ChevronLeft, Download, Loader2, Users, MousePointer, DollarSign, Clock } from 'lucide-react';
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

export default function ConfigurationAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [dateRange, setDateRange] = useState('7d');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: funnelData } = useQuery({
    queryKey: ['configurator3d', 'analytics', 'funnel', id, startDate, endDate],
    queryFn: () => configurator3dEndpoints.analytics.funnel(id, { startDate, endDate }),
  });

  const { data: optionsData } = useQuery({
    queryKey: ['configurator3d', 'analytics', 'options', id],
    queryFn: () => configurator3dEndpoints.analytics.options(id),
  });

  const { data: sessionsData } = useQuery({
    queryKey: ['configurator3d', 'analytics', 'sessions', id, startDate, endDate],
    queryFn: () =>
      configurator3dEndpoints.analytics.sessions({ startDate, endDate }),
  });

  const funnel = (funnelData as { funnel?: { stage: string; count: number }[] })?.funnel ?? [];
  const optionsHeatmap = (optionsData as { options?: { optionId: string; optionName: string; count: number }[] })?.options ?? [];
  const sessions = (sessionsData as { data?: { id: string; status: string; startedAt?: string; lastActivityAt?: string }[] })?.data ?? [];

  const kpis = [
    { label: 'Sessions', value: (funnelData as { totalSessions?: number })?.totalSessions ?? 0, icon: Users },
    { label: 'Conversions', value: (funnelData as { conversions?: number })?.conversions ?? 0, icon: MousePointer },
    { label: 'Revenue', value: `${(funnelData as { revenue?: number })?.revenue ?? 0}`, icon: DollarSign },
    { label: 'Avg Duration', value: `${(funnelData as { avgDuration?: number })?.avgDuration ?? 0}s`, icon: Clock },
  ];

  const handleExport = async () => {
    try {
      const res = await configurator3dEndpoints.analytics.export({
        format: 'csv',
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      if (res && typeof res === 'object' && 'url' in res) {
        window.open((res as { url: string }).url, '_blank');
      }
      // Fallback: trigger download if backend returns blob
    } catch {
      // Export may not be implemented
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/dashboard/configurator-3d/${id}`}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">Sessions, conversions, and performance</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
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
            <CardTitle>Sessions over time</CardTitle>
            <CardDescription>Line chart placeholder</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-48 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground">
              Chart: Sessions trend
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conversion funnel</CardTitle>
            <CardDescription>Stages from view to conversion</CardDescription>
          </CardHeader>
          <CardContent>
            {funnel.length > 0 ? (
              <div className="space-y-2">
                {funnel.map((s, i) => (
                  <div key={i} className="flex items-center justify-between rounded border px-3 py-2">
                    <span>{s.stage}</span>
                    <span className="font-medium">{s.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center text-muted-foreground">
                No funnel data
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Options heatmap</CardTitle>
          <CardDescription>Most selected options</CardDescription>
        </CardHeader>
        <CardContent>
          {optionsHeatmap.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {optionsHeatmap.slice(0, 12).map((o, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded border px-3 py-2"
                >
                  <span className="truncate">{o.optionName}</span>
                  <span className="font-medium">{o.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No option selection data yet</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sessions</CardTitle>
          <CardDescription>Recent sessions with details</CardDescription>
        </CardHeader>
        <CardContent>
          {sessions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Last activity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.slice(0, 10).map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs">{s.id.slice(0, 8)}...</TableCell>
                    <TableCell>{s.status}</TableCell>
                    <TableCell>{s.startedAt ? new Date(s.startedAt).toLocaleString() : '-'}</TableCell>
                    <TableCell>{s.lastActivityAt ? new Date(s.lastActivityAt).toLocaleString() : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">No sessions yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
