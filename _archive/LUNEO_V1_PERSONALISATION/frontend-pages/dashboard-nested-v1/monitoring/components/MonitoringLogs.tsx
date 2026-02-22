/**
 * Monitoring Logs Component
 * Displays system logs (placeholder - can be enhanced with real log fetching)
 * 
 * CURSOR RULES COMPLIANT:
 * - Server Component compatible
 * - < 300 lines
 * - Types explicit
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';

export function MonitoringLogs() {
  // Placeholder - in production, this would fetch logs from API
  const sampleLogs: Array<{
    id: string;
    level: 'debug' | 'info' | 'warn' | 'error';
    message: string;
    timestamp: number;
    source: string;
  }> = [];

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <FileText className="w-5 h-5" />
          Logs système
        </CardTitle>
        <CardDescription className="text-gray-600">Journal des événements système</CardDescription>
      </CardHeader>
      <CardContent>
        {sampleLogs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-2">Aucun log disponible</p>
            <p className="text-sm text-gray-500">
              Les logs seront affichés ici une fois la collecte activée
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sampleLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 bg-gray-50 rounded-lg font-mono text-sm"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    variant="outline"
                    className={
                      log.level === 'error'
                        ? 'border-red-500 text-red-400'
                        : log.level === 'warn'
                        ? 'border-yellow-500 text-yellow-400'
                        : log.level === 'info'
                        ? 'border-blue-500 text-blue-400'
                        : 'border-gray-300 text-gray-600'
                    }
                  >
                    {log.level.toUpperCase()}
                  </Badge>
                  <span className="text-gray-600">{log.source}</span>
                  <span className="text-gray-500 text-xs">
                    {new Date(log.timestamp).toLocaleString('fr-FR')}
                  </span>
                </div>
                <p className="text-gray-700">{log.message}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}






