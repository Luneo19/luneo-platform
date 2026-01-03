/**
 * Monitoring Overview Component
 * Displays overview of system health, services, and key metrics
 * 
 * CURSOR RULES COMPLIANT:
 * - Server Component compatible (no client-side only features)
 * - < 300 lines
 * - Types explicit
 */

import { CheckCircle, AlertTriangle, XCircle, Server, Database, Zap, Mail, CreditCard } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { DashboardMetrics, ServiceHealth, Alert } from '@/lib/monitoring/types';
import { cn } from '@/lib/utils';

interface MonitoringOverviewProps {
  metrics: DashboardMetrics | null;
  services: ServiceHealth[];
  alerts: Alert[];
}

const SERVICE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  database: Database,
  cache: Zap,
  storage: Server,
  email: Mail,
  payments: CreditCard,
};

function getStatusIcon(status: string) {
  switch (status) {
    case 'healthy':
      return CheckCircle;
    case 'degraded':
      return AlertTriangle;
    case 'unhealthy':
      return XCircle;
    default:
      return AlertTriangle;
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'healthy':
      return 'text-green-400';
    case 'degraded':
      return 'text-yellow-400';
    case 'unhealthy':
      return 'text-red-400';
    default:
      return 'text-gray-400';
  }
}

export function MonitoringOverview({ metrics, services, alerts }: MonitoringOverviewProps) {
  const recentAlerts = alerts
    .filter(a => !a.acknowledged)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Services Status */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            État des services
          </CardTitle>
          <CardDescription>Monitoring des services critiques</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {services.length === 0 ? (
              <p className="text-slate-400 text-center py-8">Aucun service à surveiller</p>
            ) : (
              services.map((service) => {
                const IconComponent = SERVICE_ICONS[service.name] || Server;
                const StatusIcon = getStatusIcon(service.status);

                return (
                  <div
                    key={service.name}
                    className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-slate-700">
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium capitalize">{service.name}</p>
                        {service.message && (
                          <p className="text-sm text-slate-400">{service.message}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {service.latency !== undefined && (
                        <span className="text-sm text-slate-400">{service.latency}ms</span>
                      )}
                      <div className={cn('flex items-center gap-2', getStatusColor(service.status))}>
                        <StatusIcon className="w-5 h-5" />
                        <span className="capitalize">{service.status}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Alerts */}
      {recentAlerts.length > 0 && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Alertes récentes
            </CardTitle>
            <CardDescription>Dernières alertes non acquittées</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    'p-4 rounded-lg border',
                    alert.severity === 'critical'
                      ? 'bg-red-900/20 border-red-500/50'
                      : alert.severity === 'warning'
                      ? 'bg-yellow-900/20 border-yellow-500/50'
                      : 'bg-blue-900/20 border-blue-500/50'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant="outline"
                          className={cn(
                            alert.severity === 'critical'
                              ? 'border-red-500 text-red-400'
                              : alert.severity === 'warning'
                              ? 'border-yellow-500 text-yellow-400'
                              : 'border-blue-500 text-blue-400'
                          )}
                        >
                          {alert.severity}
                        </Badge>
                        <span className="font-semibold text-white">{alert.title}</span>
                      </div>
                      <p className="text-sm text-slate-300">{alert.message}</p>
                      <p className="text-xs text-slate-500 mt-2">
                        {new Date(alert.timestamp).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics Summary */}
      {metrics && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle>Résumé des métriques (24h)</CardTitle>
            <CardDescription>Statistiques agrégées sur les dernières 24 heures</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <p className="text-sm text-slate-400 mb-1">Requêtes totales</p>
                <p className="text-2xl font-bold">{metrics.totalRequests24h.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <p className="text-sm text-slate-400 mb-1">Erreurs totales</p>
                <p className="text-2xl font-bold text-red-400">{metrics.totalErrors24h.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <p className="text-sm text-slate-400 mb-1">Visiteurs uniques</p>
                <p className="text-2xl font-bold">{metrics.uniqueVisitors24h.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

