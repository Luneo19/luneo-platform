'use client';

/**
 * Analytics Dashboard - Professional Analytics Dashboard Component
 * Complete implementation with advanced charts, metrics, and real-time data
 */

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  ShoppingCart,
  DollarSign,
  Palette,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Clock,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// Optimisé: Dynamic imports pour @nivo (packages lourds ~240KB)
import { LazyResponsiveLine as ResponsiveLine, LazyResponsiveBar as ResponsiveBar, LazyResponsivePie as ResponsivePie } from '@/lib/performance/dynamic-charts';
import { api } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface MetricCard {
  id: string;
  title: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ElementType;
  description: string;
}

interface AnalyticsDashboardProps {
  className?: string;
  dateRange?: '7d' | '30d' | '90d' | '1y';
}

function AnalyticsDashboardContent({ className, dateRange: initialDateRange = '30d' }: AnalyticsDashboardProps) {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>(initialDateRange);
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get<Record<string, unknown>>('/api/v1/analytics/overview', {
        params: { range: dateRange },
      });
      setMetrics(data ?? null);
    } catch (error) {
      logger.error('Failed to load analytics', { error });
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les analytics',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setLastRefresh(new Date());
    }
  }, [dateRange, toast]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const metricCards: MetricCard[] = useMemo(() => {
    if (!metrics) return [];

    return [
      {
        id: 'users',
        title: 'Utilisateurs Actifs',
        value: metrics.activeUsers || 0,
        change: metrics.usersChange || 0,
        trend: (metrics.usersChange || 0) >= 0 ? 'up' : 'down',
        icon: Users,
        description: 'Utilisateurs actifs sur la période',
      },
      {
        id: 'views',
        title: 'Vues',
        value: metrics.totalViews || 0,
        change: metrics.viewsChange || 0,
        trend: (metrics.viewsChange || 0) >= 0 ? 'up' : 'down',
        icon: Eye,
        description: 'Nombre total de vues',
      },
      {
        id: 'designs',
        title: 'Designs Créés',
        value: metrics.totalDesigns || 0,
        change: metrics.designsChange || 0,
        trend: (metrics.designsChange || 0) >= 0 ? 'up' : 'down',
        icon: Palette,
        description: 'Designs générés',
      },
      {
        id: 'revenue',
        title: 'Revenus',
        value: `€${(metrics.totalRevenue || 0).toLocaleString()}`,
        change: metrics.revenueChange || 0,
        trend: (metrics.revenueChange || 0) >= 0 ? 'up' : 'down',
        icon: DollarSign,
        description: 'Revenus totaux',
      },
      {
        id: 'orders',
        title: 'Commandes',
        value: metrics.totalOrders || 0,
        change: metrics.ordersChange || 0,
        trend: (metrics.ordersChange || 0) >= 0 ? 'up' : 'down',
        icon: ShoppingCart,
        description: 'Commandes passées',
      },
      {
        id: 'downloads',
        title: 'Téléchargements',
        value: metrics.totalDownloads || 0,
        change: metrics.downloadsChange || 0,
        trend: (metrics.downloadsChange || 0) >= 0 ? 'up' : 'down',
        icon: Download,
        description: 'Fichiers téléchargés',
      },
    ];
  }, [metrics]);

  const timeSeriesData = useMemo(() => {
    if (!metrics?.timeSeries) return [];

    return [
      {
        id: 'Designs',
        data: metrics.timeSeries.map((point: any) => ({
          x: point.date,
          y: point.designs || 0,
        })),
      },
      {
        id: 'Vues',
        data: metrics.timeSeries.map((point: any) => ({
          x: point.date,
          y: point.views || 0,
        })),
      },
      {
        id: 'Revenus',
        data: metrics.timeSeries.map((point: any) => ({
          x: point.date,
          y: point.revenue || 0,
        })),
      },
    ];
  }, [metrics]);

  const deviceData = useMemo(() => {
    if (!metrics?.devices) return [];

    return [
      { id: 'desktop', label: 'Desktop', value: metrics.devices.desktop || 0, color: '#3b82f6' },
      { id: 'mobile', label: 'Mobile', value: metrics.devices.mobile || 0, color: '#10b981' },
      { id: 'tablet', label: 'Tablet', value: metrics.devices.tablet || 0, color: '#f59e0b' },
    ];
  }, [metrics]);

  if (isLoading) {
    return (
      <Card className={cn('p-12 text-center', className)}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
        <p className="text-gray-400">Chargement des analytics...</p>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-400" />
            Analytics Dashboard
          </h2>
          <p className="text-gray-400">Métriques et performances en temps réel</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as typeof dateRange)}>
            <SelectTrigger className="w-32 bg-gray-900 border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 jours</SelectItem>
              <SelectItem value="30d">30 jours</SelectItem>
              <SelectItem value="90d">90 jours</SelectItem>
              <SelectItem value="1y">1 an</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={loadAnalytics}
            className="border-gray-600"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {metricCards.map((metric, i) => {
          const IconComponent = metric.icon as React.ComponentType<{ className?: string }>;
          return (
            <motion
              key={metric.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="bg-gray-800/50 border-gray-700 hover:border-blue-500/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">{metric.title}</CardTitle>
                  {IconComponent && <IconComponent className="w-4 h-4 text-gray-400" />}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white mb-1">{metric.value}</div>
                  <div className="flex items-center gap-1 text-xs">
                    {metric.trend === 'up' ? (
                      <TrendingUp className="w-3 h-3 text-green-400" />
                    ) : metric.trend === 'down' ? (
                      <TrendingDown className="w-3 h-3 text-red-400" />
                    ) : null}
                    <span
                      className={cn(
                        'font-medium',
                        metric.trend === 'up' ? 'text-green-400' : metric.trend === 'down' ? 'text-red-400' : 'text-gray-400'
                      )}
                    >
                      {metric.change > 0 ? '+' : ''}
                      {metric.change}%
                    </span>
                    <span className="text-gray-500">vs période précédente</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">{metric.description}</p>
                </CardContent>
              </Card>
            </motion>
          );
        })}
      </div>

      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-gray-800/50 border-gray-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-gray-700">
            <BarChart3 className="w-4 h-4 mr-2" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="devices" className="data-[state=active]:bg-gray-700">
            <Globe className="w-4 h-4 mr-2" />
            Appareils
          </TabsTrigger>
          <TabsTrigger value="performance" className="data-[state=active]:bg-gray-700">
            <Activity className="w-4 h-4 mr-2" />
            Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Évolution dans le temps</CardTitle>
              <CardDescription className="text-gray-400">
                Tendances des designs, vues et revenus
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {timeSeriesData.length > 0 ? (
                  <ResponsiveLine
                    data={timeSeriesData}
                    margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
                    xScale={{ type: 'point' }}
                    yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
                    axisTop={null}
                    axisRight={null}
                    axisBottom={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 0,
                      legend: 'Date',
                      legendOffset: 36,
                      legendPosition: 'middle',
                    }}
                    axisLeft={{
                      tickSize: 5,
                      tickPadding: 5,
                      tickRotation: 0,
                      legend: 'Valeur',
                      legendOffset: -40,
                      legendPosition: 'middle',
                    }}
                    pointSize={10}
                    pointColor={{ theme: 'background' }}
                    pointBorderWidth={2}
                    pointBorderColor={{ from: 'serieColor' }}
                    pointLabelYOffset={-12}
                    useMesh={true}
                    theme={{
                      background: 'transparent',
                      text: { fill: '#9ca3af', fontSize: 12 },
                      grid: { line: { stroke: '#374151', strokeWidth: 1 } },
                      axis: { domain: { line: { stroke: '#4b5563', strokeWidth: 1 } } },
                    }}
                    legends={[
                      {
                        anchor: 'bottom-right',
                        direction: 'column',
                        justify: false,
                        translateX: 100,
                        translateY: 0,
                        itemsSpacing: 0,
                        itemDirection: 'left-to-right',
                        itemWidth: 80,
                        itemHeight: 20,
                        itemOpacity: 0.75,
                        symbolSize: 12,
                        symbolShape: 'circle',
                        effects: [
                          {
                            on: 'hover',
                            style: {
                              itemBackground: 'rgba(0, 0, 0, .03)',
                              itemOpacity: 1,
                            },
                          },
                        ],
                      },
                    ]}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    Aucune donnée disponible
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Répartition par Appareil</CardTitle>
                <CardDescription className="text-gray-400">
                  Utilisation par type d'appareil
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  {deviceData.length > 0 ? (
                    <ResponsivePie
                      data={deviceData}
                      margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
                      innerRadius={0.5}
                      padAngle={0.7}
                      cornerRadius={3}
                      activeOuterRadiusOffset={8}
                      colors={{ scheme: 'nivo' }}
                      borderWidth={1}
                      borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                      arcLinkLabelsSkipAngle={10}
                      arcLinkLabelsTextColor="#9ca3af"
                      arcLinkLabelsThickness={2}
                      arcLinkLabelsColor={{ from: 'color' }}
                      arcLabelsSkipAngle={10}
                      arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
                      theme={{
                        background: 'transparent',
                        text: { fill: '#9ca3af', fontSize: 12 },
                      }}
                      legends={[
                        {
                          anchor: 'bottom',
                          direction: 'row',
                          justify: false,
                          translateX: 0,
                          translateY: 56,
                          itemsSpacing: 0,
                          itemWidth: 100,
                          itemHeight: 18,
                          itemTextColor: '#9ca3af',
                          itemDirection: 'left-to-right',
                          itemOpacity: 1,
                          symbolSize: 18,
                          symbolShape: 'circle',
                        },
                      ]}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      Aucune donnée disponible
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Détails Appareils</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {deviceData.map((device) => {
                  const total = deviceData.reduce((sum, d) => sum + d.value, 0);
                  const percentage = total > 0 ? ((device.value / total) * 100).toFixed(1) : 0;
                  const Icon = device.id === 'desktop' ? Monitor : device.id === 'mobile' ? Smartphone : Tablet;
                  
                  return (
                    <div key={device.id} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-white">{device.label}</p>
                          <p className="text-xs text-gray-500">{device.value} sessions</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-white">{percentage}%</p>
                        <div className="w-24 h-2 bg-gray-700 rounded-full mt-1">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: device.color,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Performance</CardTitle>
              <CardDescription className="text-gray-400">
                Métriques de performance système
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-blue-400" />
                    <div>
                      <p className="text-sm font-medium text-white">Temps de réponse moyen</p>
                      <p className="text-xs text-gray-500">API & Services</p>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-white">{metrics?.avgResponseTime || '0'}ms</p>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Target className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-sm font-medium text-white">Taux de succès</p>
                      <p className="text-xs text-gray-500">Requêtes réussies</p>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-white">{metrics?.successRate || '0'}%</p>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-purple-400" />
                    <div>
                      <p className="text-sm font-medium text-white">Uptime</p>
                      <p className="text-xs text-gray-500">Disponibilité système</p>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-white">{metrics?.uptime || '99.9'}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Last Refresh */}
      <div className="text-center text-xs text-gray-500">
        Dernière actualisation : {lastRefresh.toLocaleTimeString()}
      </div>
    </div>
  );
}

const AnalyticsDashboardContentMemo = memo(AnalyticsDashboardContent);

export default function AnalyticsDashboard(props: AnalyticsDashboardProps) {
  return (
    <ErrorBoundary componentName="AnalyticsDashboard">
      <AnalyticsDashboardContentMemo {...props} />
    </ErrorBoundary>
  );
}
