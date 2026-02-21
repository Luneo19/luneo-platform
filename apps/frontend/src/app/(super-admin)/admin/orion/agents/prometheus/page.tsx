'use client';

import React from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Zap,
  ArrowLeft,
  Loader2,
  AlertCircle,
  RefreshCw,
  MessageSquare,
  Clock,
  CheckCircle2,
  Gauge,
  Server,
  ArrowRight,
} from 'lucide-react';
import { usePrometheus } from '@/hooks/admin/use-prometheus';
import { ErrorBoundary } from '@/components/ErrorBoundary';

type ProviderItem = {
  name: string;
  model?: string;
  circuit?: string | { state?: string };
};

type PrometheusStats = {
  totalResponses?: number;
  pendingReview?: number;
  autoApproved?: number;
  avgConfidence?: number;
  avgLatencyMs?: number;
  providers?: ProviderItem[];
};

function PrometheusPageContent() {
  const { stats, isLoading, error, refresh } = usePrometheus();
  const data = stats as PrometheusStats | undefined;

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-zinc-900">
        <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-zinc-100">
      <div className="flex items-center gap-4">
        <Link href="/admin/orion/agents">
          <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white" aria-label="Retour à la liste des agents">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Zap className="h-8 w-8 text-amber-400" />
            PROMETHEUS
          </h1>
          <p className="mt-1 text-zinc-400">Support IA Agent</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refresh()}
          disabled={isLoading}
          className="border-zinc-700 text-zinc-200 gap-2"
          aria-label="Rafraîchir les statistiques"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Rafraîchir
        </Button>
      </div>

      {error && (
        <Card className="bg-zinc-800/80 border-zinc-600 border-red-500/30">
          <CardContent className="p-6 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
            <p className="text-red-400 flex-1">Erreur lors du chargement des statistiques Prometheus.</p>
            <Button variant="outline" onClick={() => refresh()} className="border-zinc-600 text-zinc-200">
              Réessayer
            </Button>
          </CardContent>
        </Card>
      )}

      {!error && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" /> Réponses totales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-white">{data?.totalResponses ?? '—'}</p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                  <Clock className="h-4 w-4" /> En attente de revue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-amber-400">{data?.pendingReview ?? '—'}</p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> Auto-approuvés
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-emerald-400">{data?.autoApproved ?? '—'}</p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                  <Gauge className="h-4 w-4" /> Confiance moyenne
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-white">
                  {data?.avgConfidence != null ? `${(data.avgConfidence * 100).toFixed(0)}%` : '—'}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Latence moyenne
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-white">
                  {data?.avgLatencyMs != null ? `${data.avgLatencyMs} ms` : '—'}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-white">File de validation</CardTitle>
              <Link href="/admin/orion/review-queue">
                <Button variant="outline" size="sm" className="border-zinc-600 text-zinc-200 gap-2">
                  Voir la file de validation IA
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-400">
                Consultez et validez les réponses IA en attente depuis la file de validation.
              </p>
            </CardContent>
          </Card>

          {data?.providers && data.providers.length > 0 && (
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Server className="h-5 w-5 text-zinc-400" />
                  Fournisseurs LLM
                </CardTitle>
                <p className="text-sm text-zinc-400">État des providers et modèles</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.providers.map((provider, idx) => (
                    <div
                      key={provider.name + String(idx)}
                      className="flex items-center justify-between p-4 rounded-lg border border-zinc-700/50 bg-zinc-900/50"
                    >
                      <div>
                        <p className="font-medium text-white">{provider.name}</p>
                        {provider.model && (
                          <p className="text-sm text-zinc-400">{provider.model}</p>
                        )}
                      </div>
                      <Badge
                        variant="secondary"
                        className={(() => {
                          const circuitState = typeof provider.circuit === 'object' && provider.circuit !== null
                            ? (provider.circuit as { state?: string }).state
                            : provider.circuit;
                          return circuitState === 'OPEN' || circuitState === 'open'
                            ? 'bg-red-500/20 text-red-400 border-red-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
                        })()}
                      >
                        {typeof provider.circuit === 'object' && provider.circuit !== null
                          ? (provider.circuit as { state?: string }).state ?? 'OK'
                          : provider.circuit ?? 'OK'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

export default function OrionPrometheusPage() {
  return (
    <ErrorBoundary level="page" componentName="OrionPrometheusPage">
      <PrometheusPageContent />
    </ErrorBoundary>
  );
}
