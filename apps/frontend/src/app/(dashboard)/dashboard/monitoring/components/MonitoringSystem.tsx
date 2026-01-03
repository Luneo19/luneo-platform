/**
 * Monitoring System Component
 * Displays system-level information and health
 * 
 * CURSOR RULES COMPLIANT:
 * - Server Component compatible
 * - < 300 lines
 * - Types explicit
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Server, Database, Zap, Mail, CreditCard } from 'lucide-react';
import type { DashboardMetrics, ServiceHealth } from '@/lib/monitoring/types';
import { cn } from '@/lib/utils';

interface MonitoringSystemProps {
  services: ServiceHealth[];
  metrics: DashboardMetrics | null;
}

const SERVICE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  database: Database,
  cache: Zap,
  storage: Server,
  email: Mail,
  payments: CreditCard,
};

function getStatusColor(status: string): string {
  switch (status) {
    case 'healthy':
      return 'bg-green-500/20 text-green-400 border-green-500/50';
    case 'degraded':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
    case 'unhealthy':
      return 'bg-red-500/20 text-red-400 border-red-500/50';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
  }
}

export function MonitoringSystem({ services, metrics }: MonitoringSystemProps) {
  return (
    <div className="space-y-6">
      {/* Services Health */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle>Santé des services</CardTitle>
          <CardDescription>État détaillé de tous les services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.length === 0 ? (
              <p className="text-slate-400 col-span-2 text-center py-8">
                Aucun service configuré
              </p>
            ) : (
              services.map((service) => {
                const IconComponent = SERVICE_ICONS[service.name] || Server;
                return (
                  <Card key={service.name} className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <IconComponent className="w-5 h-5 text-cyan-400" />
                          <span className="font-semibold capitalize">{service.name}</span>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(getStatusColor(service.status))}
                        >
                          {service.status}
                        </Badge>
                      </div>
                      {service.latency !== undefined && (
                        <div className="text-sm text-slate-400">
                          Latence: <span className="text-white">{service.latency}ms</span>
                        </div>
                      )}
                      {service.message && (
                        <div className="text-sm text-slate-400 mt-2">{service.message}</div>
                      )}
                      <div className="text-xs text-slate-500 mt-2">
                        Dernière vérification: {new Date(service.lastCheck).toLocaleString('fr-FR')}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* System Metrics */}
      {metrics && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle>Métriques système</CardTitle>
            <CardDescription>Statistiques globales de la plateforme</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <p className="text-sm text-slate-400 mb-1">Utilisateurs actifs</p>
                <p className="text-2xl font-bold">{metrics.activeUsers}</p>
              </div>
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <p className="text-sm text-slate-400 mb-1">Requêtes/min</p>
                <p className="text-2xl font-bold">{metrics.requestsPerMinute}</p>
              </div>
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <p className="text-sm text-slate-400 mb-1">Taux d'erreur</p>
                <p className="text-2xl font-bold text-red-400">{metrics.errorRate.toFixed(2)}%</p>
              </div>
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <p className="text-sm text-slate-400 mb-1">Temps de réponse moyen</p>
                <p className="text-2xl font-bold">{metrics.avgResponseTime}ms</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

