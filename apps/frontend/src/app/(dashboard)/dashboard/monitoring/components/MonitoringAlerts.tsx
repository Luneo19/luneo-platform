/**
 * Monitoring Alerts Component
 * Displays and manages system alerts
 * 
 * CURSOR RULES COMPLIANT:
 * - Server Component compatible (can be enhanced with client interactions)
 * - < 300 lines
 * - Types explicit
 */

import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Alert } from '@/lib/monitoring/types';
import { cn } from '@/lib/utils';

interface MonitoringAlertsProps {
  alerts: Alert[];
  onRefresh?: () => void;
}

function getSeverityIcon(severity: Alert['severity']) {
  switch (severity) {
    case 'critical':
      return AlertTriangle;
    case 'warning':
      return AlertTriangle;
    case 'info':
      return Info;
    default:
      return Info;
  }
}

function getSeverityColor(severity: Alert['severity']): string {
  switch (severity) {
    case 'critical':
      return 'bg-red-900/20 border-red-500/50 text-red-400';
    case 'warning':
      return 'bg-yellow-900/20 border-yellow-500/50 text-yellow-400';
    case 'info':
      return 'bg-blue-900/20 border-blue-500/50 text-blue-400';
    default:
      return 'bg-gray-900/20 border-gray-500/50 text-gray-400';
  }
}

export function MonitoringAlerts({ alerts, onRefresh }: MonitoringAlertsProps) {
  const sortedAlerts = [...alerts].sort((a, b) => {
    // Critical first, then by timestamp
    if (a.severity === 'critical' && b.severity !== 'critical') return -1;
    if (b.severity === 'critical' && a.severity !== 'critical') return 1;
    return b.timestamp - a.timestamp;
  });

  const criticalAlerts = sortedAlerts.filter(a => a.severity === 'critical');
  const warningAlerts = sortedAlerts.filter(a => a.severity === 'warning');
  const infoAlerts = sortedAlerts.filter(a => a.severity === 'info');

  if (alerts.length === 0) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <p className="text-slate-300 text-lg font-semibold mb-2">Aucune alerte</p>
          <p className="text-slate-400">Tous les systèmes fonctionnent normalement</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-5 h-5" />
              Alertes critiques ({criticalAlerts.length})
            </CardTitle>
            <CardDescription>Action requise immédiatement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {criticalAlerts.map((alert) => {
                const Icon = getSeverityIcon(alert.severity);
                return (
                  <div
                    key={alert.id}
                    className={cn('p-4 rounded-lg border', getSeverityColor(alert.severity))}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className="w-5 h-5" />
                          <span className="font-semibold">{alert.title}</span>
                          {alert.acknowledged && (
                            <Badge variant="outline" className="text-xs">
                              Acquittée
                            </Badge>
                          )}
                          {alert.resolvedAt && (
                            <Badge variant="outline" className="text-xs bg-green-500/20">
                              Résolue
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-300 mb-2">{alert.message}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>Source: {alert.source}</span>
                          <span>{new Date(alert.timestamp).toLocaleString('fr-FR')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warning Alerts */}
      {warningAlerts.length > 0 && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-400">
              <AlertTriangle className="w-5 h-5" />
              Alertes d'avertissement ({warningAlerts.length})
            </CardTitle>
            <CardDescription>Surveillance recommandée</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {warningAlerts.map((alert) => {
                const Icon = getSeverityIcon(alert.severity);
                return (
                  <div
                    key={alert.id}
                    className={cn('p-4 rounded-lg border', getSeverityColor(alert.severity))}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className="w-5 h-5" />
                          <span className="font-semibold">{alert.title}</span>
                          {alert.acknowledged && (
                            <Badge variant="outline" className="text-xs">
                              Acquittée
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-300 mb-2">{alert.message}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>Source: {alert.source}</span>
                          <span>{new Date(alert.timestamp).toLocaleString('fr-FR')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Alerts */}
      {infoAlerts.length > 0 && (
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-400">
              <Info className="w-5 h-5" />
              Alertes informatives ({infoAlerts.length})
            </CardTitle>
            <CardDescription>Informations générales</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {infoAlerts.map((alert) => {
                const Icon = getSeverityIcon(alert.severity);
                return (
                  <div
                    key={alert.id}
                    className={cn('p-4 rounded-lg border', getSeverityColor(alert.severity))}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className="w-5 h-5" />
                          <span className="font-semibold">{alert.title}</span>
                        </div>
                        <p className="text-sm text-slate-300 mb-2">{alert.message}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span>Source: {alert.source}</span>
                          <span>{new Date(alert.timestamp).toLocaleString('fr-FR')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}





