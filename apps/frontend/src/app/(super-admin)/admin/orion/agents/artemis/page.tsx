'use client';

import React, { useCallback } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ShieldAlert, Loader2, Shield, AlertTriangle, Ban, FileWarning } from 'lucide-react';
import { endpoints } from '@/lib/api/client';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useToast } from '@/hooks/use-toast';

type ActiveThreat = {
  id: string;
  type: string;
  severity: string;
  source: string;
  description: string;
  ipAddress?: string;
  status: string;
  createdAt: string;
};

type BlockedIP = {
  id: string;
  ipAddress: string;
  reason: string;
  isActive: boolean;
  createdAt: string;
};

type RecentFraud = {
  id: string;
  riskScore: number;
  riskLevel: string;
  reasons: string[];
  actionType: string;
  createdAt: string;
};

type RecentAudit = {
  id: string;
  eventType: string;
  action: string;
  timestamp: string;
};

type ArtemisDashboard = {
  securityScore: number;
  activeThreats: ActiveThreat[];
  blockedIPs: BlockedIP[];
  recentFraud: RecentFraud[];
  recentAudit: RecentAudit[];
  stats: {
    threatsCount: number;
    blockedIPsCount: number;
    fraudAlertsCount: number;
  };
};

function scoreColor(score: number): string {
  if (score > 80) return 'text-emerald-400';
  if (score > 50) return 'text-amber-400';
  return 'text-red-400';
}

function scoreBg(score: number): string {
  if (score > 80) return 'bg-emerald-500/20 border-emerald-500/40';
  if (score > 50) return 'bg-amber-500/20 border-amber-500/40';
  return 'bg-red-500/20 border-red-500/40';
}

function severityBadge(severity: string): string {
  const s = severity?.toLowerCase() ?? '';
  if (s === 'critical' || s === 'high') return 'bg-red-500/20 text-red-400 border-red-500/30';
  if (s === 'medium') return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
}

