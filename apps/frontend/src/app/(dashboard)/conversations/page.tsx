'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api/client';
import { normalizeListResponse } from '@/lib/api/normalize';
import { Button } from '@/components/ui/button';
import {
  Search,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  RefreshCw,
  Inbox,
} from 'lucide-react';

type ConversationStatus = 'ACTIVE' | 'RESOLVED' | 'ESCALATED' | 'CLOSED' | 'SPAM';

interface Conversation {
  id: string;
  agent: { id: string; name: string };
  channelType: string;
  visitorName: string;
  visitorEmail?: string;
  status: ConversationStatus;
  messageCount: number;
  satisfactionRating: number | null;
  lastMessage?: {
    role: string;
    content: string;
    createdAt: string;
  };
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

const STATUS_CONFIG: Record<ConversationStatus, { label: string; icon: typeof MessageSquare; color: string; bg: string }> = {
  ACTIVE: { label: 'Actif', icon: MessageSquare, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  ESCALATED: { label: 'Escaladé', icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  RESOLVED: { label: 'Résolu', icon: CheckCircle2, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  CLOSED: { label: 'Fermé', icon: Clock, color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/20' },
  SPAM: { label: 'Spam', icon: Clock, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
};

type FilterValue = 'ALL' | 'ACTIVE' | 'ESCALATED' | 'RESOLVED';

const FILTER_TABS: { value: FilterValue; label: string }[] = [
  { value: 'ALL', label: 'Toutes' },
  { value: 'ACTIVE', label: 'Actives' },
  { value: 'ESCALATED', label: 'Escaladées' },
  { value: 'RESOLVED', label: 'Résolues' },
];

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'À l\'instant';
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}j`;
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterValue>('ALL');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filter !== 'ALL') params.set('status', filter);
      if (search) params.set('search', search);
      const res = await api.get(
        `/api/v1/conversations?${params.toString()}`
      );
      setConversations(normalizeListResponse<Conversation>(res));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger les conversations');
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const selected = conversations.find((c) => c.id === selectedId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Conversations</h1>
          <p className="mt-1 text-sm text-white/50">
            Suivez les échanges entre vos agents et vos visiteurs
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchConversations}
          className="border-white/[0.06] bg-white/[0.03] text-white hover:bg-white/[0.06]"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Actualiser
        </Button>
      </div>

      {/* Filters + Search */}
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
            placeholder="Rechercher..."
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
          <button onClick={fetchConversations} className="mt-2 text-sm text-red-300 underline hover:text-red-200">
            Réessayer
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-white/[0.06]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 rounded bg-white/[0.06]" />
                  <div className="h-3 w-64 rounded bg-white/[0.04]" />
                </div>
                <div className="h-3 w-12 rounded bg-white/[0.04]" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && conversations.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02] py-20">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-white/[0.06]">
            <Inbox className="h-8 w-8 text-blue-400" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-white">Aucune conversation</h3>
          <p className="max-w-sm text-center text-sm text-white/40">
            {search
              ? 'Aucun résultat pour cette recherche'
              : 'Les conversations apparaîtront ici quand vos agents commenceront à échanger avec vos visiteurs'}
          </p>
        </div>
      )}

      {/* Conversations inbox */}
      {!loading && conversations.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* List */}
          <div className="lg:col-span-2 space-y-1.5 max-h-[calc(100vh-300px)] overflow-y-auto dash-scroll rounded-2xl border border-white/[0.06] bg-white/[0.02] p-2">
            {conversations.map((conv) => {
              const statusCfg = STATUS_CONFIG[conv.status] ?? STATUS_CONFIG.ACTIVE;
              const StatusIcon = statusCfg.icon;
              const isSelected = conv.id === selectedId;

              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedId(conv.id)}
                  className={`w-full rounded-xl p-3.5 text-left transition-all ${
                    isSelected
                      ? 'bg-white/[0.08] border border-purple-500/20'
                      : 'border border-transparent hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/[0.06]">
                      <span className="text-xs font-bold text-white/60">
                        {(conv.visitorName || 'V')[0].toUpperCase()}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium text-white">
                          {conv.visitorName || conv.visitorEmail || 'Visiteur'}
                        </span>
                        <span className="flex-shrink-0 text-xs text-white/30">
                          {timeAgo(conv.updatedAt)}
                        </span>
                      </div>

                      {conv.lastMessage && (
                        <p className="mt-0.5 truncate text-xs text-white/40">
                          {conv.lastMessage.content}
                        </p>
                      )}

                      <div className="mt-1.5 flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusCfg.bg} ${statusCfg.color}`}>
                          <StatusIcon className="h-2.5 w-2.5" />
                          {statusCfg.label}
                        </span>
                        <span className="text-[10px] text-white/25">
                          {conv.agent.name}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detail panel */}
          <div className="lg:col-span-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
            {selected ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      {selected.visitorName || selected.visitorEmail || 'Visiteur'}
                    </h2>
                    {selected.visitorEmail && (
                      <p className="mt-0.5 text-sm text-white/40">{selected.visitorEmail}</p>
                    )}
                  </div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${STATUS_CONFIG[selected.status]?.bg} ${STATUS_CONFIG[selected.status]?.color}`}>
                    {STATUS_CONFIG[selected.status]?.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <InfoCard label="Messages" value={String(selected.messageCount)} />
                  <InfoCard label="Agent" value={selected.agent.name} />
                  <InfoCard label="Canal" value={selected.channelType} />
                  <InfoCard
                    label="Satisfaction"
                    value={selected.satisfactionRating ? `${selected.satisfactionRating}/5` : '—'}
                  />
                </div>

                {selected.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selected.tags.map((tag) => (
                      <span key={tag} className="rounded-md bg-white/[0.04] px-2 py-0.5 text-xs text-white/30">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {selected.lastMessage && (
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.04] p-4">
                    <p className="text-xs font-medium text-white/40 mb-1">Dernier message</p>
                    <p className="text-sm text-white/70">{selected.lastMessage.content}</p>
                    <p className="mt-2 text-xs text-white/25">
                      {new Date(selected.lastMessage.createdAt).toLocaleString('fr-FR')}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-white/[0.04] pt-4">
                  <span className="text-xs text-white/30">
                    Créé le {new Date(selected.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                  <Button
                    size="sm"
                    onClick={() => window.open(`/conversations/${selected.id}`, '_self')}
                    className="bg-white/[0.06] text-white hover:bg-white/[0.12] border border-white/[0.06] text-xs"
                  >
                    Voir la conversation complète
                    <ChevronRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center py-16">
                <MessageSquare className="mb-3 h-10 w-10 text-white/10" />
                <p className="text-sm text-white/30">
                  Sélectionnez une conversation pour voir les détails
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/[0.03] border border-white/[0.04] px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-white/30">{label}</p>
      <p className="mt-0.5 truncate text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
