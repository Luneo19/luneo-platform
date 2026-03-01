/**
 * ★★★ BAR CHART ★★★
 * Graphique en barres horizontal/vertical avec effets hover
 * Utilise Recharts pour l'affichage
 */

'use client';

import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';

export interface BarChartData {
  name: string;
  value: number;
  [key: string]: string | number;
}

export interface BarChartWidgetProps {
  title: string;
  data: BarChartData[];
  dataKey: string;
  isLoading?: boolean;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  color?: string;
  showGrid?: boolean;
}

export function BarChartWidget({
  title,
  data,
  dataKey,
  isLoading = false,
  className,
  orientation = 'vertical',
  color = '#3b82f6',
  showGrid = true,
}: BarChartWidgetProps) {
  if (isLoading) {
    return (
      <Card className={cn('bg-white/[0.03] border-white/[0.06]', className)}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-white/[0.06] rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string; payload: Record<string, unknown> }> }) => {
    if (active && payload && payload.length) {
      const firstPayload = payload[0].payload as { name?: string };
      return (
        <div className="rounded-lg p-3 border border-white/[0.06]" style={{ backgroundColor: '#1a1a2e' }}>
          <p className="text-sm text-white/80 mb-2">{firstPayload.name}</p>
          {payload.map((entry, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {typeof entry.value === 'number' ? formatCurrency(entry.value) : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={cn('bg-white/[0.03] border-white/[0.06]', className)}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-white">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          {orientation === 'horizontal' ? (
            <RechartsBarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />}
              <XAxis type="number" stroke="#a1a1aa" fontSize={12} />
              <YAxis
                dataKey="name"
                type="category"
                stroke="#a1a1aa"
                fontSize={12}
                width={100}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey={dataKey} fill={color} radius={[0, 4, 4, 0]} />
            </RechartsBarChart>
          ) : (
            <RechartsBarChart
              data={data}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />}
              <XAxis
                dataKey="name"
                stroke="#a1a1aa"
                fontSize={12}
                tickLine={{ stroke: '#a1a1aa' }}
              />
              <YAxis
                stroke="#a1a1aa"
                fontSize={12}
                tickLine={{ stroke: '#a1a1aa' }}
                tickFormatter={(value) => {
                  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                  return value.toString();
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
            </RechartsBarChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
