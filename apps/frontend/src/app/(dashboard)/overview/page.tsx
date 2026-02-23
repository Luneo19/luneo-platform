'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { useAuth } from '@/hooks/useAuth';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Button } from '@/components/ui/button';
import {
  Bot,
  MessageSquare,
  CheckCircle2,
  Star,
  TrendingUp,
  TrendingDown,
  Plus,
  BookOpen,
  Workflow,
  ArrowRight,
  Sparkles,
  Activity,
  Loader2,
  RefreshCw,
} from 'lucide-react';

interface OverviewStats {
  agentsActive: number;
  agentsTotal: number;
  conversationsTotal: number;
  conversationsThisPeriod: number;
  conversationsTrend: number;
  resolutionRate: number;
  avgSatisfaction: number;
}

interface RecentConversation {
  id: string;
  visitorName: string | null;
  visitorEmail: string | null;
  status: string;
  channelType: string;
  agent: { name: string };
  messageCount: number;
  createdAt: string;
}

function useOverviewStats(period: string) {
  return useQuery<OverviewStats>({
    queryKey: ['overview-stats', period],
    queryFn: async () => {
      try {
        const [agentsRes, analyticsRes] = await Promise.all([
          api.get('/api/v1/agents'),
          api.get(`/api/v1/agent-analytics/overview?period=${period}`),
        ]);
        const agentsRaw = agentsRes as Record<string, unknown> | unknown[];
        const agents = Array.isArray(agentsRaw) ? agentsRaw : ((agentsRaw as Record<string, unknown>)?.data as unknown[] ?? []);
        const analyticsRaw = analyticsRes as Record<string, unknown>;
        const analytics: Record<string, unknown> = (typeof analyticsRaw?.data === 'object' && analyticsRaw.data !== null
          ? analyticsRaw.data as Record<string, unknown>
          : analyticsRaw) ?? {};
        return {
          agentsActive: Array.isArray(agents) ? (agents as Array<{ status: string }>).filter((a) => a.status === 'ACTIVE').length : 0,
          agentsTotal: Array.isArray(agents) ? agents.length : 0,
          conversationsTotal: Number(analytics.totalConversations) || 0,
          conversationsThisPeriod: Number(analytics.conversationsThisPeriod) || 0,
          conversationsTrend: Number(analytics.conversationsTrend) || 0,
          resolutionRate: Number(analytics.resolutionRate) || 0,
          avgSatisfaction: Number(analytics.avgSatisfaction) || 0,
        };
      } catch {
        return {
          agentsActive: 0, agentsTotal: 0,
          conversationsTotal: 0, conversationsThisPeriod: 0, conversationsTrend: 0,
          resolutionRate: 0, avgSatisfaction: 0,
        };
      }
    },
    staleTime: 60_000,
  });
}

function useRecentConversations() {
  return useQuery<RecentConversation[]>({
    queryKey: ['recent-conversations'],
    queryFn: async () => {
      try {
        const res = await api.get('/api/v1/conversations?limit=5&sort=createdAt:desc') as Record<string, unknown> | unknown[];
        return (Array.isArray(res) ? res : (res as Record<string, unknown>)?.data ?? []) as RecentConversation[];
      } catch {
        return [];
      }
    },
    staleTime: 30_000,
  });
}

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  ESCALATED: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  RESOLVED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  CLOSED: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

function KPICard({
  label, value, subtitle, icon: Icon, trend, color,
}: {
  label: string;
  value: string;
  subtitle?: string;
  icon: typeof Bot;
  trend?: number;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition-all hover:border-white/[0.1] hover:bg-white/[0.04]">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-white/50">{label}</span>
        <div className={`rounded-lg p-2 ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="text-3xl font-bold text-white">{value}</div>
      <div className="mt-2 flex items-center gap-2">
        {trend !== undefined && trend !== 0 && (
          <>
            {trend > 0 ? (
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-red-400" />
            )}
            <span className={`text-xs font-medium ${trend > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
            </span>
          </>
        )}
        {subtitle && <span className="text-xs text-white/40">{subtitle}</span>}
      </div>
    </div>
  );
}

