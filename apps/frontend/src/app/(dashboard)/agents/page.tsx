'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api/client';
import { normalizeListResponse } from '@/lib/api/normalize';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Plus,
  Bot,
  MessageSquare,
  Star,
  Search,
  MoreVertical,
  Pause,
  Play,
  Pencil,
  Trash2,
} from 'lucide-react';

type AgentStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED';

interface Agent {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  status: AgentStatus;
  template?: { id: string; name: string; category?: string };
  stats?: {
    totalConversations: number;
    totalMessages: number;
    avgSatisfaction: number;
    resolutionRate: number;
  };
  createdAt: string;
  lastActiveAt?: string;
}

const STATUS_CONFIG: Record<AgentStatus, { label: string; color: string; bg: string }> = {
  ACTIVE: { label: 'Actif', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  DRAFT: { label: 'Brouillon', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  PAUSED: { label: 'En pause', color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/20' },
  ARCHIVED: { label: 'Archivé', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
};

const FILTER_TABS: { value: AgentStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Tous' },
  { value: 'ACTIVE', label: 'Actifs' },
  { value: 'DRAFT', label: 'Brouillons' },
  { value: 'PAUSED', label: 'En pause' },
];

export default function AgentsPage() {
  const { user } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<AgentStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');

  const fetchAgents = useCallback(async () => {
    if (user?.role === 'ADMIN' || user?.role === 'PLATFORM_ADMIN') {
      setAgents([]);
      setError('Le module Agents est lié aux organisations clientes et n’est pas disponible pour ce profil admin.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filter !== 'ALL') params.set('status', filter);
      const res = await api.get(
        `/api/v1/agents?${params.toString()}`
      );
      setAgents(normalizeListResponse<Agent>(res));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Impossible de charger les agents';
      setError(message.includes('organisation') ? 'Aucune organisation active. Finalisez l’onboarding pour créer des agents.' : message);
    } finally {
      setLoading(false);
    }
  }, [filter, user?.role]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const filteredAgents = agents.filter((a) =>
    search ? a.name.toLowerCase().includes(search.toLowerCase()) : true
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Agents IA</h1>
          <p className="mt-1 text-sm text-white/50">
            Gérez vos agents conversationnels intelligents
          </p>
        </div>
        <Link href="/agents/new">
          <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border-0">
            <Plus className="mr-2 h-4 w-4" />
            Créer un agent
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-xl bg-white/[0.03] border border-white/[0.06] p-1">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                filter === tab.value
                  ? 'bg-white/[0.1] text-white shadow-sm'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Rechercher un agent..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
          <p className="text-sm text-red-400">{error}</p>
          <button onClick={fetchAgents} className="mt-2 text-sm text-red-300 underline hover:text-red-200">
            Réessayer
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-white/[0.06]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 rounded bg-white/[0.06]" />
                  <div className="h-3 w-48 rounded bg-white/[0.04]" />
                </div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="h-12 rounded-lg bg-white/[0.04]" />
                <div className="h-12 rounded-lg bg-white/[0.04]" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filteredAgents.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02] py-20">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/[0.06]">
            <Bot className="h-8 w-8 text-purple-400" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-white">
            {search ? 'Aucun agent trouvé' : 'Créez votre premier agent IA'}
          </h3>
          <p className="mb-6 max-w-sm text-center text-sm text-white/40">
            {search
              ? 'Essayez avec un autre terme de recherche'
              : 'Déployez un agent conversationnel intelligent pour assister vos clients 24/7'}
          </p>
          {!search && (
            <Link href="/agents/new">
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border-0">
                <Plus className="mr-2 h-4 w-4" />
                Créer un agent
              </Button>
            </Link>
          )}
        </div>
      )}

      {/* Agent grid */}
      {!loading && filteredAgents.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredAgents.map((agent) => {
            const statusCfg = STATUS_CONFIG[agent.status] ?? STATUS_CONFIG.DRAFT;
            const totalConversations = agent.stats?.totalConversations ?? 0;
            const avgSatisfaction = agent.stats?.avgSatisfaction ?? 0;
            const resolutionRate = agent.stats?.resolutionRate ?? 0;
            return (
              <Link key={agent.id} href={`/agents/${agent.id}`}>
                <div className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition-all hover:border-white/[0.12] hover:bg-white/[0.04]">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/[0.06] text-xl">
                        {agent.template?.category === 'SUPPORT' ? '🎧' :
                         agent.template?.category === 'SALES' ? '💰' :
                         agent.template?.category === 'ONBOARDING' ? '👋' : '🤖'}
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-semibold text-white group-hover:text-purple-300 transition-colors">
                          {agent.name}
                        </h3>
                        <p className="mt-0.5 truncate text-xs text-white/40">
                          {agent.template?.name ?? 'Agent personnalisé'}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusCfg.bg} ${statusCfg.color}`}>
                      {statusCfg.label}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-white/[0.03] border border-white/[0.04] px-3 py-2.5">
                      <div className="flex items-center gap-1.5 text-white/40">
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span className="text-xs">Conversations</span>
                      </div>
                      <p className="mt-1 text-lg font-bold text-white">
                        {totalConversations.toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-lg bg-white/[0.03] border border-white/[0.04] px-3 py-2.5">
                      <div className="flex items-center gap-1.5 text-white/40">
                        <Star className="h-3.5 w-3.5" />
                        <span className="text-xs">Satisfaction</span>
                      </div>
                      <p className="mt-1 text-lg font-bold text-white">
                        {avgSatisfaction > 0
                          ? `${avgSatisfaction.toFixed(1)}/5`
                          : '—'}
                      </p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-4 flex items-center justify-between border-t border-white/[0.04] pt-3">
                    <span className="text-xs text-white/30">
                      {agent.lastActiveAt
                        ? `Actif ${new Date(agent.lastActiveAt).toLocaleDateString('fr-FR')}`
                        : `Créé ${new Date(agent.createdAt).toLocaleDateString('fr-FR')}`}
                    </span>
                    <span className="text-xs text-white/20">
                      {Math.round(resolutionRate * 100)}% résolu
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
