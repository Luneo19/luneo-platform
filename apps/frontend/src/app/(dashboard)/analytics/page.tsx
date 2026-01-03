/**
 * ★★★ PAGE - ANALYTICS & REPORTING ★★★
 * Page complète pour les analytics
 * - Dashboard stats
 * - Graphiques
 * - Rapports
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { memo } from 'react';
import { trpc } from '@/lib/trpc/client';
import { logger } from '@/lib/logger';
import { formatDate, formatPrice } from '@/lib/utils/formatters';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Package, ShoppingCart, DollarSign, Users, Download } from 'lucide-react';

// ========================================
// COMPONENT
// ========================================

function AnalyticsPageContent() {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  // Calculate dates based on period
  const periodDates = useMemo(() => {
    const end = new Date();
    const start = new Date();

    switch (period) {
      case 'week':
        start.setDate(start.getDate() - 7);
        break;
      case 'month':
        start.setMonth(start.getMonth() - 1);
        break;
      case 'year':
        start.setFullYear(start.getFullYear() - 1);
        break;
    }

    return { start, end };
  }, [period]);

  // Queries
  const dashboardStatsQuery = trpc.analytics.getDashboard.useQuery({
    timeRange: 'custom',
    dateFrom: periodDates.start.toISOString(),
    dateTo: periodDates.end.toISOString(),
  });

  // Note: getProductStats and generateReport are not yet implemented in the analytics router
  // const productStatsQuery = trpc.analytics.getProductStats.useQuery({
  //   periodStart: periodDates.start,
  //   periodEnd: periodDates.end,
  // });

  // Mutations
  // const generateReportMutation = trpc.analytics.generateReport.useMutation({
  //   onSuccess: (result: any) => {
  //     logger.info('Report generation started', { reportId: result.reportId });
  //     alert(`Rapport en cours de génération. ID: ${result.reportId}`);
  //   },
  // });

  // ========================================
  // HANDLERS
  // ========================================

  // const handleGenerateReport = useCallback(
  //   (type: 'products' | 'customizations' | 'orders' | 'revenue' | 'ar' | 'full') => {
  //     generateReportMutation.mutate({
  //       type,
  //       periodStart: periodDates.start,
  //       periodEnd: periodDates.end,
  //       format: 'pdf',
  //       includeCharts: true,
  //     });
  //   },
  //   [generateReportMutation, periodDates]
  // );

  // ========================================
  // RENDER
  // ========================================

  if (dashboardStatsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-300">Chargement des analytics...</p>
        </div>
      </div>
    );
  }

  const stats = dashboardStatsQuery.data;
  const products: any[] = []; // productStatsQuery.data || [];

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Analytics</h1>
          <p className="text-gray-600">Statistiques et rapports</p>
        </div>
        <Select value={period} onValueChange={(value) => setPeriod(value as any)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">7 derniers jours</SelectItem>
            <SelectItem value="month">30 derniers jours</SelectItem>
            <SelectItem value="year">12 derniers mois</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="products">Produits</TabsTrigger>
          <TabsTrigger value="reports">Rapports</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenus</CardTitle>
                <DollarSign className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatPrice((stats?.revenue || 0) / 100, 'EUR')}
                </div>
                <p className="text-xs text-gray-500">Période sélectionnée</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Commandes</CardTitle>
                <ShoppingCart className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.orders || 0}</div>
                <p className="text-xs text-gray-500">
                  {stats?.avgOrderValue
                    ? `Moyenne: ${formatPrice(stats.avgOrderValue / 100, 'EUR')}`
                    : 'Aucune commande'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Personnalisations</CardTitle>
                <Package className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  0
                </div>
                <p className="text-xs text-gray-500">
                  0 complétées
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sessions AR</CardTitle>
                <Users className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-gray-500">
                  Aucune session
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Usage Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Utilisation</CardTitle>
              <CardDescription>Statistiques d'utilisation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Personnalisations</span>
                  <span className="text-sm text-gray-600">
                    0
                  </span>
                </div>
                <Progress
                  value={0}
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Statistiques par produit</CardTitle>
              <CardDescription>
                Performance de vos produits
              </CardDescription>
            </CardHeader>
            <CardContent>
              {products.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600">Aucune donnée disponible</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {products.map((product) => (
                    <Card key={product.productId}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold">{product.productName}</h4>
                            <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                              <div>
                                <span className="text-gray-500">Vues:</span>{' '}
                                <span className="font-medium">{product.views}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Personnalisations:</span>{' '}
                                <span className="font-medium">{product.customizations}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Commandes:</span>{' '}
                                <span className="font-medium">{product.orders}</span>
                              </div>
                            </div>
                            <div className="mt-2">
                              <span className="text-gray-500">Revenus:</span>{' '}
                              <span className="font-medium">
                                {formatPrice(product.revenue / 100, 'EUR')}
                              </span>
                            </div>
                            <div className="mt-2">
                              <span className="text-gray-500">Taux de conversion:</span>{' '}
                              <span className="font-medium">
                                {(product.conversionRate * 100).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Rapports</CardTitle>
              <CardDescription>Générez des rapports personnalisés</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Rapport Produits</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => {/* handleGenerateReport('products') */}}
                      disabled={false}
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Générer PDF
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Rapport Complet</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => {/* handleGenerateReport('full') */}}
                      disabled={false}
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Générer PDF
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ========================================
// EXPORT
// ========================================

const AnalyticsPage = memo(function AnalyticsPage() {
  return (
    <ErrorBoundary>
      <AnalyticsPageContent />
    </ErrorBoundary>
  );
});

export default AnalyticsPage;
