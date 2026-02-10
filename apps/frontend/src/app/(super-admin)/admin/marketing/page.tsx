'use client';

/**
 * Admin Marketing - Vue d'ensemble campagnes et automations
 * Stats chargées depuis /api/v1/orion/communications/stats
 */
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Mail,
  Zap,
  BarChart3,
  Target,
  ArrowRight,
  Send,
  FileText,
  Loader2,
} from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type CommunicationsStats = {
  totalTemplates: number;
  totalCampaigns: number;
  totalSent: number;
  totalLogs: number;
};

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export default function AdminMarketingPage() {
  const [stats, setStats] = useState<CommunicationsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const url = `${API_BASE_URL}/api/v1/orion/communications/stats`;
    fetch(url, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText || 'Erreur chargement stats');
        return res.json();
      })
      .then((data: CommunicationsStats) => {
        setStats(data);
        setError(null);
      })
      .catch((err: Error) => {
        setError(err.message || 'Impossible de charger les statistiques');
        setStats(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const kpis = stats
    ? [
        { label: 'Templates', value: formatNumber(stats.totalTemplates), icon: FileText, color: 'text-cyan-400' },
        { label: 'Campagnes', value: formatNumber(stats.totalCampaigns), icon: Target, color: 'text-amber-400' },
        { label: 'Emails envoyés', value: formatNumber(stats.totalSent), icon: Send, color: 'text-green-400' },
        { label: 'Entrées journal', value: formatNumber(stats.totalLogs), icon: Mail, color: 'text-purple-400' },
      ]
    : [];

  return (
    <div className="space-y-6 min-h-screen bg-zinc-900 text-zinc-100 p-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Marketing</h1>
        <p className="mt-2 text-zinc-400">
          Gestion des campagnes et automations
        </p>
      </div>

      {/* Quick stats from API */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
          </div>
        ) : error ? (
          <div className="col-span-full rounded-lg border border-zinc-700 bg-zinc-800/80 p-4 text-amber-400">
            {error}
          </div>
        ) : (
          kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Card key={kpi.label} className="border-zinc-700 bg-zinc-800">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-zinc-400">{kpi.label}</p>
                      <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
                    </div>
                    <div className="rounded-lg bg-zinc-700/50 p-3">
                      <Icon className={`h-5 w-5 ${kpi.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Links grid - from navigation: automations, templates, communications log */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/admin/marketing/automations">
          <Card className="border-zinc-700 bg-zinc-800 transition-colors hover:border-cyan-500/50 hover:bg-zinc-800/90">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="flex items-center gap-2 text-white">
                <Zap className="h-5 w-5 text-cyan-400" />
                Automations
              </CardTitle>
              <ArrowRight className="h-5 w-5 text-zinc-400" />
            </CardHeader>
            <CardContent>
              <CardDescription className="text-zinc-400">
                Gérer les workflows automatisés
              </CardDescription>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/marketing/templates">
          <Card className="border-zinc-700 bg-zinc-800 transition-colors hover:border-cyan-500/50 hover:bg-zinc-800/90">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="flex items-center gap-2 text-white">
                <FileText className="h-5 w-5 text-cyan-400" />
                Templates
              </CardTitle>
              <ArrowRight className="h-5 w-5 text-zinc-400" />
            </CardHeader>
            <CardContent>
              <CardDescription className="text-zinc-400">
                Modèles d&apos;emails et de campagnes
              </CardDescription>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/marketing/communications">
          <Card className="border-zinc-700 bg-zinc-800 transition-colors hover:border-cyan-500/50 hover:bg-zinc-800/90">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="flex items-center gap-2 text-white">
                <Mail className="h-5 w-5 text-cyan-400" />
                Communications Log
              </CardTitle>
              <ArrowRight className="h-5 w-5 text-zinc-400" />
            </CardHeader>
            <CardContent>
              <CardDescription className="text-zinc-400">
                Historique des envois et campagnes
              </CardDescription>
            </CardContent>
          </Card>
        </Link>

        <Card className="border-zinc-700 bg-zinc-800 opacity-90">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2 text-white">
              <BarChart3 className="h-5 w-5 text-cyan-400" />
              Campagnes Email
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-zinc-400">
              Créer et gérer les campagnes email (à venir)
            </CardDescription>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