function OverviewContent() {
  const [period] = useState('30d');
  const { user } = useAuth();
  const { data: stats, isLoading, refetch } = useOverviewStats(period);
  const { data: conversations = [] } = useRecentConversations();

  const quickActions = [
    { label: 'Créer un agent', href: '/agents/new', icon: Plus, color: 'from-purple-600 to-pink-600' },
    { label: 'Voir les conversations', href: '/conversations', icon: MessageSquare, color: 'from-blue-600 to-cyan-600' },
    { label: 'Gérer le knowledge', href: '/knowledge', icon: BookOpen, color: 'from-amber-600 to-orange-600' },
    { label: 'Visual Builder', href: '/agents', icon: Workflow, color: 'from-emerald-600 to-teal-600' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Bonjour{user?.firstName ? `, ${user.firstName}` : ''} !
          </h1>
          <p className="mt-1 text-sm text-white/50">
            Voici un aperçu de vos agents IA et conversations
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="border-white/[0.06] text-white/70 hover:bg-white/[0.06]"
        >
          <RefreshCw className="mr-2 h-3.5 w-3.5" />
          Actualiser
        </Button>
      </div>

      {/* KPIs */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 animate-pulse">
              <div className="h-3 w-20 rounded bg-white/[0.06] mb-4" />
              <div className="h-8 w-24 rounded bg-white/[0.06] mb-2" />
              <div className="h-3 w-32 rounded bg-white/[0.04]" />
            </div>
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KPICard
            label="Agents actifs"
            value={`${stats.agentsActive}/${stats.agentsTotal}`}
            subtitle="agents déployés"
            icon={Bot}
            color="bg-purple-500/10 text-purple-400"
          />
          <KPICard
            label="Conversations"
            value={stats.conversationsThisPeriod.toLocaleString()}
            subtitle="ce mois"
            icon={MessageSquare}
            trend={stats.conversationsTrend}
            color="bg-blue-500/10 text-blue-400"
          />
          <KPICard
            label="Taux de résolution"
            value={`${Math.round(stats.resolutionRate * 100)}%`}
            subtitle="résolues automatiquement"
            icon={CheckCircle2}
            color="bg-emerald-500/10 text-emerald-400"
          />
          <KPICard
            label="Satisfaction"
            value={stats.avgSatisfaction > 0 ? `${stats.avgSatisfaction.toFixed(1)}/5` : '—'}
            subtitle="score moyen"
            icon={Star}
            color="bg-amber-500/10 text-amber-400"
          />
        </div>
      ) : null}

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-white">Actions rapides</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {quickActions.map((action) => (
            <Link key={action.label} href={action.href}>
              <div className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center transition-all hover:border-white/[0.12] hover:bg-white/[0.04]">
                <div className={`mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${action.color}`}>
                  <action.icon className="h-5 w-5 text-white" />
                </div>
                <p className="text-sm font-medium text-white group-hover:text-purple-300 transition-colors">
                  {action.label}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Content: Recent Conversations + Getting Started */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Recent Conversations */}
        <div className="xl:col-span-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-400" />
              Conversations récentes
            </h2>
            <Link href="/conversations" className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300">
              Tout voir <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {conversations.length === 0 ? (
            <div className="py-12 text-center">
              <MessageSquare className="mx-auto mb-3 h-10 w-10 text-white/20" />
              <p className="text-sm text-white/40">Aucune conversation pour le moment</p>
              <p className="mt-1 text-xs text-white/30">Les conversations apparaîtront ici une fois vos agents actifs</p>
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((conv) => (
                <Link key={conv.id} href={`/conversations/${conv.id}`}>
                  <div className="flex items-center justify-between rounded-lg bg-white/[0.02] border border-white/[0.04] px-4 py-3 transition-all hover:bg-white/[0.06]">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.06]">
                        <MessageSquare className="h-3.5 w-3.5 text-white/50" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">
                          {conv.visitorName || conv.visitorEmail || 'Visiteur anonyme'}
                        </p>
                        <p className="truncate text-xs text-white/40">
                          {conv.agent.name} · {conv.messageCount} messages
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${STATUS_COLOR[conv.status] ?? STATUS_COLOR.ACTIVE}`}>
                        {conv.status}
                      </span>
                      <span className="text-[10px] text-white/30">
                        {new Date(conv.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Getting Started / Suggestions */}
        <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 p-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-amber-400" />
            Pour bien démarrer
          </h2>
          <div className="space-y-3">
            <ChecklistItem
              done={(stats?.agentsTotal ?? 0) > 0}
              label="Créer votre premier agent IA"
              href="/agents/new"
            />
            <ChecklistItem
              done={false}
              label="Ajouter une base de connaissances"
              href="/knowledge"
            />
            <ChecklistItem
              done={(stats?.agentsActive ?? 0) > 0}
              label="Publier un agent"
              href="/agents"
            />
            <ChecklistItem
              done={(stats?.conversationsTotal ?? 0) > 0}
              label="Recevoir votre première conversation"
              href="/conversations"
            />
          </div>

          <div className="mt-6 rounded-lg border border-white/[0.06] bg-white/[0.03] p-4">
            <p className="text-xs font-medium text-white/60 mb-2">Besoin d'aide ?</p>
            <p className="text-xs text-white/40">
              Consultez notre documentation ou contactez le support pour démarrer rapidement.
            </p>
            <Link href="/help/documentation" className="mt-2 inline-flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300">
              Documentation <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChecklistItem({ done, label, href }: { done: boolean; label: string; href: string }) {
  return (
    <Link href={href}>
      <div className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all ${
        done ? 'bg-emerald-500/5 border border-emerald-500/10' : 'bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.06]'
      }`}>
        <CheckCircle2 className={`h-4 w-4 shrink-0 ${done ? 'text-emerald-400' : 'text-white/20'}`} />
        <span className={`text-sm ${done ? 'text-emerald-300 line-through' : 'text-white/70'}`}>
          {label}
        </span>
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  return (
    <ErrorBoundary level="page" componentName="DashboardOverview">
      <OverviewContent />
    </ErrorBoundary>
  );
}
