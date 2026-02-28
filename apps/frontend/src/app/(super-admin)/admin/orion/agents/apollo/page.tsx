'use client';

import React from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Shield, Loader2, Activity, AlertCircle, BarChart3 } from 'lucide-react';
import { endpoints } from '@/lib/api/client';
import { ErrorBoundary } from '@/components/ErrorBoundary';

type ApolloService = {
  name: string;
  status: string;
  lastChecked: string;
  responseTimeMs?: number | null;
  uptime?: number | null;
};

type ApolloIncident = {
  id: string;
  service: string;
  severity: string;
  title: string;
  status: string;
  startedAt: string;
  resolvedAt?: string | null;
};

type ApolloSla = {
  total: number;
  breached: number;
  compliance: number;
};

type ApolloDashboard = {
  services: ApolloService[];
  incidents: ApolloIncident[];
  metrics: unknown[];
  slaCompliance: ApolloSla;
};

const fetcher = async (): Promise<ApolloDashboard> => {
  const res = await endpoints.orion.apollo.dashboard();
  return (res as { data: ApolloDashboard }).data;
};

function ApolloPageContent() {
  const { data, error, isLoading, mutate } = useSWR<ApolloDashboard>('apollo-dashboard', fetcher);

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
            <p className="text-red-400 mb-4">Impossible de charger le tableau de bord Apollo.</p>
            <Button variant="outline" onClick={() => mutate()} className="border-zinc-600 text-zinc-200">
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sla = data?.slaCompliance ?? { total: 0, breached: 0, compliance: 0 };
  const services = data?.services ?? [];
  const incidents = data?.incidents ?? [];
  const metrics = Array.isArray(data?.metrics) ? data.metrics : [];

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
            <Shield className="h-8 w-8 text-sky-400" />
            APOLLO
          </h1>
          <p className="mt-1 text-zinc-400">Gardien de la plateforme</p>
        </div>
      </div>

      <Card className="bg-zinc-800 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="h-5 w-5 text-zinc-400" />
            Conformité SLA
          </CardTitle>
          <p className="text-sm text-zinc-400">Taux de respect des engagements de niveau de service</p>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="text-center sm:text-left">
            <p
              className={`text-4xl font-bold ${
                (sla.compliance ?? 0) >= 99 ? 'text-emerald-400' : (sla.compliance ?? 0) >= 95 ? 'text-amber-400' : 'text-red-400'
              }`}
            >
              {typeof sla.compliance === 'number' ? `${sla.compliance.toFixed(1)}%` : '—'}
            </p>
            <p className="text-sm text-zinc-500 mt-1">Conformité</p>
          </div>
          <div className="flex gap-6 text-sm">
            <div>
              <span className="text-zinc-500">Total :</span>{' '}
              <span className="text-white font-medium">{sla.total}</span>
            </div>
            <div>
              <span className="text-zinc-500">Manqués :</span>{' '}
              <span className="text-red-400 font-medium">{sla.breached}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-800 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-white">État des services</CardTitle>
          <p className="text-sm text-zinc-400">Santé des composants de la plateforme</p>
        </CardHeader>
        <CardContent>
          {services.length === 0 ? (
            <p className="text-zinc-500 text-sm">Aucun service renvoyé.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((s) => (
                <div
                  key={s.name}
                  className={`rounded-lg border p-4 ${
                    s.status === 'HEALTHY'
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-red-500/10 border-red-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-white">{s.name}</span>
                    <span
                      className={`w-3 h-3 rounded-full shrink-0 ${
                        s.status === 'HEALTHY' ? 'bg-emerald-500' : 'bg-red-500'
                      }`}
                    />
                  </div>
                  <div className="mt-2 text-xs text-zinc-400 space-y-1">
                    {s.lastChecked && (
                      <p>Dernière vérif. : {new Date(s.lastChecked).toLocaleString('fr-FR')}</p>
                    )}
                    {s.responseTimeMs != null && <p>Temps de réponse : {s.responseTimeMs} ms</p>}
                    {s.uptime != null && <p>Disponibilité : {(s.uptime * 100).toFixed(1)}%</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-zinc-800 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-zinc-400" />
            Incidents
          </CardTitle>
          <p className="text-sm text-zinc-400">Historique des incidents et statut</p>
        </CardHeader>
        <CardContent>
          {incidents.length === 0 ? (
            <p className="text-zinc-500 text-sm">Aucun incident.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" aria-label="Tableau des incidents">
                <thead>
                  <tr className="border-b border-zinc-700 text-left text-zinc-400">
                    <th className="pb-2 pr-4">Service</th>
                    <th className="pb-2 pr-4">Titre</th>
                    <th className="pb-2 pr-4">Sévérité</th>
                    <th className="pb-2 pr-4">Statut</th>
                    <th className="pb-2 pr-4">Début</th>
                    <th className="pb-2">Résolution</th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.map((inc) => (
                    <tr key={inc.id} className="border-b border-zinc-700/50">
                      <td className="py-3 pr-4 text-white">{inc.service}</td>
                      <td className="py-3 pr-4 text-zinc-300">{inc.title}</td>
                      <td className="py-3 pr-4">
                        <Badge
                          variant="secondary"
                          className={
                            inc.severity === 'CRITICAL' || inc.severity === 'HIGH'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }
                        >
                          {inc.severity}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant="outline" className="border-zinc-600 text-zinc-400">
                          {inc.status}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 text-zinc-400">
                        {inc.startedAt ? new Date(inc.startedAt).toLocaleString('fr-FR') : '—'}
                      </td>
                      <td className="py-3 text-zinc-400">
                        {inc.resolvedAt ? new Date(inc.resolvedAt).toLocaleString('fr-FR') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {metrics.length > 0 && (
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-zinc-400" />
              Métriques de performance
            </CardTitle>
            <p className="text-sm text-zinc-400">Résumé des indicateurs</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {metrics.map((m: unknown, idx: number) => (
                <div key={idx} className="rounded-lg bg-zinc-700/50 p-3 text-sm">
                  {typeof m === 'object' && m !== null ? (
                    <pre className="text-zinc-300 text-xs overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(m, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-white">{String(m)}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function OrionApolloPage() {
  return (
    <ErrorBoundary level="page" componentName="OrionApolloPage">
      <ApolloPageContent />
    </ErrorBoundary>
  );
}
