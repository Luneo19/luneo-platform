/**
 * ★★★ META ADS PAGE ★★★
 * Page pour gérer les campagnes Meta Ads
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KPICard } from '@/components/admin/widgets/kpi-card';
import { DollarSign, TrendingUp, MousePointerClick, Target, RefreshCw } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { logger } from '@/lib/logger';
import Link from 'next/link';
import type { MetaInsights } from '@/lib/admin/integrations/meta-ads';

const API_BASE = '/api/admin/ads/meta';

async function fetchMetaApi<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  const url = params
    ? `${API_BASE}${endpoint}?${new URLSearchParams(params).toString()}`
    : `${API_BASE}${endpoint}`;
  const response = await fetch(url, { credentials: 'include' });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || `API error: ${response.status}`);
  }
  return response.json();
}

interface StatusResponse {
  connected: boolean;
  accountId?: string;
  accountName?: string;
}

interface InsightsResponse {
  insights: MetaInsights;
}

const defaultInsights: MetaInsights = {
  impressions: 0,
  clicks: 0,
  spend: 0,
  cpc: 0,
  cpm: 0,
  ctr: 0,
  reach: 0,
  frequency: 0,
  conversions: 0,
  costPerConversion: 0,
  conversionRate: 0,
  roas: 0,
};

export default function MetaAdsPage() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [accountName, setAccountName] = useState<string | null>(null);
  const [insights, setInsights] = useState<MetaInsights>(defaultInsights);
  const [isLoadingConnect, setIsLoadingConnect] = useState(false);
  const [isLoadingInsights, setIsLoadingInsights] = useState(true);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [period, setPeriod] = useState<number>(30);

  const loadStatus = useCallback(async () => {
    try {
      const data = await fetchMetaApi<StatusResponse>('/status');
      setIsConnected(data.connected);
      setAccountId(data.accountId ?? null);
      setAccountName(data.accountName ?? null);
      return data;
    } catch (error) {
      logger.error('Error fetching Meta Ads status:', error);
      setIsConnected(false);
      setAccountId(null);
      setAccountName(null);
      return { connected: false };
    }
  }, []);

  const loadInsights = useCallback(async (account: string, days: number) => {
    setInsightsError(null);
    setIsLoadingInsights(true);
    try {
      const data = await fetchMetaApi<InsightsResponse>('/insights', {
        accountId: account,
        days: String(days),
      });
      setInsights(data.insights);
    } catch (error) {
      logger.error('Error fetching Meta Ads insights:', error);
      setInsightsError(error instanceof Error ? error.message : 'Failed to load insights');
      setInsights(defaultInsights);
    } finally {
      setIsLoadingInsights(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const connectedParam = params.get('connected');
    const errorParam = params.get('error');
    if (connectedParam === 'true') {
      loadStatus().then((status) => {
        if (status.connected && status.accountId) {
          loadInsights(status.accountId, period);
        }
      });
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
    if (errorParam === 'connection_failed') {
      setConnectError('La connexion a échoué. Veuillez réessayer.');
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [loadStatus, loadInsights, period]);

  useEffect(() => {
    if (isConnected && accountId) {
      loadInsights(accountId, period);
    } else {
      setIsLoadingInsights(false);
    }
  }, [isConnected, accountId, period, loadInsights]);

  const handleConnect = async () => {
    setConnectError(null);
    setIsLoadingConnect(true);
    try {
      const data = await fetchMetaApi<{ oauthUrl?: string }>('/connect');
      if (data?.oauthUrl) {
        window.location.href = data.oauthUrl;
        return;
      }
      setConnectError('URL de connexion non disponible.');
    } catch (error) {
      logger.error('Error connecting Meta Ads:', error);
      setConnectError(
        error instanceof Error ? error.message : 'Impossible de lancer la connexion.'
      );
    } finally {
      setIsLoadingConnect(false);
    }
  };

  const handleRefreshInsights = () => {
    if (accountId) loadInsights(accountId, period);
  };

  if (isConnected === null) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Meta Ads</h1>
          <p className="text-zinc-400 mt-2">Chargement...</p>
        </div>
        <Card className="bg-zinc-800 border-zinc-700">
          <CardContent className="p-12 text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-zinc-400 mx-auto" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Meta Ads</h1>
          <p className="text-zinc-400 mt-2">
            Connect your Meta Ads account to track campaigns and performance
          </p>
        </div>

        <Card className="bg-zinc-800 border-zinc-700">
          <CardContent className="p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📘</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Connect Meta Ads</h2>
              <p className="text-zinc-400 mb-6">
                Connect your Facebook/Instagram Ads account to start tracking your campaigns,
                performance metrics, and ROI.
              </p>
              {connectError && (
                <p className="text-red-400 text-sm mb-4">{connectError}</p>
              )}
              <Button onClick={handleConnect} disabled={isLoadingConnect} size="lg">
                {isLoadingConnect ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>Connect Meta Ads Account</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Meta Ads</h1>
          <p className="text-zinc-400 mt-2">
            {accountName
              ? `Track: ${accountName}`
              : 'Track your Facebook and Instagram ad campaigns'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshInsights}
            disabled={isLoadingInsights}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${isLoadingInsights ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Select value={String(period)} onValueChange={(value) => setPeriod(Number(value))}>
            <SelectTrigger className="w-[180px] bg-zinc-900 border-zinc-700 text-white">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {insightsError && (
        <Card className="bg-amber-900/20 border-amber-700">
          <CardContent className="py-3 text-amber-200 text-sm">
            {insightsError}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Spend"
          value={formatCurrency(insights.spend)}
          icon={DollarSign}
          isLoading={isLoadingInsights}
        />
        <KPICard
          title="Impressions"
          value={formatNumber(insights.impressions)}
          icon={Target}
          isLoading={isLoadingInsights}
        />
        <KPICard
          title="Clicks"
          value={formatNumber(insights.clicks)}
          icon={MousePointerClick}
          isLoading={isLoadingInsights}
        />
        <KPICard
          title="ROAS"
          value={insights.roas ? `${Number(insights.roas).toFixed(1)}x` : '—'}
          trend={insights.roas && insights.roas >= 1 ? 'up' : undefined}
          icon={TrendingUp}
          isLoading={isLoadingInsights}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white">Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoadingInsights ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-zinc-400" />
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">CPC</span>
                  <span className="text-white font-semibold">{formatCurrency(insights.cpc)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">CPM</span>
                  <span className="text-white font-semibold">{formatCurrency(insights.cpm)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">CTR</span>
                  <span className="text-white font-semibold">{insights.ctr.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Conversions</span>
                  <span className="text-white font-semibold">{insights.conversions}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Cost per Conversion</span>
                  <span className="text-white font-semibold">
                    {formatCurrency(insights.costPerConversion)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Conversion Rate</span>
                  <span className="text-white font-semibold">
                    {insights.conversionRate.toFixed(2)}%
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white">Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-zinc-400">
              <p className="mb-4">Campaigns list coming soon...</p>
              <Link href="/admin/ads/meta/campaigns">
                <Button variant="outline">View All Campaigns</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
