'use client';

import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  stage?: string;
  pipelineId?: string;
  createdAt: string;
}

interface RecentAlertsProps {
  alerts: Alert[];
}

const TYPE_CONFIG = {
  error: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950' },
  warning: { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-950' },
  info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950' },
};

export function RecentAlerts({ alerts }: RecentAlertsProps) {
  if (alerts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Aucune alerte</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => {
        const config = TYPE_CONFIG[alert.type] ?? TYPE_CONFIG.info;
        const Icon = config.icon;

        return (
          <div key={alert.id} className={`flex items-start gap-3 p-3 rounded ${config.bg}`}>
            <Icon className={`h-4 w-4 mt-0.5 ${config.color}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{alert.message}</p>
              <div className="flex items-center gap-2 mt-1">
                {alert.stage && (
                  <span className="text-xs text-muted-foreground">{alert.stage}</span>
                )}
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true, locale: fr })}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
