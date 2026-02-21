'use client';

import React, { useCallback } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Zap, Loader2, Building2, Building, Ticket, Check, X } from 'lucide-react';
import { endpoints } from '@/lib/api/client';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useToast } from '@/hooks/use-toast';

type ZeusAlert = {
  id: string;
  alertName: string;
  severity: string;
  status: string;
  message: string;
  firedAt: string;
};

type ZeusDecision = {
  id: string;
  type: string;
  title: string;
  description: string;
  impact: string;
  suggestedAction: string;
  createdAt: string;
};

type ZeusDashboard = {
  alerts: ZeusAlert[];
  decisions: ZeusDecision[];
  metrics: {
    totalBrands: number;
    activeBrands: number;
    totalTickets: number;
    openTickets: number;
  };
};

const fetcher = async (): Promise<ZeusDashboard> => {
  const res = await endpoints.orion.zeus.dashboard();
  return (res as { data: ZeusDashboard }).data;
};

function ZeusPageContent() {
  const { toast } = useToast();
  const { data, error, isLoading, mutate } = useSWR<ZeusDashboard>('zeus-dashboard', fetcher);

  const handleOverride = useCallback(
    async (actionId: string, approved: boolean) => {
      try {
        await endpoints.orion.zeus.override(actionId, approved);
        await mutate();
      } catch {
        toast({
          title: 'Erreur',
          description: 'Impossible d\'appliquer la décision. Veuillez réessayer.',
          variant: 'destructive',
        });
      }
    },
    [mutate, toast]
  );

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
            <p className="text-red-400 mb-4">Impossible de charger le tableau de bord Zeus.</p>
            <Button variant="outline" onClick={() => mutate()} className="border-zinc-600 text-zinc-200">
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const metrics = data?.metrics ?? { totalBrands: 0, activeBrands: 0, totalTickets: 0, openTickets: 0 };
  const alerts = data?.alerts ?? [];
  const decisions = data?.decisions ?? [];

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
            <Zap className="h-8 w-8 text-amber-400" />
            ZEUS
          </h1>
          <p className="mt-1 text-zinc-400">Commandant Stratégique</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Marques totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{metrics.totalBrands}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
              <Building className="h-4 w-4" /> Marques actives
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{metrics.activeBrands}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
              <Ticket className="h-4 w-4" /> Tickets ouverts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{metrics.openTickets}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
              <Ticket className="h-4 w-4" /> Total tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{metrics.totalTickets}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-zinc-800 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-white">Alertes critiques</CardTitle>
          <p className="text-sm text-zinc-400">Dernières alertes nécessitant une attention</p>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <p className="text-zinc-500 text-sm">Aucune alerte critique.</p>
          ) : (
            <ul className="space-y-3">
              {alerts.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-wrap items-start justify-between gap-2 py-3 border-b border-zinc-700 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-white">{a.alertName}</span>
                      <Badge
                        variant="secondary"
                        className={
                          a.severity === 'CRITICAL'
                            ? 'bg-red-500/20 text-red-400 border-red-500/30'
                            : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                        }
                      >
                        {a.severity}
                      </Badge>
                      <Badge variant="outline" className="border-zinc-600 text-zinc-400">
                        {a.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-zinc-400 mt-1">{a.message}</p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {a.firedAt ? new Date(a.firedAt).toLocaleString('fr-FR') : '—'}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="bg-zinc-800 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-white">Décisions stratégiques</CardTitle>
          <p className="text-sm text-zinc-400">Approuver ou rejeter les actions suggérées</p>
        </CardHeader>
        <CardContent>
          {decisions.length === 0 ? (
            <p className="text-zinc-500 text-sm">Aucune décision en attente.</p>
          ) : (
            <ul className="space-y-4">
              {decisions.map((d) => (
                <li key={d.id} className="py-3 border-b border-zinc-700 last:border-0">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-white">{d.title}</span>
                        <Badge variant="outline" className="border-zinc-600 text-zinc-400">
                          {d.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-zinc-400 mt-1">{d.description}</p>
                      <p className="text-xs text-zinc-500 mt-1">
                        <span className="text-zinc-400">Impact :</span> {d.impact}
                      </p>
                      <p className="text-xs text-zinc-500">
                        <span className="text-zinc-400">Action suggérée :</span> {d.suggestedAction}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">
                        {d.createdAt ? new Date(d.createdAt).toLocaleString('fr-FR') : '—'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="default"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => handleOverride(d.id, true)}
                        aria-label="Approuver la décision"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approuver
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                        onClick={() => handleOverride(d.id, false)}
                        aria-label="Rejeter la décision"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Rejeter
                      </Button>
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

export default function OrionZeusPage() {
  return (
    <ErrorBoundary level="page" componentName="OrionZeusPage">
      <ZeusPageContent />
    </ErrorBoundary>
  );
}
