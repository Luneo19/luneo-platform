/**
 * Line Chart Component
 * Advanced line chart with multiple series and interactive features
 */

'use client';

import React from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';

export interface LineChartDataPoint {
  date: string;
  [key: string]: string | number;
}

export interface LineChartProps {
  title: string;
  data: LineChartDataPoint[];
  dataKeys: Array<{ key: string; name: string; color: string; strokeWidth?: number; strokeDasharray?: string }>;
  isLoading?: boolean;
  className?: string;
  showLegend?: boolean;
  showGrid?: boolean;
  showReferenceLine?: boolean;
  referenceLineValue?: number;
  xLabel?: string;
  yLabel?: string;
}

export function LineChart({
  title,
  data,
  dataKeys,
  isLoading = false,
  className,
  showLegend = true,
  showGrid = true,
  showReferenceLine = false,
  referenceLineValue,
  xLabel,
  yLabel,
}: LineChartProps) {
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

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name?: string; value?: number; color?: string; payload?: { date?: string } }> }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-lg">
          <p className="text-sm text-zinc-400 mb-2">{payload[0]?.payload?.date}</p>
          {payload.map((entry, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value ?? 0)}
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
        {(xLabel || yLabel) && (
          <p className="text-sm text-zinc-400 mt-2">
            {xLabel && `X: ${xLabel}`} {yLabel && `Y: ${yLabel}`}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <RechartsLineChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#374151" />}
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
              tickFormatter={(value) => {
                if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                return value.toString();
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend />}
            {showReferenceLine && referenceLineValue !== undefined && (
              <ReferenceLine
                y={referenceLineValue}
                stroke="#ef4444"
                strokeDasharray="5 5"
                label={{ value: 'Target', position: 'right' }}
              />
            )}
            {dataKeys.map(({ key, name, color, strokeWidth = 2, strokeDasharray }) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                name={name}
                stroke={color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </RechartsLineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
