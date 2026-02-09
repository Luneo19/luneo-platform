'use client';

import React, { useState, useEffect } from 'react';
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
import { endpoints } from '@/lib/api/client';

type NotifType = 'CHURN_ALERT' | 'UPSELL_OPPORTUNITY' | 'SYSTEM' | 'CAMPAIGN_COMPLETE' | 'SECURITY';

const MOCK_NOTIFICATIONS = [
  { id: 'n1', type: 'CHURN_ALERT' as NotifType, title: 'Risque de churn élevé', message: 'Segment "At-risk" : 12 comptes avec score < 40. Voir le Health Dashboard.', createdAt: '2025-02-09T10:00:00Z', read: false },
  { id: 'n2', type: 'UPSELL_OPPORTUNITY' as NotifType, title: 'Opportunité upsell', message: '5 marques sur le plan Starter dépassent les limites. Proposition Pro envoyée.', createdAt: '2025-02-09T09:30:00Z', read: false },
  { id: 'n3', type: 'SYSTEM' as NotifType, title: 'Mise à jour déploiement', message: 'Backend v2.4.1 déployé avec succès. Aucune interruption.', createdAt: '2025-02-09T08:00:00Z', read: true },
  { id: 'n4', type: 'CAMPAIGN_COMPLETE' as NotifType, title: 'Campagne terminée', message: 'Campagne "Welcome Q1" : 1 200 emails envoyés, taux d\'ouverture 42%.', createdAt: '2025-02-08T18:00:00Z', read: true },
  { id: 'n5', type: 'SECURITY' as NotifType, title: 'Connexion depuis nouvel IP', message: 'Un admin s\'est connecté depuis une nouvelle adresse IP. Vérification recommandée.', createdAt: '2025-02-08T14:20:00Z', read: false },
  { id: 'n6', type: 'CHURN_ALERT' as NotifType, title: 'Score santé en baisse', message: '3 comptes sont passés en CRITICAL cette semaine.', createdAt: '2025-02-08T11:00:00Z', read: true },
  { id: 'n7', type: 'UPSELL_OPPORTUNITY' as NotifType, title: 'Proposition Pro acceptée', message: 'Marque "Acme Corp" a upgradé vers le plan Pro.', createdAt: '2025-02-07T16:00:00Z', read: true },
  { id: 'n8', type: 'SYSTEM' as NotifType, title: 'Sauvegarde quotidienne', message: 'Sauvegarde DB complétée. Taille : 2.4 Go.', createdAt: '2025-02-07T03:00:00Z', read: true },
  { id: 'n9', type: 'CAMPAIGN_COMPLETE' as NotifType, title: 'Campagne annulée', message: 'Campagne "Test" a été annulée par l\'utilisateur.', createdAt: '2025-02-06T17:30:00Z', read: true },
  { id: 'n10', type: 'SECURITY' as NotifType, title: 'Tentative de connexion échouée', message: '5 tentatives échouées sur le compte admin@luneo.app. Blocage temporaire activé.', createdAt: '2025-02-06T12:00:00Z', read: false },
  { id: 'n11', type: 'CHURN_ALERT' as NotifType, title: 'Rappel segment at-risk', message: 'Segment "Churn risk" mis à jour : 8 nouveaux comptes.', createdAt: '2025-02-05T10:00:00Z', read: true },
  { id: 'n12', type: 'UPSELL_OPPORTUNITY' as NotifType, title: 'Limite atteinte', message: 'Marque "Studio X" a atteint 90% de sa limite designs. Suggérer upgrade.', createdAt: '2025-02-05T09:00:00Z', read: false },
];

function typeIcon(type: NotifType) {
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
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [tab, setTab] = useState<string>('all');
  const [unreadCount, setUnreadCount] = useState(4);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    endpoints.orion
      .notificationCount()
      .then((data) => setUnreadCount(data.count))
      .catch(() => {});
  }, []);

  const markRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    endpoints.orion.markNotificationRead(id).catch(() => {});
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    endpoints.orion.markAllNotificationsRead().catch(() => {});
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
          onClick={markAllRead}
          disabled={unreadCount === 0}
        >
          <CheckCheck className="h-4 w-4 mr-2" />
          Tout marquer lu
        </Button>
      </div>

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
                <div className="space-y-2">
                  {notifications
                    .filter((n) => {
                      if (tabValue === 'all') return true;
                      if (tabValue === 'unread') return !n.read;
                      if (tabValue === 'critical') return n.type === 'CHURN_ALERT' || n.type === 'SECURITY';
                      if (tabValue === 'info') return n.type === 'SYSTEM' || n.type === 'CAMPAIGN_COMPLETE' || n.type === 'UPSELL_OPPORTUNITY';
                      return true;
                    })
                    .map((n) => (
                  <div
                    key={n.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => !n.read && markRead(n.id)}
                    onKeyDown={(e) => e.key === 'Enter' && !n.read && markRead(n.id)}
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
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
