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
      <Card className="dash-card border-white/[0.06] bg-white/[0.03] backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white">Sessions actives</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-white/60">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="dash-card border-white/[0.06] bg-white/[0.03] backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">Sessions actives</CardTitle>
            <CardDescription className="text-white/60 mt-1">
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
          <p className="text-white/60">Aucune session active</p>
        ) : (
          <div className="space-y-3">
            {sessions.map((session: SecuritySession) => {
              const DeviceIcon = getDeviceIcon(session.deviceType);
              return (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 bg-white/[0.04] rounded-lg border border-white/[0.06]"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                      <DeviceIcon className="w-5 h-5 text-purple-400" />
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
                      <p className="text-sm text-white/60">
                        {session.browser || 'Unknown'} • {session.os || 'Unknown'}
                      </p>
                      <p className="text-xs text-white/40 mt-1">
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