function ArtemisPageContent() {
  const { toast } = useToast();
  const { data, error, isLoading, mutate } = useSWR<ArtemisDashboard>(
    'orion-artemis-dashboard',
    async () => {
      const res = await endpoints.orion.artemis.dashboard();
      return res.data as ArtemisDashboard;
    },
    { refreshInterval: 30000 }
  );

  const handleResolveThreat = useCallback(
    async (id: string) => {
      try {
        await endpoints.orion.artemis.resolveThreat(id);
        await mutate();
        toast({ title: 'Menace résolue', description: 'La menace a été marquée comme résolue.' });
      } catch (err) {
        toast({ title: 'Erreur', description: err instanceof Error ? err.message : 'Impossible de résoudre la menace.', variant: 'destructive' });
      }
    },
    [mutate]
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
      <div className="space-y-6 bg-zinc-900 min-h-screen p-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/orion/agents">
            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <Card className="bg-zinc-800/80 border-zinc-600">
          <CardContent className="p-6 text-center">
            <p className="text-red-400 mb-4">Impossible de charger le tableau de bord Artemis.</p>
            <Button variant="outline" onClick={() => mutate()} className="border-zinc-600 text-zinc-200">
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const dashboard = data ?? ({} as ArtemisDashboard);
  const score = dashboard.securityScore ?? 0;
  const activeThreats = dashboard.activeThreats ?? [];
  const blockedIPs = dashboard.blockedIPs ?? [];
  const recentFraud = dashboard.recentFraud ?? [];
  const stats = dashboard.stats ?? { threatsCount: 0, blockedIPsCount: 0, fraudAlertsCount: 0 };

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
            <ShieldAlert className="h-8 w-8 text-amber-400" />
            ARTEMIS
          </h1>
          <p className="mt-1 text-zinc-400">Security Hunter</p>
        </div>
      </div>

      {/* Score de sécurité */}
      <Card className={`border ${scoreBg(score)} bg-zinc-800/80`}>
        <CardHeader>
          <CardTitle className="text-zinc-300">Score de sécurité</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="text-5xl font-bold tabular-nums">
              <span className={scoreColor(score)}>{score}</span>
              <span className="text-zinc-500 text-2xl">/100</span>
            </div>
            <p className="text-sm text-zinc-400">
              {score > 80 ? 'Sécurité élevée' : score > 50 ? 'Vigilance recommandée' : 'Action requise'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-zinc-800/80 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Menaces actives
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{stats.threatsCount ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-800/80 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
              <Ban className="h-4 w-4" /> IP bloquées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{stats.blockedIPsCount ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-800/80 border-zinc-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
              <FileWarning className="h-4 w-4" /> Alertes fraude
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{stats.fraudAlertsCount ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Menaces actives */}
      <Card className="bg-zinc-800/80 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="h-5 w-5" /> Menaces actives
          </CardTitle>
          <p className="text-sm text-zinc-400">Résoudre les menaces détectées</p>
        </CardHeader>
        <CardContent>
          {activeThreats.length === 0 ? (
            <p className="text-zinc-500 text-sm">Aucune menace active.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" aria-label="Menaces de sécurité actives">
                <thead>
                  <tr className="border-b border-zinc-700 text-zinc-400 text-left">
                    <th className="pb-2 pr-4">Type</th>
                    <th className="pb-2 pr-4">Sévérité</th>
                    <th className="pb-2 pr-4">Source / IP</th>
                    <th className="pb-2 pr-4">Description</th>
                    <th className="pb-2 pr-4">Date</th>
                    <th className="pb-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {activeThreats.map((t) => (
                    <tr key={t.id} className="border-b border-zinc-700/50">
                      <td className="py-3 pr-4 text-zinc-300">{t.type ?? '—'}</td>
                      <td className="py-3 pr-4">
                        <Badge variant="secondary" className={severityBadge(t.severity)}>
                          {t.severity ?? '—'}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 text-zinc-300">{t.source || (t.ipAddress ?? '—')}</td>
                      <td className="py-3 pr-4 text-zinc-400 max-w-[200px] truncate">{t.description ?? '—'}</td>
                      <td className="py-3 pr-4 text-zinc-500 text-xs">
                        {t.createdAt ? new Date(t.createdAt).toLocaleString('fr-FR') : '—'}
                      </td>
                      <td className="py-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                          onClick={() => handleResolveThreat(t.id)}
                          aria-label={`Résoudre la menace ${t.type}`}
                        >
                          Résoudre
                        </Button>
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
        {/* IP bloquées */}
        <Card className="bg-zinc-800/80 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white">IP bloquées</CardTitle>
            <p className="text-sm text-zinc-400">Liste des adresses IP bloquées</p>
          </CardHeader>
          <CardContent>
            {blockedIPs.length === 0 ? (
              <p className="text-zinc-500 text-sm">Aucune IP bloquée.</p>
            ) : (
              <ul className="space-y-2">
                {blockedIPs.map((b) => (
                  <li
                    key={b.id}
                    className="flex items-center justify-between text-sm border-b border-zinc-700/50 pb-2"
                  >
                    <span className="font-mono text-zinc-300">{b.ipAddress}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500 truncate max-w-[120px]">{b.reason}</span>
                      {b.isActive && (
                        <Badge variant="secondary" className="bg-red-500/20 text-red-400 text-xs">
                          Actif
                        </Badge>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Vérifications fraude récentes */}
        <Card className="bg-zinc-800/80 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white">Vérifications fraude récentes</CardTitle>
            <p className="text-sm text-zinc-400">Derniers contrôles anti-fraude</p>
          </CardHeader>
          <CardContent>
            {recentFraud.length === 0 ? (
              <p className="text-zinc-500 text-sm">Aucune vérification récente.</p>
            ) : (
              <ul className="space-y-2">
                {recentFraud.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-center justify-between text-sm border-b border-zinc-700/50 pb-2"
                  >
                    <div>
                      <span className="text-zinc-300">Score {f.riskScore} — {f.riskLevel}</span>
                      {f.reasons?.length ? (
                        <p className="text-zinc-500 text-xs mt-0.5">{f.reasons.join(', ')}</p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-zinc-700 text-zinc-300">
                        {f.actionType ?? '—'}
                      </Badge>
                      <span className="text-zinc-500 text-xs">
                        {f.createdAt ? new Date(f.createdAt).toLocaleString('fr-FR') : '—'}
                      </span>
                    </div>
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

export default function OrionArtemisPage() {
  return (
    <ErrorBoundary level="page" componentName="OrionArtemisPage">
      <ArtemisPageContent />
    </ErrorBoundary>
  );
}
