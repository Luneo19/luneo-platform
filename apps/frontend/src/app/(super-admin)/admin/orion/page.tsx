'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sparkles, Activity, Target, Beaker, Zap, Bell, Download, TrendingUp, Users, AlertTriangle, Loader2, RefreshCw, Play, Pause } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useOrionOverview } from '@/hooks/admin/use-orion-overview';

const QUICK_LINKS = [
  { title: 'Health Dashboard', href: '/admin/orion/retention', icon: Activity, description: 'Scores de santé clients' },
  { title: 'Segments', href: '/admin/orion/segments', icon: Target, description: 'Segmentation client' },
  { title: 'Experiments', href: '/admin/orion/experiments', icon: Beaker, description: 'A/B Testing' },
  { title: 'Quick Wins', href: '/admin/orion/quick-wins', icon: Zap, description: 'Actions rapides' },
  { title: 'Notifications', href: '/admin/orion/notifications', icon: Bell, description: 'Alertes admin' },
  { title: 'Exports', href: '/admin/orion/export', icon: Download, description: 'Exporter les données' },
];

export default function OrionCommandCenter() {
  const { data, agents, metrics, isLoading, isError, refresh } = useOrionOverview();
  const [seeding, setSeeding] = useState(false);

  const handleSeedAgents = async () => {
    setSeeding(true);
    try {
      await fetch('/api/admin/orion/seed', { method: 'POST', credentials: 'include' });
      await refresh();
    } catch {
      // silently fail
    } finally {
      setSeeding(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="p-6 text-center">
            <p className="text-red-400">Erreur lors du chargement d&apos;ORION</p>
            <Button variant="outline" onClick={() => refresh()} className="mt-4">Réessayer</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-blue-400" />
            ORION Command Center
          </h1>
          <p className="text-zinc-400 mt-1">Hub stratégique — Intelligence client et insights en temps réel</p>
        </div>
        <Button variant="outline" onClick={() => refresh()} className="border-zinc-700 gap-2">
          <RefreshCw className="w-4 h-4" /> Rafraîchir
        </Button>
      </div>

      {/* KPIs from real metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10"><Users className="w-5 h-5 text-blue-400" /></div>
              <div>
                <p className="text-sm text-zinc-400">Total Clients</p>
                <p className="text-2xl font-bold text-white">{metrics.totalCustomers}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10"><TrendingUp className="w-5 h-5 text-green-400" /></div>
              <div>
                <p className="text-sm text-zinc-400">Actifs</p>
                <p className="text-2xl font-bold text-white">{metrics.activeCustomers}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10"><AlertTriangle className="w-5 h-5 text-red-400" /></div>
              <div>
                <p className="text-sm text-zinc-400">À risque</p>
                <p className="text-2xl font-bold text-white">{metrics.atRiskCustomers}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10"><Sparkles className="w-5 h-5 text-purple-400" /></div>
              <div>
                <p className="text-sm text-zinc-400">Agents actifs</p>
                <p className="text-2xl font-bold text-white">{metrics.agentsActive} / {metrics.agentsTotal}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Agents */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Agents AI</h2>
          {agents.length === 0 && (
            <Button onClick={handleSeedAgents} disabled={seeding} className="gap-2">
              {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Initialiser les agents
            </Button>
          )}
        </div>
        {agents.length === 0 ? (
          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardContent className="p-8 text-center">
              <Sparkles className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-400">Aucun agent configuré. Cliquez sur &quot;Initialiser les agents&quot; pour commencer.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <Card key={agent.id} className="bg-zinc-800/50 border-zinc-700 hover:border-zinc-600 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white text-sm">{agent.name}</CardTitle>
                    <Badge variant="outline" className={
                      agent.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                      agent.status === 'PAUSED' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                      'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                    }>
                      {agent.status === 'ACTIVE' ? <><Play className="w-3 h-3 mr-1" /> Actif</> :
                       agent.status === 'PAUSED' ? <><Pause className="w-3 h-3 mr-1" /> Pause</> :
                       agent.status}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">{agent.type}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-zinc-400 mb-2">{agent.description || 'Pas de description'}</p>
                  {agent.lastRunAt && (
                    <p className="text-xs text-zinc-500">Dernier run : {new Date(agent.lastRunAt).toLocaleString('fr-FR')}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Accès rapide</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {QUICK_LINKS.map((link) => (
            <Link key={link.href} href={link.href}>
              <Card className="bg-zinc-800/50 border-zinc-700 hover:border-blue-500/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <link.icon className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white text-sm">{link.title}</p>
                    <p className="text-xs text-zinc-400">{link.description}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
