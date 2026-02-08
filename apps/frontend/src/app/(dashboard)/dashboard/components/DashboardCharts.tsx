'use client';

/**
 * Composant Graphiques du Dashboard
 * Affiche les graphiques de performance
 */

import { memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { trpc } from '@/lib/trpc/client';

interface DashboardChartsProps {
  period: '7d' | '30d' | '90d';
}

function DashboardChartsContent({ period }: DashboardChartsProps) {
  // Convert period to timeRange format
  const timeRange = period === '7d' ? '7d' : period === '30d' ? '30d' : '90d';

  const analyticsQuery = trpc.analytics.getDashboard.useQuery({
    timeRange,
    compare: true,
  });

  if (analyticsQuery.isLoading) {
    return (
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle>Performance</CardTitle>
          <CardDescription>Chargement des données...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (analyticsQuery.isError) {
    return (
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle>Performance</CardTitle>
          <CardDescription>Erreur lors du chargement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-red-400">
            <p>Impossible de charger les données</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const data = analyticsQuery.data;

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader>
        <CardTitle>Performance</CardTitle>
        <CardDescription>
          Évolution des revenus et commandes sur {period === '7d' ? '7 jours' : period === '30d' ? '30 jours' : '90 jours'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Revenue Chart Placeholder */}
          <div className="h-48 flex items-center justify-center border border-gray-200 rounded-lg bg-gray-50">
            <div className="text-center text-gray-600">
              <p className="text-lg font-semibold mb-2">
                {data?.revenue ? `€${(data.revenue / 100).toFixed(2)}` : '€0.00'}
              </p>
              <p className="text-sm">Revenus totaux</p>
            </div>
          </div>

          {/* Orders Chart Placeholder */}
          <div className="h-48 flex items-center justify-center border border-gray-200 rounded-lg bg-gray-50">
            <div className="text-center text-gray-600">
              <p className="text-lg font-semibold mb-2">
                {data?.orders ?? 0}
              </p>
              <p className="text-sm">Commandes totales</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export const DashboardCharts = memo(DashboardChartsContent);



