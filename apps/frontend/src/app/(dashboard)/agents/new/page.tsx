'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api/client';
import { normalizeListResponse } from '@/lib/api/normalize';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Search,
  Sparkles,
  Star,
  Users,
  Zap,
} from 'lucide-react';

type TemplateCategory = 'SUPPORT' | 'SALES' | 'ONBOARDING' | 'REVIEWS' | 'CONTENT' | 'ANALYTICS' | 'EMAIL' | 'CUSTOM';

interface AgentTemplate {
  id: string;
  slug: string;
  name: string;
  description: string;
  longDescription?: string;
  category: TemplateCategory;
  icon: string;
  color: string;
  capabilities: string[];
  requiredPlan: string;
  isFeatured: boolean;
  usageCount: number;
  avgRating: number;
}

const CATEGORY_CONFIG: Record<TemplateCategory, { label: string; color: string }> = {
  SUPPORT: { label: 'Support', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  SALES: { label: 'Ventes', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  ONBOARDING: { label: 'Onboarding', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  REVIEWS: { label: 'Avis', color: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
  CONTENT: { label: 'Contenu', color: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  ANALYTICS: { label: 'Analytics', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  EMAIL: { label: 'Email', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  CUSTOM: { label: 'Personnalisé', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
};

const CATEGORY_FILTERS: { value: TemplateCategory | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Tous' },
  { value: 'SUPPORT', label: 'Support' },
  { value: 'SALES', label: 'Ventes' },
  { value: 'ONBOARDING', label: 'Onboarding' },
  { value: 'CONTENT', label: 'Contenu' },
];

export default function AgentNewPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [templates, setTemplates] = useState<AgentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<TemplateCategory | 'ALL'>('ALL');
  const [search, setSearch] = useState('');

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== 'ALL') params.set('category', categoryFilter);
      const res = await api.get(
        `/api/v1/agent-templates?${params.toString()}`
      );
      setTemplates(normalizeListResponse<AgentTemplate>(res));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger les templates');
    } finally {
      setLoading(false);
    }
  }, [categoryFilter]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const filteredTemplates = templates.filter((t) =>
    search ? t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase()) : true
  );

  const featured = filteredTemplates.filter((t) => t.isFeatured);
  const others = filteredTemplates.filter((t) => !t.isFeatured);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/agents"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux agents
        </Link>
        <h1 className="text-3xl font-bold text-white">Créer un agent</h1>
        <p className="mt-1 text-sm text-white/50">
          Choisissez un template ou partez de zéro
        </p>
      </div>

      {/* Start from scratch */}
      <button
        onClick={() => router.push('/agents/create')}
        className="group w-full rounded-2xl border-2 border-dashed border-white/[0.08] bg-white/[0.02] p-6 text-left transition-all hover:border-purple-500/30 hover:bg-white/[0.04]"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/[0.06]">
            <Zap className="h-7 w-7 text-purple-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white group-hover:text-purple-300 transition-colors">
              Partir de zéro
            </h3>
            <p className="mt-0.5 text-sm text-white/40">
              Configurez chaque aspect de votre agent manuellement
            </p>
          </div>
        </div>
      </button>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-xl bg-white/[0.03] border border-white/[0.06] p-1">
          {CATEGORY_FILTERS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setCategoryFilter(tab.value)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                categoryFilter === tab.value
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
            placeholder="Rechercher un template..."
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
          <button onClick={fetchTemplates} className="mt-2 text-sm text-red-300 underline hover:text-red-200">
            Réessayer
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-white/[0.06]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-28 rounded bg-white/[0.06]" />
                  <div className="h-3 w-full rounded bg-white/[0.04]" />
                  <div className="h-3 w-3/4 rounded bg-white/[0.04]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Featured templates */}
      {!loading && featured.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white/60">
            <Sparkles className="h-4 w-4 text-amber-400" />
            Populaires
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {featured.map((tpl) => (
              <TemplateCard key={tpl.id} template={tpl} />
            ))}
          </div>
        </div>
      )}

      {/* Other templates */}
      {!loading && others.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/60">
            Tous les templates
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {others.map((tpl) => (
              <TemplateCard key={tpl.id} template={tpl} />
            ))}
          </div>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && filteredTemplates.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02] py-16">
          <p className="text-sm text-white/40">Aucun template trouvé</p>
        </div>
      )}
    </div>
  );
}

function TemplateCard({ template }: { template: AgentTemplate }) {
  const router = useRouter();
  const catCfg = CATEGORY_CONFIG[template.category] ?? CATEGORY_CONFIG.CUSTOM;

  return (
    <div className="group flex flex-col rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition-all hover:border-white/[0.12] hover:bg-white/[0.04]">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.06] text-2xl"
          style={{ backgroundColor: `${template.color}15` }}
        >
          {template.icon}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold text-white group-hover:text-purple-300 transition-colors">
            {template.name}
          </h3>
          <span className={`mt-1 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${catCfg.color}`}>
            {catCfg.label}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="mt-3 flex-1 text-sm leading-relaxed text-white/40 line-clamp-2">
        {template.description}
      </p>

      {/* Capabilities */}
      {template.capabilities.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {template.capabilities.slice(0, 3).map((cap) => (
            <span
              key={cap}
              className="rounded-md bg-white/[0.04] px-2 py-0.5 text-xs text-white/30"
            >
              {cap}
            </span>
          ))}
          {template.capabilities.length > 3 && (
            <span className="rounded-md bg-white/[0.04] px-2 py-0.5 text-xs text-white/30">
              +{template.capabilities.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-white/[0.04] pt-4">
        <div className="flex items-center gap-3 text-xs text-white/30">
          {template.avgRating > 0 && (
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 text-amber-400" />
              {template.avgRating.toFixed(1)}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {template.usageCount.toLocaleString()}
          </span>
        </div>
        <Button
          size="sm"
          onClick={() => router.push(`/agents/create?templateId=${template.slug}`)}
          className="bg-white/[0.06] text-white hover:bg-white/[0.12] border border-white/[0.06] text-xs"
        >
          Utiliser
        </Button>
      </div>
    </div>
  );
}
