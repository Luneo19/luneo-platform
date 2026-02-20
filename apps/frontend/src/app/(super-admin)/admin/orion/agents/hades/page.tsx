'use client';

import React from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Skull, Loader2, Euro, Users, AlertTriangle, RotateCcw, ListTodo } from 'lucide-react';
import { endpoints } from '@/lib/api/client';
import { ErrorBoundary } from '@/components/ErrorBoundary';

type AtRiskUser = {
  userId: string;
  email: string;
  name: string;
  brandName?: string;
  churnRiskScore: number;
  churnRisk: string;
  factors: string[];
  recommendedActions: string[];
};

type WinBack = {
  id: string;
  name: string;
  subscriptionPlan: string;
  updatedAt: string;
  users?: number;
};

type RetentionAction = {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  createdAt: string;
};

type HadesDashboard = {
  atRisk: AtRiskUser[];
  winBack: WinBack[];
  mrr: {
    mrrAtRisk: number;
    customersAtRisk: number;
    breakdown: { critical: number; high: number };
  };
  actions: RetentionAction[];
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value ?? 0);
}

function priorityBadge(priority: string): string {
  const p = priority?.toLowerCase() ?? '';
  if (p === 'critical') return 'bg-red-500/20 text-red-400 border-red-500/30';
  if (p === 'high') return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
}

