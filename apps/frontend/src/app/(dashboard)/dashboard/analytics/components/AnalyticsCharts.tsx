/**
 * Composant graphiques pour Analytics
 * Utilise Recharts pour des graphiques interactifs
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { ChartData } from '../types';

interface AnalyticsChartsProps {
  chartData: ChartData;
  isLoading?: boolean;
}

// Couleurs pour les graphiques (thème dark)
const CHART_COLORS = {
  revenue: '#06b6d4', // cyan-500
  orders: '#8b5cf6', // purple-500
  users: '#10b981', // emerald-500
  conversions: '#f59e0b', // amber-500
  grid: '#374151', // gray-700
  text: '#9ca3af', // gray-400
};

// Formater les données pour Recharts
const formatChartData = (chartData: ChartData) => {
  if (!chartData.labels.length || !chartData.datasets.length) {
    return [];
  }

  return chartData.labels.map((label, index) => {
    const dataPoint: Record<string, string | number> = {
      date: label,
    };

    chartData.datasets.forEach((dataset) => {
      dataPoint[dataset.label] = dataset.data[index] || 0;
    });

    return dataPoint;
  });
};

// Mémoriser le composant pour éviter les re-renders inutiles
export const AnalyticsCharts = React.memo(function AnalyticsCharts({ chartData, isLoading }: AnalyticsChartsProps) {
  const formattedData = React.useMemo(() => formatChartData(chartData), [chartData]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <Card key={i} className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <div className="h-6 bg-gray-700 rounded animate-pulse mb-2 w-1/3" />
              <div className="h-4 bg-gray-700 rounded animate-pulse w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!chartData.labels.length || !chartData.datasets.length) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Évolution des métriques</CardTitle>
          <CardDescription className="text-gray-400">
            Graphiques interactifs des performances
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <p className="mb-2">Aucune donnée disponible</p>
              <p className="text-sm">Sélectionnez une période pour voir les données</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Déterminer le type de graphique selon le nombre de datasets
  const hasMultipleDatasets = chartData.datasets.length > 1;
  const primaryDataset = chartData.datasets[0];

  // Tooltip personnalisé pour le thème dark
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-lg">
          <p className="text-white font-semibold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString('fr-FR')}
              {entry.dataKey === 'revenue' && ' €'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Graphique principal - Area Chart pour tendances */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Évolution des revenus</CardTitle>
          <CardDescription className="text-gray-400">
            Tendance sur la période sélectionnée
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={formattedData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.revenue} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_COLORS.revenue} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
              <XAxis
                dataKey="date"
                stroke={CHART_COLORS.text}
                style={{ fontSize: '12px' }}
                tick={{ fill: CHART_COLORS.text }}
              />
              <YAxis
                stroke={CHART_COLORS.text}
                style={{ fontSize: '12px' }}
                tick={{ fill: CHART_COLORS.text }}
                tickFormatter={(value) => `${value}€`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ color: CHART_COLORS.text }}
                iconType="circle"
              />
              <Area
                type="monotone"
                dataKey={primaryDataset.label}
                stroke={CHART_COLORS.revenue}
                fillOpacity={1}
                fill="url(#colorRevenue)"
                name="Revenus"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Graphique secondaire - Bar Chart pour comparaisons */}
      {hasMultipleDatasets && (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Comparaison des métriques</CardTitle>
            <CardDescription className="text-gray-400">
              Vue comparative sur la période
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={formattedData}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                <XAxis
                  dataKey="date"
                  stroke={CHART_COLORS.text}
                  style={{ fontSize: '12px' }}
                  tick={{ fill: CHART_COLORS.text }}
                />
                <YAxis
                  stroke={CHART_COLORS.text}
                  style={{ fontSize: '12px' }}
                  tick={{ fill: CHART_COLORS.text }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ color: CHART_COLORS.text }}
                  iconType="square"
                />
                {chartData.datasets.map((dataset, index) => {
                  const colors = [
                    CHART_COLORS.revenue,
                    CHART_COLORS.orders,
                    CHART_COLORS.users,
                    CHART_COLORS.conversions,
                  ];
                  return (
                    <Bar
                      key={dataset.label}
                      dataKey={dataset.label}
                      fill={colors[index % colors.length]}
                      name={dataset.label}
                    />
                  );
                })}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Graphique de tendance - Line Chart si plusieurs datasets */}
      {hasMultipleDatasets && chartData.datasets.length > 1 && (
        <Card className="bg-gray-800/50 border-gray-700 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white">Tendances multiples</CardTitle>
            <CardDescription className="text-gray-400">
              Évolution de toutes les métriques
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={formattedData}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                <XAxis
                  dataKey="date"
                  stroke={CHART_COLORS.text}
                  style={{ fontSize: '12px' }}
                  tick={{ fill: CHART_COLORS.text }}
                />
                <YAxis
                  stroke={CHART_COLORS.text}
                  style={{ fontSize: '12px' }}
                  tick={{ fill: CHART_COLORS.text }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ color: CHART_COLORS.text }}
                  iconType="line"
                />
                {chartData.datasets.map((dataset, index) => {
                  const colors = [
                    CHART_COLORS.revenue,
                    CHART_COLORS.orders,
                    CHART_COLORS.users,
                    CHART_COLORS.conversions,
                  ];
                  return (
                    <Line
                      key={dataset.label}
                      type="monotone"
                      dataKey={dataset.label}
                      stroke={colors[index % colors.length]}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      name={dataset.label}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
});

