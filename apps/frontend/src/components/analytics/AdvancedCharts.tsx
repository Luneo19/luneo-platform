'use client';

import { useMemo } from 'react';
import { useI18n } from '@/i18n/useI18n';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ChartData {
  date: string;
  value: number;
  [key: string]: string | number;
}

interface AdvancedChartsProps {
  data: ChartData[];
  type: 'line' | 'bar' | 'pie' | 'area';
  metric: string;
  comparison?: ChartData[];
  colors?: string[];
}

const DEFAULT_COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

export function AdvancedCharts({
  data,
  type,
  metric,
  comparison,
  colors = DEFAULT_COLORS,
}: AdvancedChartsProps) {
  const { t } = useI18n();
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    if (comparison && comparison.length > 0) {
      // Merge comparison data
      return data.map((item, index) => {
        const compareItem = comparison[index];
        return {
          ...item,
          [`${metric}_current`]: item.value,
          [`${metric}_previous`]: compareItem?.value || 0,
        };
      });
    }
    
    return data.map((item) => ({
      ...item,
      [metric]: item.value,
    }));
  }, [data, comparison, metric]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-800/50 rounded-lg">
        <p className="text-gray-400">Aucune donnée disponible</p>
      </div>
    );
  }

  switch (type) {
    case 'line':
      return (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af' }}
            />
            <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#f3f4f6' }}
            />
            <Legend wrapperStyle={{ color: '#f3f4f6' }} />
            {comparison ? (
              <>
                <Line
                  type="monotone"
                  dataKey={`${metric}_current`}
                  stroke={colors[0]}
                  strokeWidth={2}
                  name={t('common.currentPeriod')}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey={`${metric}_previous`}
                  stroke={colors[1]}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name={t('common.previousPeriod')}
                  dot={{ r: 4 }}
                />
              </>
            ) : (
              <Line
                type="monotone"
                dataKey={metric}
                stroke={colors[0]}
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      );

    case 'bar':
      return (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af' }}
            />
            <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#f3f4f6' }}
            />
            <Legend wrapperStyle={{ color: '#f3f4f6' }} />
            {comparison ? (
              <>
                <Bar
                  dataKey={`${metric}_current`}
                  fill={colors[0]}
                  name={t('common.currentPeriod')}
                />
                <Bar
                  dataKey={`${metric}_previous`}
                  fill={colors[1]}
                  name={t('common.previousPeriod')}
                />
              </>
            ) : (
              <Bar dataKey={metric} fill={colors[0]} />
            )}
          </BarChart>
        </ResponsiveContainer>
      );

    case 'area':
      return (
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id={`color${metric}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors[0]} stopOpacity={0.8} />
                <stop offset="95%" stopColor={colors[0]} stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af' }}
            />
            <YAxis stroke="#9ca3af" tick={{ fill: '#9ca3af' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#f3f4f6' }}
            />
            <Legend wrapperStyle={{ color: '#f3f4f6' }} />
            {comparison ? (
              <>
                <Area
                  type="monotone"
                  dataKey={`${metric}_current`}
                  stroke={colors[0]}
                  fillOpacity={0.6}
                  fill={`url(#color${metric})`}
                  name={t('common.currentPeriod')}
                />
                <Area
                  type="monotone"
                  dataKey={`${metric}_previous`}
                  stroke={colors[1]}
                  fillOpacity={0.3}
                  fill={colors[1]}
                  name={t('common.previousPeriod')}
                />
              </>
            ) : (
              <Area
                type="monotone"
                dataKey={metric}
                stroke={colors[0]}
                fillOpacity={0.6}
                fill={`url(#color${metric})`}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      );

    case 'pie':
      const pieData = chartData.map((item, index) => ({
        name: item.date || `Item ${index + 1}`,
        value: item.value,
      }));

      return (
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name}: ${(percent * 100).toFixed(0)}%`
              }
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors[index % colors.length]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#f3f4f6' }}
            />
            <Legend wrapperStyle={{ color: '#f3f4f6' }} />
          </PieChart>
        </ResponsiveContainer>
      );

    default:
      return null;
  }
}
