'use client';

/**
 * Monitoring Dashboard Client Component
 * Handles client-side interactions (tabs, refresh, alerts)
 * 
 * CURSOR RULES COMPLIANT:
 * - Client Component minimal (only for interactions)
 * - < 300 lines
 * - Types explicit
 */

import { useState, useCallback } from 'react';
import { api } from '@/lib/api/client';
import { Activity, AlertTriangle, RefreshCw, Server, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MonitoringOverview } from './MonitoringOverview';
import { MonitoringMetrics } from './MonitoringMetrics';
import { MonitoringAlerts } from './MonitoringAlerts';
import { MonitoringLogs } from './MonitoringLogs';
import { MonitoringSystem } from './MonitoringSystem';
import type { DashboardMetrics, Alert, ServiceHealth } from '@/lib/monitoring/types';
import { cn } from '@/lib/utils';

interface MonitoringDashboardClientProps {
  initialMetrics: DashboardMetrics | null;
  initialAlerts: Alert[];
  initialServices: ServiceHealth[];
  initialError: string | null;
  initialTab?: string;
}

type MonitoringTab = 'overview' | 'metrics' | 'logs' | 'alerts' | 'system';

export function MonitoringDashboardClient({
  initialMetrics,
  initialAlerts,
  initialServices,
  initialError,
  initialTab = 'overview',
}: MonitoringDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<MonitoringTab>(initialTab as MonitoringTab);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(initialMetrics);
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);
  const [services, setServices] = useState<ServiceHealth[]>(initialServices);
  const [error, setError] = useState<string | null>(initialError);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);

    try {
      const data = await api.get<{ success?: boolean; error?: string; data?: { metrics?: DashboardMetrics; alerts?: Alert[]; services?: ServiceHealth[] } }>('/api/v1/monitoring/dashboard');

      if (data && (data as { success?: boolean }).success === false) {
        throw new Error((data as { error?: string }).error || 'Erreur lors du rafraîchissement');
      }

      const payload = (data as { data?: { metrics?: DashboardMetrics; alerts?: Alert[]; services?: ServiceHealth[] } })?.data ?? data as { metrics?: DashboardMetrics; alerts?: Alert[]; services?: ServiceHealth[] };
      setMetrics(payload?.metrics ?? null);
      setAlerts(payload?.alerts ?? []);
      setServices(payload?.services ?? []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const getOverallHealth = (): 'healthy' | 'degraded' | 'unhealthy' => {
    if (!services.length) return 'healthy';
    
    const unhealthyCount = services.filter(s => s.status === 'unhealthy').length;
    const degradedCount = services.filter(s => s.status === 'degraded').length;

    if (unhealthyCount > 0) return 'unhealthy';
    if (degradedCount > 0) return 'degraded';
    return 'healthy';
  };

  const overallHealth = getOverallHealth();
  const criticalAlerts = alerts.filter(a => a.severity === 'critical' && !a.acknowledged);
  const warningAlerts = alerts.filter(a => a.severity === 'warning' && !a.acknowledged);

  if (error && !metrics) {
    return (
      <div className="min-h-screen bg-white text-gray-900 p-6">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="bg-white border-red-500/50 max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="w-5 h-5" />
                Erreur de chargement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">{error}</p>
              <Button onClick={handleRefresh} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Réessayer
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Activity className="w-8 h-8 text-green-400" />
            Monitoring
          </h1>
          <p className="text-gray-600 mt-1">
            Surveillance en temps réel de la plateforme
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'w-2 h-2 rounded-full',
                overallHealth === 'healthy'
                  ? 'bg-green-400 animate-pulse'
                  : overallHealth === 'degraded'
                  ? 'bg-yellow-400 animate-pulse'
                  : 'bg-red-400 animate-pulse'
              )}
            />
            <span className="text-sm text-gray-600">
              {overallHealth === 'healthy'
                ? 'Système opérationnel'
                : overallHealth === 'degraded'
                ? 'Système dégradé'
                : 'Système en panne'}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="border-gray-200"
          >
            <RefreshCw className={cn('w-4 h-4 mr-2', isRefreshing && 'animate-spin')} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Utilisateurs actifs</p>
                  <p className="text-3xl font-bold mt-1">{metrics.activeUsers}</p>
                </div>
                <div className="p-3 bg-blue-500/20 rounded-xl">
                  <Zap className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Requêtes/min</p>
                  <p className="text-3xl font-bold mt-1">{metrics.requestsPerMinute}</p>
                </div>
                <div className="p-3 bg-green-500/20 rounded-xl">
                  <Server className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Taux d'erreur</p>
                  <p className="text-3xl font-bold mt-1">{metrics.errorRate.toFixed(2)}%</p>
                </div>
                <div className="p-3 bg-red-500/20 rounded-xl">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Temps de réponse</p>
                  <p className="text-3xl font-bold mt-1">{metrics.avgResponseTime}ms</p>
                </div>
                <div className="p-3 bg-cyan-500/20 rounded-xl">
                  <Activity className="w-6 h-6 text-cyan-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alerts Banner */}
      {(criticalAlerts.length > 0 || warningAlerts.length > 0) && (
        <div className="mb-6">
          {criticalAlerts.length > 0 && (
            <Card className="bg-red-900/20 border-red-500/50 mb-2">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <span className="font-semibold text-red-400">
                    {criticalAlerts.length} alerte{criticalAlerts.length > 1 ? 's' : ''} critique{criticalAlerts.length > 1 ? 's' : ''}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
          {warningAlerts.length > 0 && (
            <Card className="bg-yellow-900/20 border-yellow-500/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  <span className="font-semibold text-yellow-400">
                    {warningAlerts.length} alerte{warningAlerts.length > 1 ? 's' : ''} d'avertissement
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as MonitoringTab)}>
        <TabsList className="bg-slate-900 border-slate-800">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="metrics">Métriques</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="alerts">Alertes</TabsTrigger>
          <TabsTrigger value="system">Système</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <MonitoringOverview metrics={metrics} services={services} alerts={alerts} />
        </TabsContent>

        <TabsContent value="metrics" className="mt-6">
          <MonitoringMetrics metrics={metrics} />
        </TabsContent>

        <TabsContent value="logs" className="mt-6">
          <MonitoringLogs />
        </TabsContent>

        <TabsContent value="alerts" className="mt-6">
          <MonitoringAlerts alerts={alerts} onRefresh={handleRefresh} />
        </TabsContent>

        <TabsContent value="system" className="mt-6">
          <MonitoringSystem services={services} metrics={metrics} />
        </TabsContent>
      </Tabs>
    </div>
  );
}






