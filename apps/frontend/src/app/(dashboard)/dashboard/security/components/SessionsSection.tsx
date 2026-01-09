/**
 * Section de gestion des sessions
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Monitor, Smartphone, Tablet, LogOut, Trash2 } from 'lucide-react';
import { formatRelativeDate } from '@/lib/utils/formatters';
import { useSessions } from '../hooks/useSessions';
import type { SecuritySession } from '../types';

export function SessionsSection() {
  const { sessions, isLoading, revokeSession, revokeAllSessions } = useSessions();

  const getDeviceIcon = (deviceType?: string) => {
    switch (deviceType) {
      case 'desktop':
        return Monitor;
      case 'mobile':
        return Smartphone;
      case 'tablet':
        return Tablet;
      default:
        return Monitor;
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Sessions actives</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">Sessions actives</CardTitle>
            <CardDescription className="text-gray-400 mt-1">
              Gérez les appareils connectés à votre compte
            </CardDescription>
          </div>
          {sessions.length > 1 && (
            <Button
              variant="outline"
              onClick={() => revokeAllSessions()}
              className="border-red-500/50 text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Révoquer toutes
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <p className="text-gray-400">Aucune session active</p>
        ) : (
          <div className="space-y-3">
            {sessions.map((session: SecuritySession) => {
              const DeviceIcon = getDeviceIcon(session.deviceType);
              return (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-cyan-500/10 rounded-lg">
                      <DeviceIcon className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-white font-medium">
                          {session.device || 'Appareil inconnu'}
                        </p>
                        {session.isCurrent && (
                          <Badge variant="outline" className="border-green-500/50 text-green-400">
                            Session actuelle
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">
                        {session.browser || 'Unknown'} • {session.os || 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {session.ipAddress && `${session.ipAddress} • `}
                        {session.lastActive && `Dernière activité ${formatRelativeDate(session.lastActive.toISOString())}`}
                      </p>
                    </div>
                  </div>
                  {!session.isCurrent && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => revokeSession(session.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <LogOut className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}



