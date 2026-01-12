/**
 * Combo Chart Component
 * Combination of bar and line charts for multi-metric visualization
 */

'use client';

import React from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';

export interface ComboChartDataPoint {
  date: string;
  [key: string]: string | number;
}

export interface BarSeries {
  key: string;
  name: string;
  color: string;
}

export interface LineSeries {
  key: string;
  name: string;
  color: string;
  yAxisId?: 'left' | 'right';
}

export interface ComboChartProps {
  title: string;
  data: ComboChartDataPoint[];
  barSeries: BarSeries[];
  lineSeries: LineSeries[];
  isLoading?: boolean;
  className?: string;
  showLegend?: boolean;
}

export function ComboChart({
  title,
  data,
  barSeries,
  lineSeries,
  isLoading = false,
  className,
  showLegend = true,
}: ComboChartProps) {
  if (isLoading) {
    return (
      <Card className={cn('bg-zinc-800 border-zinc-700', className)}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">{title}</CardTitle>
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
        <CardTitle className="text-lg font-semibold text-white">{title}</CardTitle>
        <p className="text-sm text-zinc-400 mt-2">
          Combined bar and line chart for multi-metric analysis
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              stroke="#9ca3af"
              fontSize={12}
              tickLine={{ stroke: '#9ca3af' }}
            />
            <YAxis
              yAxisId="left"
              stroke="#9ca3af"
              fontSize={12}
              tickLine={{ stroke: '#9ca3af' }}
              tickFormatter={(value) => {
                if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                return value.toString();
              }}
            />
            {lineSeries.some((s) => s.yAxisId === 'right') && (
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#9ca3af"
                fontSize={12}
                tickLine={{ stroke: '#9ca3af' }}
              />
            )}
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
            {barSeries.map(({ key, name, color }) => (
              <Bar
                key={key}
                dataKey={key}
                name={name}
                fill={color}
                yAxisId="left"
                radius={[4, 4, 0, 0]}
              />
            ))}
            {lineSeries.map(({ key, name, color, yAxisId = 'left' }) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                name={name}
                stroke={color}
                strokeWidth={2}
                yAxisId={yAxisId}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
