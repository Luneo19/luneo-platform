'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { UsageOverview, type UsageMetric } from '@/components/dashboard/UsageGauge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowUpRight,
  CreditCard,
  Loader2,
  Package,
  Palette,
  Box,
  Cpu,
  HardDrive,
  Users,
  Globe,
  Zap,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import { api } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface SubscriptionData {
  plan?: string;
  planName?: string;
  status?: string;
  trialEndsAt?: string;
  currentPeriodEnd?: string;
  usage?: {
    designs?: number;
    renders2D?: number;
    renders3D?: number;
    aiGenerations?: number;
    storageGB?: number;
    apiCalls?: number;
    teamMembers?: number;
    aiTokens?: number;
  };
  limits?: {
    designsPerMonth?: number;
    renders2DPerMonth?: number;
    renders3DPerMonth?: number;
    aiGenerationsPerMonth?: number;
    storageGB?: number;
    apiCallsPerMonth?: number;
    teamMembers?: number;
    aiTokensPerMonth?: number;
  };
  commissionPercent?: number;
}

interface BillingOverviewData {
  rateLimits?: {
    api?: {
      requestsPerMinute?: number;
      burst?: number;
    };
  };
  source?: {
    mode?: string;
    lastSyncedAt?: string;
  };
}

function UsagePageContent() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [overview, setOverview] = useState<BillingOverviewData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSubscription() {
      try {
        const [subscriptionRes, overviewRes] = await Promise.all([
          api.get<SubscriptionData>('/api/v1/billing/subscription'),
          api.get<BillingOverviewData>('/api/v1/billing/overview'),
        ]);
        const subscriptionResult = (subscriptionRes as { data?: SubscriptionData })?.data ?? subscriptionRes;
        const overviewResult = (overviewRes as { data?: BillingOverviewData })?.data ?? overviewRes;
        setData(subscriptionResult);
        setOverview(overviewResult);
        logger.info('Subscription data loaded for usage page');
      } catch (err) {
        logger.error('Failed to load subscription data', { error: err });
        setError('Impossible de charger les données d\'utilisation');
      } finally {
        setLoading(false);
      }
    }
    loadSubscription();
  }, []);

  const metrics: UsageMetric[] = useMemo(() => {
    if (!data?.usage || !data?.limits) return [];

    const u = data.usage;
    const l = data.limits;

    return [
      {
        label: 'Designs créés',
        used: u.designs ?? 0,
        limit: l.designsPerMonth ?? 5,
        icon: <Palette className="w-4 h-4 text-purple-400" />,
      },
      {
        label: 'Générations IA',
        used: u.aiGenerations ?? 0,
        limit: l.aiGenerationsPerMonth ?? 3,
        icon: <Cpu className="w-4 h-4 text-blue-400" />,
      },
      {
        label: 'Rendus 2D',
        used: u.renders2D ?? 0,
        limit: l.renders2DPerMonth ?? 10,
        icon: <Palette className="w-4 h-4 text-emerald-400" />,
      },
      {
        label: 'Rendus 3D',
        used: u.renders3D ?? 0,
        limit: l.renders3DPerMonth ?? 0,
        icon: <Box className="w-4 h-4 text-amber-400" />,
      },
      {
        label: 'Stockage',
        used: u.storageGB ?? 0,
        limit: l.storageGB ?? 0.5,
        unit: 'GB',
        icon: <HardDrive className="w-4 h-4 text-cyan-400" />,
      },
      {
        label: 'Appels API',
        used: u.apiCalls ?? 0,
        limit: l.apiCallsPerMonth ?? 0,
        icon: <Globe className="w-4 h-4 text-indigo-400" />,
      },
      {
        label: 'Membres équipe',
        used: u.teamMembers ?? 0,
        limit: l.teamMembers ?? 1,
        icon: <Users className="w-4 h-4 text-pink-400" />,
      },
      {
        label: 'Tokens IA agents',
        used: u.aiTokens ?? 0,
        limit: l.aiTokensPerMonth ?? 50000,
        icon: <Zap className="w-4 h-4 text-yellow-400" />,
      },
    ].filter((m) => m.limit !== 0 || m.used > 0); // Hide metrics with 0 limit and 0 usage
  }, [data]);

  const renewalDate = useMemo(() => {
    if (!data?.currentPeriodEnd) return undefined;
    try {
      return new Date(data.currentPeriodEnd).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return undefined;
    }
  }, [data]);

  const warningMetrics = useMemo(() => {
    return metrics.filter((m) => {
      if (m.limit < 0) return false;
      return (m.used / Math.max(m.limit, 1)) * 100 >= 80;
    });
  }, [metrics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert className="border-red-500/20 bg-red-900/10">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <AlertDescription className="text-red-300">{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Plan & Utilisation</h1>
        <p className="text-gray-400 text-sm mt-1">
          Suivez votre consommation et gérez votre plan en temps réel
        </p>
      </div>

      {/* Warnings */}
      {warningMetrics.length > 0 && (
        <Alert className="border-amber-500/20 bg-amber-900/10">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <AlertDescription className="text-amber-300">
            <strong>{warningMetrics.length} limite{warningMetrics.length > 1 ? 's' : ''}</strong> proche{warningMetrics.length > 1 ? 's' : ''} du maximum :{' '}
            {warningMetrics.map((m) => m.label).join(', ')}.
            Pensez a upgrader votre plan ou acheter des add-ons.
          </AlertDescription>
        </Alert>
      )}

      {/* Plan info + Usage gauges */}
      <UsageOverview
        metrics={metrics}
        planName={data?.planName || data?.plan || 'Free'}
        renewalDate={renewalDate}
      />

      {/* Commission info */}
      {data?.commissionPercent !== undefined && (
        <Card className="bg-dark-card border-white/[0.06]">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-sm text-white font-medium">Commission sur ventes</p>
                <p className="text-xs text-gray-500">Prelevee sur chaque commande client</p>
              </div>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-1 bg-emerald-900/20 border-emerald-500/30 text-emerald-300">
              {data.commissionPercent}%
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link href="/billing">
          <Button variant="outline" className="w-full justify-start gap-2 bg-white/[0.02] border-white/[0.08] text-gray-300 hover:text-white hover:bg-white/[0.05]">
            <CreditCard className="w-4 h-4" />
            Facturation
          </Button>
        </Link>
        <Link href="/billing/addons">
          <Button variant="outline" className="w-full justify-start gap-2 bg-white/[0.02] border-white/[0.08] text-gray-300 hover:text-white hover:bg-white/[0.05]">
            <Package className="w-4 h-4" />
            Acheter des add-ons
          </Button>
        </Link>
        <Link href="/plans">
          <Button className="w-full justify-start gap-2 bg-purple-600 hover:bg-purple-700 text-white">
            <ArrowUpRight className="w-4 h-4" />
            Upgrader le plan
          </Button>
        </Link>
      </div>

      {/* Rate-limit visibility */}
      <Card className="bg-dark-card border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-white">Rate limits API</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm text-gray-300">
          <p>
            Limite/minute: <span className="text-white font-medium">{overview?.rateLimits?.api?.requestsPerMinute ?? 0}</span>
          </p>
          <p>
            Burst: <span className="text-white font-medium">{overview?.rateLimits?.api?.burst ?? 0}</span>
          </p>
          <p>
            Source d&apos;usage: <span className="text-white font-medium">{overview?.source?.mode ?? 'hybrid'}</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function UsagePage() {
  return (
    <ErrorBoundary componentName="UsagePage">
      <UsagePageContent />
    </ErrorBoundary>
  );
}
