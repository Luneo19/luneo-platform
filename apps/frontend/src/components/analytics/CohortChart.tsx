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

interface CohortData {
  cohort: string; // e.g., "2024-01"
  period: number; // Period number (0, 1, 2, ...)
  retention: number; // Retention percentage
  users: number;
}

interface CohortChartProps {
  data: CohortData[];
  format?: 'heatmap' | 'bar';
}

export function CohortChart({
  data,
  format = 'heatmap',
}: CohortChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Group by cohort
    const cohorts = new Map<string, CohortData[]>();
    data.forEach((item) => {
      if (!cohorts.has(item.cohort)) {
        cohorts.set(item.cohort, []);
      }
      cohorts.get(item.cohort)!.push(item);
    });

    // Transform to chart format
    const periods = Math.max(...data.map((d) => d.period)) + 1;
    const result: Array<Record<string, string | number>> = [];

    cohorts.forEach((items, cohort) => {
      const row: Record<string, string | number> = { cohort };
      for (let i = 0; i < periods; i++) {
        const item = items.find((it) => it.period === i);
        row[`period_${i}`] = item?.retention || 0;
        row[`users_${i}`] = item?.users || 0;
      }
      result.push(row);
    });

    return result;
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-800/50 rounded-lg">
        <p className="text-gray-400">Aucune donnée disponible</p>
      </div>
    );
  }

  if (format === 'bar') {
    // Bar chart format
    const periods = Math.max(...data.map((d) => d.period)) + 1;
    const periodKeys = Array.from({ length: periods }, (_, i) => `period_${i}`);

    return (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="cohort"
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
            formatter={(value: number) => `${value.toFixed(1)}%`}
          />
          <Legend wrapperStyle={{ color: '#f3f4f6' }} />
          {periodKeys.map((key, index) => (
            <Bar
              key={key}
              dataKey={key}
              name={`Période ${index}`}
              fill={`hsl(${(index * 360) / periods}, 70%, 50%)`}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  }

  // Heatmap format (simplified as table with colors)
  const periods = Math.max(...data.map((d) => d.period)) + 1;
  const getColor = (value: number) => {
    if (value >= 80) return 'bg-green-600';
    if (value >= 60) return 'bg-green-500';
    if (value >= 40) return 'bg-yellow-500';
    if (value >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border border-gray-700 p-2 text-left text-gray-300">
              Cohorte
            </th>
            {Array.from({ length: periods }, (_, i) => (
              <th
                key={i}
                className="border border-gray-700 p-2 text-center text-gray-300"
              >
                Période {i}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {chartData.map((row) => (
            <tr key={row.cohort}>
              <td className="border border-gray-700 p-2 text-gray-300">
                {row.cohort}
              </td>
              {Array.from({ length: periods }, (_, i) => {
                const value = Number(row[`period_${i}`] ?? 0);
                return (
                  <td
                    key={i}
                    className={`border border-gray-700 p-2 text-center ${getColor(
                      value,
                    )} text-white font-semibold`}
                  >
                    {value.toFixed(1)}%
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
