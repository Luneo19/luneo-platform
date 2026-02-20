'use client';

import React from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Eye, Loader2, Users, TrendingDown, Lightbulb, AlertTriangle } from 'lucide-react';
import { endpoints } from '@/lib/api/client';
import { ErrorBoundary } from '@/components/ErrorBoundary';

type AthenaInsight = {
  id: string;
  type: string;
  title: string;
  description: string;
  severity: string;
  createdAt: string;
};

type AthenaAtRisk = {
  userId: string;
  healthScore: number;
  churnRisk: string;
  engagementScore: number;
  user: {
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    brand?: { name: string | null };
  };
};

type AthenaDistribution = {
  distribution?: { healthy?: number; atRisk?: number; critical?: number };
  churnDistribution?: { LOW?: number; MEDIUM?: number; HIGH?: number; CRITICAL?: number };
  total?: number;
};

type AthenaDashboard = {
  distribution: AthenaDistribution & {
    distribution: { healthy: number; atRisk: number; critical: number };
    churnDistribution: { LOW: number; MEDIUM: number; HIGH: number; CRITICAL: number };
    total: number;
  };
  recentInsights: AthenaInsight[];
  topAtRisk: AthenaAtRisk[];
};

const fetcher = async (): Promise<AthenaDashboard> => {
  const res = await endpoints.orion.athena.dashboard();
  return res.data;
};

function AthenaPageContent() {
  const { data, error, isLoading, mutate } = useSWR<AthenaDashboard>('athena-dashboard', fetcher);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-zinc-900">
        <Loader2 className="h-8 w-8 text-zinc-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="">
        <Card className="bg-zinc-800 border-zinc-700">
          <CardContent className="p-6 text-center">
            <p className="text-red-400 mb-4">Impossible de charger le tableau de bord Athena.</p>
            <Button variant="outline" onClick={() => mutate()} className="border-zinc-600 text-zinc-200">
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const dist = data?.distribution?.distribution ?? { healthy: 0, atRisk: 0, critical: 0 };
  const churn = data?.distribution?.churnDistribution ?? { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
  const recentInsights = data?.recentInsights ?? [];
  const topAtRisk = data?.topAtRisk ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/orion/agents">
          <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white hover:bg-zinc-800" aria-label="Retour à la liste des agents">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Eye className="h-8 w-8 text-violet-400" />
            ATHENA
          </h1>
          <p className="mt-1 text-zinc-400">Analyste Intelligence</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> En bonne santé
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-400">{dist.healthy ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> À risque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-400">{dist.atRisk ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500" /> Critique
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-400">{dist.critical ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-zinc-800 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-zinc-400" />
            Répartition du churn
          </CardTitle>
          <p className="text-sm text-zinc-400">Répartition par niveau de risque de désabonnement</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-lg bg-zinc-700/50 p-3 text-center">
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Faible</p>
              <p className="text-xl font-bold text-white">{churn.LOW ?? 0}</p>
            </div>
            <div className="rounded-lg bg-zinc-700/50 p-3 text-center">
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Moyen</p>
              <p className="text-xl font-bold text-white">{churn.MEDIUM ?? 0}</p>
            </div>
            <div className="rounded-lg bg-zinc-700/50 p-3 text-center">
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Élevé</p>
              <p className="text-xl font-bold text-amber-400">{churn.HIGH ?? 0}</p>
            </div>
            <div className="rounded-lg bg-zinc-700/50 p-3 text-center">
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Critique</p>
              <p className="text-xl font-bold text-red-400">{churn.CRITICAL ?? 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-800 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-zinc-400" />
            Clients les plus à risque
          </CardTitle>
          <p className="text-sm text-zinc-400">Top clients à risque de churn</p>
        </CardHeader>
        <CardContent>
          {topAtRisk.length === 0 ? (
            <p className="text-zinc-500 text-sm">Aucun client à risque identifié.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" aria-label="Clients les plus à risque">
                <thead>
                  <tr className="border-b border-zinc-700 text-left text-zinc-400">
                    <th className="pb-2 pr-4">Client</th>
                    <th className="pb-2 pr-4">Marque</th>
                    <th className="pb-2 pr-4">Score santé</th>
                    <th className="pb-2 pr-4">Risque churn</th>
                    <th className="pb-2">Engagement</th>
                  </tr>
                </thead>
                <tbody>
                  {topAtRisk.map((r) => (
                    <tr key={r.userId} className="border-b border-zinc-700/50">
                      <td className="py-3 pr-4 text-white">
                        {[r.user?.firstName, r.user?.lastName].filter(Boolean).join(' ') || r.user?.email || r.userId}
                      </td>
                      <td className="py-3 pr-4 text-zinc-400">{r.user?.brand?.name ?? '—'}</td>
                      <td className="py-3 pr-4 text-white">{r.healthScore}</td>
                      <td className="py-3 pr-4">
                        <Badge
                          variant="secondary"
                          className={
                            r.churnRisk === 'CRITICAL'
                              ? 'bg-red-500/20 text-red-400'
                              : r.churnRisk === 'HIGH'
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-zinc-600 text-zinc-300'
                          }
                        >
                          {r.churnRisk}
                        </Badge>
                      </td>
                      <td className="py-3 text-zinc-400">{r.engagementScore}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-zinc-800 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-zinc-400" />
            Insights récents
          </CardTitle>
          <p className="text-sm text-zinc-400">Dernières analyses et recommandations</p>
        </CardHeader>
        <CardContent>
          {recentInsights.length === 0 ? (
            <p className="text-zinc-500 text-sm">Aucun insight récent.</p>
          ) : (
            <ul className="space-y-3">
              {recentInsights.map((i) => (
                <li key={i.id} className="py-3 border-b border-zinc-700 last:border-0">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-zinc-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-white">{i.title}</span>
                        <Badge variant="outline" className="border-zinc-600 text-zinc-400 text-xs">
                          {i.type}
                        </Badge>
                        {i.severity && (
                          <Badge
                            variant="secondary"
                            className={
                              i.severity === 'HIGH' || i.severity === 'CRITICAL'
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-zinc-600 text-zinc-300'
                            }
                          >
                            {i.severity}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-zinc-400 mt-1">{i.description}</p>
                      <p className="text-xs text-zinc-500 mt-1">
                        {i.createdAt ? new Date(i.createdAt).toLocaleString('fr-FR') : '—'}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function OrionAthenaPage() {
  return (
    <ErrorBoundary level="page" componentName="OrionAthenaPage">
      <AthenaPageContent />
    </ErrorBoundary>
  );
}
