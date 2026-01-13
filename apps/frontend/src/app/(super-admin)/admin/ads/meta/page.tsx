/**
 * ★★★ META ADS PAGE ★★★
 * Page pour gérer les campagnes Meta Ads
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KPICard } from '@/components/admin/widgets/kpi-card';
import { BarChartWidget } from '@/components/admin/analytics/bar-chart';
import { DollarSign, TrendingUp, MousePointerClick, Target, RefreshCw } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';
import Link from 'next/link';

export default function MetaAdsPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [period, setPeriod] = useState<number>(30);

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/ads/meta/connect');
      const data = await response.json();
      if (data.oauthUrl) {
        window.location.href = data.oauthUrl;
      }
    } catch (error) {
      console.error('Error connecting Meta Ads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mock data pour la démo
  const mockInsights = {
    impressions: 125000,
    clicks: 3500,
    spend: 2500,
    cpc: 0.71,
    cpm: 20,
    ctr: 2.8,
    conversions: 127,
    costPerConversion: 19.69,
    conversionRate: 3.63,
    roas: 4.2,
  };

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
              <Button onClick={handleConnect} disabled={isLoading} size="lg">
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    Connect Meta Ads Account
                  </>
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Meta Ads</h1>
          <p className="text-zinc-400 mt-2">
            Track your Facebook and Instagram ad campaigns
          </p>
        </div>
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

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Spend"
          value={formatCurrency(mockInsights.spend)}
          icon={DollarSign}
          isLoading={isLoading}
        />
        <KPICard
          title="Impressions"
          value={formatNumber(mockInsights.impressions)}
          icon={Target}
          isLoading={isLoading}
        />
        <KPICard
          title="Clicks"
          value={formatNumber(mockInsights.clicks)}
          icon={MousePointerClick}
          isLoading={isLoading}
        />
        <KPICard
          title="ROAS"
          value={`${mockInsights.roas.toFixed(1)}x`}
          trend="up"
          icon={TrendingUp}
          isLoading={isLoading}
        />
      </div>

      {/* Metrics */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white">Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">CPC</span>
              <span className="text-white font-semibold">{formatCurrency(mockInsights.cpc)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">CPM</span>
              <span className="text-white font-semibold">{formatCurrency(mockInsights.cpm)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">CTR</span>
              <span className="text-white font-semibold">{mockInsights.ctr.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Conversions</span>
              <span className="text-white font-semibold">{mockInsights.conversions}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Cost per Conversion</span>
              <span className="text-white font-semibold">{formatCurrency(mockInsights.costPerConversion)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Conversion Rate</span>
              <span className="text-white font-semibold">{mockInsights.conversionRate.toFixed(2)}%</span>
            </div>
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