function HadesPageContent() {
  const { data, error, isLoading, mutate } = useSWR<HadesDashboard>(
    'orion-hades-dashboard',
    async () => {
      const res = await endpoints.orion.hades.dashboard();
      return res.data as HadesDashboard;
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
            <p className="text-red-400 mb-4">Impossible de charger le tableau de bord Hades.</p>
            <Button variant="outline" onClick={() => mutate()} className="border-zinc-600 text-zinc-200">
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const dashboard = data ?? ({} as HadesDashboard);
  const atRisk = dashboard.atRisk ?? [];
  const winBack = dashboard.winBack ?? [];
  const actions = dashboard.actions ?? [];
  const mrr = dashboard.mrr ?? {
    mrrAtRisk: 0,
    customersAtRisk: 0,
    breakdown: { critical: 0, high: 0 },
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
            <Skull className="h-8 w-8 text-violet-400" />
            HADES
          </h1>
          <p className="mt-1 text-zinc-400">Retention Keeper</p>
        </div>
      </div>

      {/* MRR en risque (gros montant €) */}
      <Card className="bg-zinc-800/80 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-zinc-300 flex items-center gap-2">
            <Euro className="h-5 w-5" /> MRR en risque
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-white tabular-nums">
            {formatCurrency(mrr.mrrAtRisk ?? 0)}
          </div>
          <p className="text-sm text-zinc-500 mt-1">Revenus récurrents menacés par le churn</p>
        </CardContent>
      </Card>

      {/* Clients en risque + répartition */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-zinc-800/80 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
              <Users className="h-4 w-4" /> Clients en risque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{mrr.customersAtRisk ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-800/80 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Critiques</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-400">{mrr.breakdown?.critical ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-800/80 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Élevés</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-400">{mrr.breakdown?.high ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Clients à risque */}
      <Card className="bg-zinc-800/80 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" /> Clients à risque de churn
          </CardTitle>
          <p className="text-sm text-zinc-400">Facteurs de risque et actions recommandées</p>
        </CardHeader>
        <CardContent>
          {atRisk.length === 0 ? (
            <p className="text-zinc-500 text-sm">Aucun client à risque identifié.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" aria-label="Clients à risque de churn">
                <thead>
                  <tr className="border-b border-zinc-700 text-zinc-400 text-left">
                    <th className="pb-2 pr-4">Client</th>
                    <th className="pb-2 pr-4">Marque</th>
                    <th className="pb-2 pr-4">Score risque</th>
                    <th className="pb-2 pr-4">Niveau</th>
                    <th className="pb-2 pr-4">Facteurs</th>
                    <th className="pb-2 pr-4">Actions recommandées</th>
                  </tr>
                </thead>
                <tbody>
                  {atRisk.map((u) => (
                    <tr key={u.userId} className="border-b border-zinc-700/50">
                      <td className="py-3 pr-4">
                        <div>
                          <p className="text-zinc-200 font-medium">{u.name || (u.email ?? '—')}</p>
                          {u.email && <p className="text-zinc-500 text-xs">{u.email}</p>}
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-zinc-400">{u.brandName ?? '—'}</td>
                      <td className="py-3 pr-4 text-zinc-300">{u.churnRiskScore ?? '—'}</td>
                      <td className="py-3 pr-4">
                        <Badge
                          variant="secondary"
                          className={
                            (u.churnRisk ?? '').toLowerCase() === 'critical'
                              ? 'bg-red-500/20 text-red-400'
                              : (u.churnRisk ?? '').toLowerCase() === 'high'
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-zinc-700 text-zinc-400'
                          }
                        >
                          {u.churnRisk ?? '—'}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 text-zinc-400 max-w-[180px]">
                        {Array.isArray(u.factors) ? u.factors.join(', ') : '—'}
                      </td>
                      <td className="py-3 pr-4 text-zinc-400 max-w-[180px]">
                        {Array.isArray(u.recommendedActions)
                          ? u.recommendedActions.join(', ')
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Candidats win-back */}
        <Card className="bg-zinc-800/80 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <RotateCcw className="h-5 w-5" /> Candidats win-back
            </CardTitle>
            <p className="text-sm text-zinc-400">Campagnes de réactivation</p>
          </CardHeader>
          <CardContent>
            {winBack.length === 0 ? (
              <p className="text-zinc-500 text-sm">Aucun candidat win-back.</p>
            ) : (
              <ul className="space-y-2">
                {winBack.map((w) => (
                  <li
                    key={w.id}
                    className="flex items-center justify-between text-sm border-b border-zinc-700/50 pb-2"
                  >
                    <div>
                      <span className="text-zinc-300 font-medium">{w.name ?? '—'}</span>
                      <span className="text-zinc-500 ml-2">— {w.subscriptionPlan ?? '—'}</span>
                      {w.users != null && (
                        <span className="text-zinc-500 text-xs ml-2">({w.users} utilisateurs)</span>
                      )}
                    </div>
                    <span className="text-zinc-500 text-xs">
                      {w.updatedAt ? new Date(w.updatedAt).toLocaleString('fr-FR') : '—'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Actions de rétention */}
        <Card className="bg-zinc-800/80 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <ListTodo className="h-5 w-5" /> Actions de rétention
            </CardTitle>
            <p className="text-sm text-zinc-400">Tâches planifiées</p>
          </CardHeader>
          <CardContent>
            {actions.length === 0 ? (
              <p className="text-zinc-500 text-sm">Aucune action en cours.</p>
            ) : (
              <ul className="space-y-2">
                {actions.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-start justify-between gap-2 py-2 border-b border-zinc-700/50 last:border-0"
                  >
                    <div>
                      <p className="font-medium text-zinc-200">{a.title ?? '—'}</p>
                      {a.description && (
                        <p className="text-sm text-zinc-500 mt-0.5">{a.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className={priorityBadge(a.priority)}>
                          {a.priority ?? '—'}
                        </Badge>
                        <Badge variant="secondary" className="bg-zinc-700 text-zinc-400">
                          {a.status ?? '—'}
                        </Badge>
                      </div>
                    </div>
                    <span className="text-zinc-500 text-xs whitespace-nowrap">
                      {a.createdAt ? new Date(a.createdAt).toLocaleString('fr-FR') : '—'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function OrionHadesPage() {
  return (
    <ErrorBoundary level="page" componentName="OrionHadesPage">
      <HadesPageContent />
    </ErrorBoundary>
  );
}
