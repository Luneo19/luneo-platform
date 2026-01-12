/**
 * ★★★ GOOGLE ADS PAGE ★★★
 * Page pour gérer les campagnes Google Ads
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KPICard } from '@/components/admin/widgets/kpi-card';
import { DollarSign, TrendingUp, MousePointerClick, Target, RefreshCw } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';

export default function GoogleAdsPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [period, setPeriod] = useState<number>(30);

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/ads/google/connect');
      const data = await response.json();
      if (data.oauthUrl) {
        window.location.href = data.oauthUrl;
      }
    } catch (error) {
      console.error('Error connecting Google Ads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mock data
  const mockInsights = {
    impressions: 98000,
    clicks: 4200,
    cost: 3200,
    cpc: 0.76,
    cpm: 32.65,
    ctr: 4.29,
    conversions: 156,
    costPerConversion: 20.51,
    conversionRate: 3.71,
    roas: 3.8,
  };

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Google Ads</h1>
          <p className="text-zinc-400 mt-2">
            Connect your Google Ads account to track campaigns and performance
          </p>
        </div>

        <Card className="bg-zinc-800 border-zinc-700">
          <CardContent className="p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔍</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Connect Google Ads</h2>
              <p className="text-zinc-400 mb-6">
                Connect your Google Ads account to start tracking your campaigns,
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
                    Connect Google Ads Account
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Google Ads</h1>
          <p className="text-zinc-400 mt-2">Track your Google ad campaigns</p>
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Cost"
          value={formatCurrency(mockInsights.cost)}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
          isLoading={isLoading}
        />
        <KPICard
          title="Impressions"
          value={formatNumber(mockInsights.impressions)}
          icon={<Target className="h-4 w-4 text-muted-foreground" />}
          isLoading={isLoading}
        />
        <KPICard
          title="Clicks"
          value={formatNumber(mockInsights.clicks)}
          icon={<MousePointerClick className="h-4 w-4 text-muted-foreground" />}
          isLoading={isLoading}
        />
        <KPICard
          title="ROAS"
          value={`${mockInsights.roas.toFixed(1)}x`}
          trend="up"
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
