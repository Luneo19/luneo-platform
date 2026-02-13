'use client';

import React, { useState } from 'react';
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  TrendingUp,
  Server,
  MailCheck,
  Shield,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAdminNotifications } from '@/hooks/admin/use-notifications';

function typeIcon(type: string) {
  switch (type) {
    case 'CHURN_ALERT':
      return <AlertTriangle className="h-5 w-5 text-red-500" />;
    case 'UPSELL_OPPORTUNITY':
      return <TrendingUp className="h-5 w-5 text-emerald-500" />;
    case 'SYSTEM':
      return <Server className="h-5 w-5 text-blue-500" />;
    case 'CAMPAIGN_COMPLETE':
      return <MailCheck className="h-5 w-5 text-violet-500" />;
    case 'SECURITY':
      return <Shield className="h-5 w-5 text-amber-500" />;
    default:
      return <Bell className="h-5 w-5 text-zinc-400" />;
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Il y a ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `Il y a ${diffDays} j`;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    isLoading,
    isError,
    error,
    markAsRead,
    markAllAsRead,
  } = useAdminNotifications();
  const [tab, setTab] = useState<string>('all');

  const filteredByTab = (tabValue: string) => {
    if (tabValue === 'all') return notifications;
    if (tabValue === 'unread') return notifications.filter((n) => !n.read);
    if (tabValue === 'critical') return notifications.filter((n) => n.type === 'CHURN_ALERT' || n.type === 'SECURITY');
    if (tabValue === 'info') return notifications.filter((n) => n.type === 'SYSTEM' || n.type === 'CAMPAIGN_COMPLETE' || n.type === 'UPSELL_OPPORTUNITY');
    return notifications;
  };

  const handleMarkRead = async (id: string) => {
    await markAsRead(id);
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-zinc-800 border border-zinc-700 relative">
            <Bell className="h-8 w-8 text-amber-400" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Notifications Admin</h1>
            <p className="text-zinc-400 text-sm">Alertes et événements plateforme</p>
          </div>
        </div>
        <Button
          variant="outline"
          className="border-zinc-600 text-zinc-200 hover:bg-zinc-800"
          onClick={() => markAllAsRead()}
          disabled={unreadCount === 0}
        >
          <CheckCheck className="h-4 w-4 mr-2" />
          Tout marquer lu
        </Button>
      </div>

      {isError && (
        <Card className="bg-zinc-800/80 border-zinc-600">
          <CardContent className="py-4 text-zinc-400">
            No data available. Notifications API is not available. Showing empty state.
          </CardContent>
        </Card>
      )}

      <Card className="bg-zinc-800/80 border-zinc-700">
        <CardHeader className="pb-2">
          <CardTitle className="text-zinc-100 text-base">Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="bg-zinc-700 border border-zinc-600">
              <TabsTrigger value="all" className="data-[state=active]:bg-zinc-600 text-zinc-200">
                Toutes
              </TabsTrigger>
              <TabsTrigger value="unread" className="data-[state=active]:bg-zinc-600 text-zinc-200">
                Non lues
              </TabsTrigger>
              <TabsTrigger value="critical" className="data-[state=active]:bg-zinc-600 text-zinc-200">
                Critiques
              </TabsTrigger>
              <TabsTrigger value="info" className="data-[state=active]:bg-zinc-600 text-zinc-200">
                Info
              </TabsTrigger>
            </TabsList>
            {(['all', 'unread', 'critical', 'info'] as const).map((tabValue) => (
              <TabsContent key={tabValue} value={tabValue} className="mt-4">
                {isLoading ? (
                  <div className="py-12 text-center text-zinc-400">Chargement…</div>
                ) : filteredByTab(tabValue).length === 0 ? (
                  <div className="py-12 text-center text-zinc-500">
                    {isError ? 'No data available.' : 'Aucune notification.'}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredByTab(tabValue).map((n) => (
                      <div
                        key={n.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => !n.read && handleMarkRead(n.id)}
                        onKeyDown={(e) => e.key === 'Enter' && !n.read && handleMarkRead(n.id)}
                        className={`flex gap-4 p-4 rounded-lg border transition-colors ${
                          n.read ? 'bg-zinc-800/50 border-zinc-700' : 'bg-zinc-700/50 border-zinc-600 hover:bg-zinc-700'
                        }`}
                      >
                        <div className="flex-shrink-0 mt-0.5">{typeIcon(n.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`font-medium ${n.read ? 'text-zinc-400' : 'text-zinc-100'}`}>
                              {n.title}
                            </p>
                            {!n.read && (
                              <span className="flex-shrink-0 w-2 h-2 rounded-full bg-amber-400" title="Non lu" />
                            )}
                          </div>
                          <p className="text-sm text-zinc-500 mt-1">{n.message}</p>
                          <p className="text-xs text-zinc-600 mt-2">{formatDate(n.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
