'use client';

/**
 * ORION Command Center - Hub Page (Phase 1)
 * Central dashboard for all 6 AI agents
 */
import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Zap, Brain, MessageSquare, Shield, TrendingUp, BarChart3,
  Activity, Users, DollarSign, AlertTriangle, Play, Pause,
  ArrowRight, Sparkles, RefreshCcw,
} from 'lucide-react';

const AGENTS = [
  {
    id: 'apollo', name: 'APOLLO', displayName: 'Acquisition Intelligence',
    icon: Zap, color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20',
    description: 'Lead scoring, campagnes intelligentes, A/B testing',
  },
  {
    id: 'athena', name: 'ATHENA', displayName: 'Onboarding Orchestrator',
    icon: Brain, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20',
    description: 'Parcours adaptatif, email sequences, intervention proactive',
  },
  {
    id: 'hermes', name: 'HERMES', displayName: 'Communication Hub',
    icon: MessageSquare, color: 'text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/20',
    description: 'Email automation, in-app messaging, push notifications',
  },
  {
    id: 'artemis', name: 'ARTEMIS', displayName: 'Retention Guardian',
    icon: Shield, color: 'text-amber-400', bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/20',
    description: 'Churn prediction, win-back campaigns, NPS automation',
  },
  {
    id: 'hades', name: 'HADES', displayName: 'Revenue Optimizer',
    icon: TrendingUp, color: 'text-pink-400', bgColor: 'bg-pink-500/10', borderColor: 'border-pink-500/20',
    description: 'Upsell intelligence, cross-sell engine, pricing optimization',
  },
  {
    id: 'zeus', name: 'ZEUS', displayName: 'Analytics Mastermind',
    icon: BarChart3, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10', borderColor: 'border-cyan-500/20',
    description: 'Predictive analytics, cohort analysis, anomaly detection',
  },
];

const MOCK_KPIS = [
  { label: 'MRR', value: '€12,450', change: '+8.2%', icon: DollarSign, color: 'text-green-400' },
  { label: 'Utilisateurs actifs', value: '1,234', change: '+12%', icon: Users, color: 'text-blue-400' },
  { label: 'Taux de churn', value: '3.2%', change: '-0.5%', icon: AlertTriangle, color: 'text-amber-400' },
  { label: 'Score NPS', value: '72', change: '+5', icon: Activity, color: 'text-purple-400' },
];

export default function OrionPage() {
  const [agents] = useState(AGENTS.map(a => ({ ...a, status: 'PAUSED' as string, tasksLast24h: 0 })));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-purple-400" />
            ORION Command Center
          </h1>
          <p className="mt-2 text-zinc-400">
            Centre de commande IA - Orchestration des 6 agents intelligents
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-green-500/30 text-green-400 bg-green-500/10">
            <Activity className="w-3 h-3 mr-1" />
            Systeme operationnel
          </Badge>
          <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
            <RefreshCcw className="w-4 h-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {MOCK_KPIS.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} className="border-zinc-700 bg-zinc-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-400">{kpi.label}</p>
                    <p className="text-2xl font-bold text-white">{kpi.value}</p>
                    <p className={`text-xs mt-1 ${kpi.change.startsWith('+') || kpi.change.startsWith('-') && !kpi.change.includes('churn') ? 'text-green-400' : 'text-zinc-400'}`}>
                      {kpi.change} vs mois dernier
                    </p>
                  </div>
                  <div className="rounded-lg bg-zinc-700/50 p-3">
                    <Icon className={`h-5 w-5 ${kpi.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Agents Grid */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-400" />
          Agents IA
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {agents.map((agent) => {
            const Icon = agent.icon;
            const isActive = agent.status === 'ACTIVE';
            return (
              <Card key={agent.id} className={`border-zinc-700 bg-zinc-800 transition-all hover:border-zinc-600 ${isActive ? 'ring-1 ring-green-500/20' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-lg p-2.5 ${agent.bgColor} border ${agent.borderColor}`}>
                        <Icon className={`h-5 w-5 ${agent.color}`} />
                      </div>
                      <div>
                        <CardTitle className="text-white text-sm">{agent.name}</CardTitle>
                        <CardDescription className="text-zinc-400 text-xs">{agent.displayName}</CardDescription>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={isActive
                        ? 'border-green-500/30 text-green-400 bg-green-500/10'
                        : 'border-zinc-600 text-zinc-400 bg-zinc-700/50'
                      }
                    >
                      {isActive ? 'Actif' : 'En pause'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-xs text-zinc-500 mb-3">{agent.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-zinc-400">
                      <span>{agent.tasksLast24h} taches/24h</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-zinc-400 hover:text-white hover:bg-zinc-700">
                        {isActive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                      </Button>
                      <Link href={`/admin/orion/agents/${agent.id}`}>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-zinc-400 hover:text-white hover:bg-zinc-700">
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Quick Actions + Automation Queue */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* AI Recommendations */}
        <Card className="border-zinc-700 bg-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2 text-base">
              <Sparkles className="h-5 w-5 text-amber-400" />
              Recommandations IA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { text: '23 utilisateurs a risque de churn detectes', priority: 'high', action: 'Voir les alertes' },
              { text: '15 comptes prets pour un upsell Professional', priority: 'medium', action: 'Lancer campagne' },
              { text: "Taux d'onboarding en baisse de 5% cette semaine", priority: 'medium', action: 'Analyser' },
              { text: '3 campagnes email avec taux de clic > 15%', priority: 'low', action: 'Dupliquer' },
            ].map((rec, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-zinc-900/50 border border-zinc-700/50">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                  rec.priority === 'high' ? 'bg-red-400' : rec.priority === 'medium' ? 'bg-amber-400' : 'bg-green-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-300">{rec.text}</p>
                  <button className="text-xs text-purple-400 hover:text-purple-300 mt-1">{rec.action} →</button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Active Automations Queue */}
        <Card className="border-zinc-700 bg-zinc-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2 text-base">
              <Activity className="h-5 w-5 text-cyan-400" />
              File d&apos;automations actives
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: 'Welcome Sequence', agent: 'ATHENA', status: 'running', count: '12 en cours' },
              { name: 'Churn Prevention', agent: 'ARTEMIS', status: 'running', count: '5 en cours' },
              { name: 'Trial Ending Reminder', agent: 'HERMES', status: 'scheduled', count: '8 planifies' },
              { name: 'Upsell Professional', agent: 'HADES', status: 'paused', count: '0 en cours' },
            ].map((auto, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50 border border-zinc-700/50">
                <div>
                  <p className="text-sm font-medium text-zinc-300">{auto.name}</p>
                  <p className="text-xs text-zinc-500">{auto.agent} · {auto.count}</p>
                </div>
                <Badge variant="outline" className={
                  auto.status === 'running' ? 'border-green-500/30 text-green-400 bg-green-500/10' :
                  auto.status === 'scheduled' ? 'border-blue-500/30 text-blue-400 bg-blue-500/10' :
                  'border-zinc-600 text-zinc-400 bg-zinc-700/50'
                }>
                  {auto.status === 'running' ? 'En cours' : auto.status === 'scheduled' ? 'Planifie' : 'En pause'}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
