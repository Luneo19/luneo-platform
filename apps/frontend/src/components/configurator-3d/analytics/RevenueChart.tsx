'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { configurator3dEndpoints } from '@/lib/api/configurator-3d.endpoints';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface RevenueDataPoint {
  date: string;
  revenue: number;
  sessions: number;
}

export interface RevenueChartProps {
  configId: string;
  startDate: string;
  endDate: string;
  className?: string;
}

export function RevenueChart({
  configId,
  startDate,
  endDate,
  className,
}: RevenueChartProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['configurator-revenue', configId, startDate, endDate],
    queryFn: async () => {
      const res = await configurator3dEndpoints.analytics.dashboard<{
        revenueOverTime?: RevenueDataPoint[];
      }>({ startDate, endDate } as { startDate?: string; endDate?: string });
      const d = (typeof res === 'object' && res !== null ? res : {}) as {
        revenueOverTime?: RevenueDataPoint[];
      };
      return d.revenueOverTime ?? [];
    },
  });

  const chartData = (data ?? []).map((d) => ({
    ...d,
    dateLabel: format(parseISO(d.date), 'MMM d'),
  }));

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Revenue Over Time
        </CardTitle>
        <CardDescription>
          Revenue and sessions for the selected period
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-[300px] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            No revenue data for this period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="dateLabel"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `€${v}`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number, name: string) => [
                  name === 'revenue' ? `€${value.toFixed(2)}` : value,
                  name === 'revenue' ? 'Revenue' : 'Sessions',
                ]}
                labelFormatter={(label) => label}
              />
              <Legend />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--primary))"
                fill="url(#colorRevenue)"
                strokeWidth={2}
                name="Revenue"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="sessions"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={2}
                dot={false}
                name="Sessions"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
