'use client';

import React from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MessageSquare, Loader2, Percent, Users, Zap, Mail } from 'lucide-react';
import { endpoints } from '@/lib/api/client';
import { ErrorBoundary } from '@/components/ErrorBoundary';

type PendingItem = {
  id: string;
  actionType: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
};

type Campaign = {
  id: string;
  name: string;
  status: string;
  createdAt: string;
};

type HermesDashboard = {
  pending: PendingItem[];
  campaigns: Campaign[];
  stats: {
    activeUsers: number;
    totalUsers: number;
    engagementRate: number;
    actionsThisMonth: number;
  };
};

function HermesPageContent() {
  const { data, error, isLoading, mutate } = useSWR<HermesDashboard>(
    'orion-hermes-dashboard',
    async () => {
      const res = await endpoints.orion.hermes.dashboard();
      return res.data as HermesDashboard;
    },
    { refreshInterval: 30000 }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-zinc-900">
        <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/orion/agents">
            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white" aria-label="Retour à la liste des agents">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <Card className="bg-zinc-800/80 border-zinc-600">
          <CardContent className="p-6 text-center">
            <p className="text-red-400 mb-4">Impossible de charger le tableau de bord Hermes.</p>
            <Button variant="outline" onClick={() => mutate()} className="border-zinc-600 text-zinc-200">
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const dashboard = data ?? ({} as HermesDashboard);
  const pending = dashboard.pending ?? [];
  const campaigns = dashboard.campaigns ?? [];
  const stats = dashboard.stats ?? {
    activeUsers: 0,
    totalUsers: 0,
    engagementRate: 0,
    actionsThisMonth: 0,
  };

  return (
    <div className="space-y-6 bg-zinc-900 min-h-screen p-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/orion/agents">
          <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white" aria-label="Retour à la liste des agents">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="h-8 w-8 text-cyan-400" />
            HERMES
          </h1>
          <p className="mt-1 text-zinc-400">Communication Master</p>
        </div>
      </div>

      {/* Taux d'engagement (gros %) */}
      <Card className="bg-zinc-800/80 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-zinc-300 flex items-center gap-2">
            <Percent className="h-5 w-5" /> Taux d'engagement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-white tabular-nums">
              {typeof stats.engagementRate === 'number' ? stats.engagementRate.toFixed(1) : '0'}
            </span>
            <span className="text-2xl text-zinc-500">%</span>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-zinc-800/80 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
              <Users className="h-4 w-4" /> Utilisateurs actifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{stats.activeUsers ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-800/80 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
              <Zap className="h-4 w-4" /> Actions ce mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{stats.actionsThisMonth ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-800/80 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
              <Users className="h-4 w-4" /> Total utilisateurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{stats.totalUsers ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Communications en attente */}
      <Card className="bg-zinc-800/80 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Mail className="h-5 w-5" /> Communications en attente
          </CardTitle>
          <p className="text-sm text-zinc-400">Actions à traiter</p>
        </CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <p className="text-zinc-500 text-sm">Aucune communication en attente.</p>
          ) : (
            <ul className="space-y-3">
              {pending.map((p) => (
                <li
                  key={p.id}
                  className="flex items-start justify-between gap-4 py-3 border-b border-zinc-700/50 last:border-0"
                >
                  <div>
                    <p className="font-medium text-zinc-200">{p.title ?? '—'}</p>
                    {p.description && (
                      <p className="text-sm text-zinc-500 mt-0.5">{p.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="bg-zinc-700 text-zinc-300 text-xs">
                        {p.actionType ?? '—'}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className={
                          p.status?.toLowerCase() === 'pending'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-zinc-700 text-zinc-400'
                        }
                      >
                        {p.status ?? '—'}
                      </Badge>
                    </div>
                  </div>
                  <span className="text-zinc-500 text-xs whitespace-nowrap">
                    {p.createdAt ? new Date(p.createdAt).toLocaleString('fr-FR') : '—'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Campagnes récentes */}
      <Card className="bg-zinc-800/80 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-white">Campagnes récentes</CardTitle>
          <p className="text-sm text-zinc-400">Dernières campagnes de communication</p>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <p className="text-zinc-500 text-sm">Aucune campagne.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" aria-label="Campagnes récentes">
                <thead>
                  <tr className="border-b border-zinc-700 text-zinc-400 text-left">
                    <th className="pb-2 pr-4">Nom</th>
                    <th className="pb-2 pr-4">Statut</th>
                    <th className="pb-2 pr-4">Créée le</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => (
                    <tr key={c.id} className="border-b border-zinc-700/50">
                      <td className="py-3 pr-4 text-zinc-300">{c.name ?? '—'}</td>
                      <td className="py-3 pr-4">
                        <Badge
                          variant="secondary"
                          className={
                            c.status?.toLowerCase() === 'active'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-zinc-700 text-zinc-400'
                          }
                        >
                          {c.status ?? '—'}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 text-zinc-500 text-xs">
                        {c.createdAt ? new Date(c.createdAt).toLocaleString('fr-FR') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function OrionHermesPage() {
  return (
    <ErrorBoundary level="page" componentName="OrionHermesPage">
      <HermesPageContent />
    </ErrorBoundary>
  );
}
