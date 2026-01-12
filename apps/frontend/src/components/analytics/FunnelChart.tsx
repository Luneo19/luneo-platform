'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface FunnelStep {
  name: string;
  value: number;
  percentage: number;
  dropoff?: number;
}

interface FunnelChartProps {
  steps: FunnelStep[];
  colors?: string[];
}

const DEFAULT_COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

export function FunnelChart({
  steps,
  colors = DEFAULT_COLORS,
}: FunnelChartProps) {
  const chartData = useMemo(() => {
    if (!steps || steps.length === 0) return [];

    return steps.map((step, index) => ({
      name: step.name,
      value: step.value,
      percentage: step.percentage,
      dropoff: step.dropoff || 0,
      color: colors[index % colors.length],
    }));
  }, [steps, colors]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-800/50 rounded-lg">
        <p className="text-gray-400">Aucune donnée disponible</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis type="number" stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
        <YAxis
          dataKey="name"
          type="category"
          stroke="#9ca3af"
          tick={{ fill: '#9ca3af' }}
          width={150}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '8px',
          }}
          labelStyle={{ color: '#f3f4f6' }}
          formatter={(value: number, name: string) => {
            if (name === 'value') {
              return [value.toLocaleString(), 'Utilisateurs'];
            }
            if (name === 'percentage') {
              return [`${value.toFixed(1)}%`, 'Taux de conversion'];
            }
            if (name === 'dropoff') {
              return [`${value.toFixed(1)}%`, 'Taux d\'abandon'];
            }
            return [value, name];
          }}
        />
        <Legend wrapperStyle={{ color: '#f3f4f6' }} />
        <Bar dataKey="value" name="Utilisateurs" radius={[0, 8, 8, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
