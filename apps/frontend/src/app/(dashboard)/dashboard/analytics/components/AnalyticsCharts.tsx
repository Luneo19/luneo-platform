/**
 * Composant graphiques pour Analytics
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ChartData } from '../types';

interface AnalyticsChartsProps {
  chartData: ChartData;
  isLoading?: boolean;
}

export function AnalyticsCharts({ chartData, isLoading }: AnalyticsChartsProps) {
  if (isLoading) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Évolution des revenus</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!chartData.labels.length || !chartData.datasets.length) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Évolution des revenus</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-400">
            Aucune donnée disponible
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Évolution des revenus</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 flex items-center justify-center">
          {/* TODO: Intégrer un composant de graphique Chart.js ou Recharts */}
          <div className="text-center text-gray-400">
            <p className="mb-2">Graphique de revenus</p>
            <p className="text-sm">
              {chartData.labels.length} points de données
            </p>
            <p className="text-xs mt-2">
              Total: {chartData.datasets[0]?.data.reduce((a, b) => a + b, 0).toFixed(2)}€
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

