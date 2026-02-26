'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import {
  MessageSquare,
  Bot,
  Zap,
  TrendingUp,
  ArrowUpRight,
  CreditCard,
  FileText,
  HardDrive,
} from 'lucide-react';

interface UsageData {
  period: { start: string; end: string };
  messagesAi: { used: number; limit: number; percentage: number };
  conversations: { used: number; limit: number; percentage: number };
  documentsIndexed: { used: number; limit: number };
  agents: { used: number; limit: number };
  storageBytes: { used: number; limit: number };
  costs: {
    subscription: number;
    overage: number;
    addons: number;
    total: number;
    currency: string;
  };
  forecast: { endOfMonth: number; overageExpected: number };
}

function formatCents(cents: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

function formatStorageBytes(bytes: number): string {
  if (bytes === 0) return '0 o';
  const units = ['o', 'Ko', 'Mo', 'Go', 'To'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export default function BillingUsagePage() {
  const { user } = useAuth();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const orgId = (user as any)?.organizationId ?? (user as any)?.brandId ?? '';
      if (!orgId) {
        throw new Error('Organisation introuvable pour cet utilisateur.');
      }
      const [usageRes] = await Promise.all([
        api.get<{ data: UsageData }>(`/api/v1/organizations/${orgId}/usage`),
      ]);
      setUsage(usageRes.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger les données d\'usage');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchUsage();
  }, [user, fetchUsage]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Usage & Consommation</h1>
          <p className="mt-1 text-sm text-white/50">
            {usage
              ? `Période : ${new Date(usage.period.start).toLocaleDateString('fr-FR')} – ${new Date(usage.period.end).toLocaleDateString('fr-FR')}`
              : 'Suivi de votre consommation mensuelle'}
          </p>
        </div>
        <Link href="/billing">
          <Button
            variant="outline"
            className="border-white/[0.06] bg-white/[0.03] text-white hover:bg-white/[0.06]"
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Facturation
          </Button>
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
          <p className="text-sm text-red-400">{error}</p>
          <button onClick={fetchUsage} className="mt-2 text-sm text-red-300 underline hover:text-red-200">
            Réessayer
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 animate-pulse">
            <div className="h-6 w-40 rounded bg-white/[0.06]" />
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 rounded-lg bg-white/[0.04]" />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 rounded-2xl border border-white/[0.06] bg-white/[0.02] animate-pulse" />
            ))}
          </div>
        </div>
      )}

      {usage && !loading && (
        <>
          {/* Cost summary */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <CostCard
              icon={CreditCard}
              label="Abonnement"
              value={formatCents(usage.costs.subscription, usage.costs.currency)}
              color="from-purple-500/20 to-pink-500/20"
            />
            <CostCard
              icon={TrendingUp}
              label="Dépassement"
              value={formatCents(usage.costs.overage, usage.costs.currency)}
              color="from-amber-500/20 to-orange-500/20"
              highlight={usage.costs.overage > 0}
            />
            <CostCard
              icon={Zap}
              label="Add-ons"
              value={formatCents(usage.costs.addons, usage.costs.currency)}
              color="from-blue-500/20 to-cyan-500/20"
            />
            <CostCard
              icon={ArrowUpRight}
              label="Total ce mois"
              value={formatCents(usage.costs.total, usage.costs.currency)}
              color="from-emerald-500/20 to-teal-500/20"
              bold
            />
          </div>

          {/* Usage bars */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
            <h2 className="mb-5 text-lg font-semibold text-white">Consommation</h2>
            <div className="space-y-6">
              <UsageBar
                icon={Zap}
                label="Messages IA"
                used={usage.messagesAi.used}
                limit={usage.messagesAi.limit}
                color="bg-purple-500"
              />
              <UsageBar
                icon={MessageSquare}
                label="Conversations"
                used={usage.conversations.used}
                limit={usage.conversations.limit}
                color="bg-pink-500"
              />
              <UsageBar
                icon={FileText}
                label="Documents indexés"
                used={usage.documentsIndexed.used}
                limit={usage.documentsIndexed.limit}
                color="bg-blue-500"
              />
              <UsageBar
                icon={Bot}
                label="Agents actifs"
                used={usage.agents.used}
                limit={usage.agents.limit}
                color="bg-cyan-500"
              />
              <UsageBar
                icon={HardDrive}
                label="Stockage"
                used={usage.storageBytes.used}
                limit={usage.storageBytes.limit}
                color="bg-emerald-500"
                formatValue={formatStorageBytes}
              />
            </div>
          </div>

          {/* Forecast */}
          {usage.forecast.endOfMonth > 0 && (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
              <h2 className="mb-3 text-lg font-semibold text-white">Prévision fin de mois</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.04] p-4">
                  <p className="text-xs uppercase tracking-wider text-white/30">Total estimé</p>
                  <p className="mt-1 text-2xl font-bold text-white">
                    {formatCents(usage.forecast.endOfMonth, usage.costs.currency)}
                  </p>
                </div>
                {usage.forecast.overageExpected > 0 && (
                  <div className="rounded-xl bg-amber-500/5 border border-amber-500/10 p-4">
                    <p className="text-xs uppercase tracking-wider text-amber-400/60">Dépassement estimé</p>
                    <p className="mt-1 text-2xl font-bold text-amber-400">
                      {formatCents(usage.forecast.overageExpected, usage.costs.currency)}
                    </p>
                    <Link href="/billing" className="mt-2 inline-block text-xs text-amber-300 underline hover:text-amber-200">
                      Passer au plan supérieur
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CostCard({
  icon: Icon,
  label,
  value,
  color,
  bold,
  highlight,
}: {
  icon: typeof CreditCard;
  label: string;
  value: string;
  color: string;
  bold?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-2xl border ${highlight ? 'border-amber-500/20' : 'border-white/[0.06]'} bg-white/[0.02] p-5`}>
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${color} border border-white/[0.06]`}>
          <Icon className="h-5 w-5 text-white/70" />
        </div>
        <div>
          <p className="text-xs text-white/40">{label}</p>
          <p className={`${bold ? 'text-xl font-bold' : 'text-lg font-semibold'} text-white`}>
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function UsageBar({
  icon: Icon,
  label,
  used,
  limit,
  color,
  formatValue,
}: {
  icon: typeof MessageSquare;
  label: string;
  used: number;
  limit: number;
  color: string;
  formatValue?: (v: number) => string;
}) {
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const isNearLimit = pct >= 80;
  const fmt = formatValue ?? ((v: number) => v.toLocaleString());

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-white/40" />
          <span className="text-sm font-medium text-white">{label}</span>
        </div>
        <span className={`text-sm font-semibold ${isNearLimit ? 'text-amber-400' : 'text-white/60'}`}>
          {fmt(used)} / {fmt(limit)}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className={`h-full rounded-full transition-all duration-500 ${isNearLimit ? 'bg-amber-500' : color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {isNearLimit && (
        <p className="mt-1 text-xs text-amber-400/70">
          {pct >= 100 ? 'Limite atteinte' : `${Math.round(pct)}% utilisé`}
        </p>
      )}
    </div>
  );
}
