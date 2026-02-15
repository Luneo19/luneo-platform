'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Activity,
  Target,
  Beaker,
  Zap,
  Bell,
  Download,
  DollarSign,
  Users,
  TrendingDown,
  ThumbsUp,
  ArrowUpRight,
  BarChart3,
  Gem,
  Loader2,
  RefreshCw,
  Play,
  Pause,
  AlertCircle,
  MessageSquare,
  Bot,
  Gauge,
  LineChart,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useOrionDashboard } from '@/hooks/admin/use-orion-dashboard';
import { logger } from '@/lib/logger';
import { fetchWithTimeout } from '@/lib/fetch-with-timeout';

const QUICK_LINKS = [
  { title: 'Agents', href: '/admin/orion/agents', icon: Bot, description: 'Gestion des agents AI' },
  { title: 'Automations', href: '/admin/orion/automations', icon: Zap, description: 'Automatisations' },
  { title: 'Communications', href: '/admin/orion/communications', icon: MessageSquare, description: 'Templates et envois' },
  { title: 'Health Dashboard', href: '/admin/orion/retention', icon: Activity, description: 'Scores de santé clients' },
  { title: 'Segments', href: '/admin/orion/segments', icon: Target, description: 'Segmentation client' },
  { title: 'Experiments', href: '/admin/orion/experiments', icon: Beaker, description: 'A/B Testing' },
  { title: 'Analytics', href: '/admin/orion/analytics', icon: LineChart, description: 'Analytics et rapports' },
  { title: 'Quick Wins', href: '/admin/orion/quick-wins', icon: Zap, description: 'Actions rapides' },
  { title: 'Notifications', href: '/admin/orion/notifications', icon: Bell, description: 'Alertes admin' },
  { title: 'Exports', href: '/admin/orion/export', icon: Download, description: 'Exporter les données' },
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

export default function OrionCommandCenter() {
  const {
    overview,
    revenue,
    retention,
    kpis,
    isLoading,
    isOverviewError,
    overviewError,
    refresh,
  } = useOrionDashboard();
  const [seeding, setSeeding] = useState(false);

  const agents = overview?.agents ?? [];
  const metrics = overview?.metrics;
  const atRiskCustomers = metrics?.atRiskCustomers ?? 0;
  const activeCustomers = metrics?.activeCustomers ?? 0;
  const pausedCount = agents.filter((a) => a.status === 'PAUSED').length;

  const handleSeedAgents = async () => {
    setSeeding(true);
    try {
      const res = await fetchWithTimeout('/api/admin/orion/seed', {
        method: 'POST',
        credentials: 'include',
        timeout: 10000,
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        logger.error('ORION seed agents failed', { status: res.status, body: errBody });
      } else {
        await refresh();
      }
    } catch (err) {
      logger.error('ORION seed agents failed', { error: err });
    } finally {
      setSeeding(false);
    }
  };

  if (isLoading && !overview) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (isOverviewError) {
    return (
      <div className="p-6">
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="p-6 text-center">
            <p className="text-red-400">Erreur lors du chargement d&apos;ORION</p>
            <Button variant="outline" onClick={() => refresh()} className="mt-4">
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const mrr = revenue?.mrr;
  const growthRate = revenue?.growthRate;
  const atRiskPercent = retention?.atRiskPercent;
  const arpu = revenue && activeCustomers > 0 ? revenue.mrr / activeCustomers : undefined;

  return (
    <div className="space-y-8 p-6 bg-zinc-900 min-h-screen text-zinc-100">
      {/* 1. Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-blue-400" />
            ORION Command Center
          </h1>
          <p className="text-zinc-400 mt-1">
            Hub stratégique — Intelligence client et insights en temps réel
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refresh()}
          disabled={isLoading}
          className="border-zinc-700 gap-2"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Rafraîchir
        </Button>
      </div>

      {/* 2. Health Pulse - 8 metric cards */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Gauge className="w-5 h-5 text-blue-400" />
          Health Pulse
        </h2>
        <p className="text-sm text-zinc-400 mb-4">Indicateurs clés en temps réel</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <DollarSign className="w-5 h-5 text-blue-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-zinc-400 uppercase tracking-wide">MRR</p>
                  <p className="text-xl font-bold text-white truncate">
                    {mrr != null ? formatCurrency(mrr) : '—'}
                  </p>
                  {growthRate != null && (
                    <p className={`text-xs ${growthRate >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {growthRate >= 0 ? '↑' : '↓'} {Math.abs(growthRate * 100).toFixed(1)}%
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <Users className="w-5 h-5 text-green-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-zinc-400 uppercase tracking-wide">Active Users</p>
                  <p className="text-xl font-bold text-white">
                    {activeCustomers != null ? activeCustomers : '—'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/20">
                  <TrendingDown className="w-5 h-5 text-red-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-zinc-400 uppercase tracking-wide">Churn Risk</p>
                  <p className="text-xl font-bold text-white">
                    {atRiskPercent != null ? formatPercent(atRiskPercent) : '—'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <ThumbsUp className="w-5 h-5 text-purple-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-zinc-400 uppercase tracking-wide">NPS Score</p>
                  <p className="text-xl font-bold text-white">
                    {kpis?.nps?.value != null ? kpis.nps.value : '—'}
                  </p>
                  {kpis?.nps?.totalResponses != null && kpis.nps.totalResponses > 0 && (
                    <p className="text-xs text-zinc-400">{kpis.nps.totalResponses} réponses</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/20">
                  <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-zinc-400 uppercase tracking-wide">Trial Conversion</p>
                  <p className="text-xl font-bold text-white">
                    {kpis?.trialConversion?.rate != null ? formatPercent(kpis.trialConversion.rate) : '—'}
                  </p>
                  {kpis?.trialConversion?.converted != null && kpis.trialConversion.converted > 0 && (
                    <p className="text-xs text-zinc-400">{kpis.trialConversion.converted} convertis</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/20">
                  <BarChart3 className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-zinc-400 uppercase tracking-wide">ARPU</p>
                  <p className="text-xl font-bold text-white">
                    {arpu != null ? formatCurrency(arpu) : '—'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20">
                  <Gem className="w-5 h-5 text-amber-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-zinc-400 uppercase tracking-wide">LTV</p>
                  <p className="text-xl font-bold text-white">
                    {revenue?.mrr != null && activeCustomers > 0
                      ? formatCurrency((revenue.mrr / activeCustomers) * 12)
                      : '—'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-pink-500/20">
                  <Target className="w-5 h-5 text-pink-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-zinc-400 uppercase tracking-wide">CAC</p>
                  <p className="text-xl font-bold text-white">
                    {kpis?.cac?.value != null ? formatCurrency(kpis.cac.value) : '—'}
                  </p>
                  {kpis?.cac?.value == null && (
                    <p className="text-xs text-zinc-500">Ajouter les dépenses marketing</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 3. Agent Status Grid */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Agent Status Grid</h2>
            <p className="text-sm text-zinc-400">État des agents ORION</p>
          </div>
          {agents.length === 0 && (
            <Button onClick={handleSeedAgents} disabled={seeding} className="gap-2">
              {seeding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Initialiser les agents
            </Button>
          )}
        </div>
        {agents.length === 0 ? (
          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardContent className="p-8 text-center">
              <Sparkles className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-400">
                Aucun agent configuré. Cliquez sur &quot;Initialiser les agents&quot; pour commencer.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => {
              const statusDot =
                agent.status === 'ACTIVE'
                  ? 'bg-green-500'
                  : agent.status === 'PAUSED'
                    ? 'bg-yellow-500'
                    : 'bg-red-500';
              const slug = (agent.name ?? agent.id ?? '').toLowerCase();
              const displayName = (agent as { displayName?: string }).displayName || agent.type || agent.name || 'Agent';
              return (
                <Card
                  key={agent.id}
                  className="bg-zinc-800/50 border-zinc-700 hover:border-zinc-600 transition-colors"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full shrink-0 ${statusDot}`}
                        aria-hidden
                      />
                      <CardTitle className="text-white text-sm">{agent.name}</CardTitle>
                      <Badge
                        variant="outline"
                        className={
                          agent.status === 'ACTIVE'
                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                            : agent.status === 'PAUSED'
                              ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                              : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }
                      >
                        {agent.status === 'ACTIVE' ? (
                          <>
                            <Play className="w-3 h-3 mr-1 inline" /> Actif
                          </>
                        ) : agent.status === 'PAUSED' ? (
                          <>
                            <Pause className="w-3 h-3 mr-1 inline" /> Pause
                          </>
                        ) : (
                          agent.status
                        )}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">
                      {displayName}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-xs text-zinc-400 line-clamp-2">
                      {agent.description || 'Pas de description'}
                    </p>
                    {agent.lastRunAt && (
                      <p className="text-xs text-zinc-500">
                        Dernier run : {new Date(agent.lastRunAt).toLocaleString('fr-FR')}
                      </p>
                    )}
                    <Link
                      href={`/admin/orion/agents/${slug}`}
                      className="text-xs text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
                    >
                      Voir l&apos;agent <ArrowUpRight className="w-3 h-3" />
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. AI Insights & Recommendations */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          AI Insights & Recommendations
        </h2>
        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardContent className="p-6">
            <ul className="space-y-3">
              {atRiskCustomers > 0 && (
                <li className="flex items-center gap-2 text-amber-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>
                    {atRiskCustomers} customer{atRiskCustomers !== 1 ? 's' : ''} at risk of churn —{' '}
                    <Link
                      href="/admin/orion/retention"
                      className="underline hover:text-amber-300"
                    >
                      Review in Retention Dashboard
                    </Link>
                  </span>
                </li>
              )}
              {pausedCount > 0 && (
                <li className="flex items-center gap-2 text-yellow-400">
                  <Pause className="w-4 h-4 shrink-0" />
                  <span>
                    {pausedCount} agent{pausedCount !== 1 ? 's' : ''} paused — Review agent
                    configuration
                  </span>
                </li>
              )}
              {atRiskCustomers === 0 && pausedCount === 0 && (
                <li className="flex items-center gap-2 text-green-400">
                  <ThumbsUp className="w-4 h-4 shrink-0" />
                  <span>All systems healthy</span>
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* 5. Quick Links Grid */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4">Accès rapide</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {QUICK_LINKS.map((link) => (
            <Link key={link.href} href={link.href}>
              <Card className="bg-zinc-800/50 border-zinc-700 hover:border-blue-500/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <link.icon className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-white text-sm truncate">{link.title}</p>
                    <p className="text-xs text-zinc-400 truncate">{link.description}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
