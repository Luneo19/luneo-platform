/**
 * ★★★ REVENUE CHART ★★★
 * Graphique de revenu (MRR/Revenue) avec toggle et gradients
 * Utilise Recharts pour l'affichage
 */

'use client';

import React, { useState } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';

export interface RevenueDataPoint {
  date: string;
  mrr: number;
  revenue: number;
  newCustomers?: number;
}

export interface RevenueChartProps {
  data: RevenueDataPoint[];
  isLoading?: boolean;
  className?: string;
}

export function RevenueChart({ data, isLoading = false, className }: RevenueChartProps) {
  const [viewMode, setViewMode] = useState<'mrr' | 'revenue'>('mrr');

  if (isLoading) {
    return (
      <Card className={cn('bg-zinc-800 border-zinc-700', className)}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">Revenue Chart</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-zinc-700/50 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((point) => ({
    ...point,
    date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-lg">
          <p className="text-sm text-zinc-400 mb-2">{payload[0].payload.date}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={cn('bg-zinc-800 border-zinc-700', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Revenue Chart
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'mrr' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('mrr')}
              className="h-8 text-xs"
            >
              MRR
            </Button>
            <Button
              variant={viewMode === 'revenue' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('revenue')}
              className="h-8 text-xs"
            >
              Revenue
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              stroke="#9ca3af"
              fontSize={12}
              tickLine={{ stroke: '#9ca3af' }}
            />
            <YAxis
              stroke="#9ca3af"
              fontSize={12}
              tickLine={{ stroke: '#9ca3af' }}
              tickFormatter={(value) => `€${(value / 1000).toFixed(0)}K`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {viewMode === 'mrr' ? (
              <Area
                type="monotone"
                dataKey="mrr"
                stroke="#3b82f6"
                fill="url(#colorMrr)"
                strokeWidth={2}
                name="MRR"
              />
            ) : (
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                fill="url(#colorRevenue)"
                strokeWidth={2}
                name="Revenue"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
