/**
 * ★★★ ADS OVERVIEW PAGE ★★★
 * Page overview pour toutes les plateformes Ads
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { KPICard } from '@/components/admin/widgets/kpi-card';
import { BarChartWidget } from '@/components/admin/analytics/bar-chart';
import { DollarSign, TrendingUp, Link2, CheckCircle, XCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

export default function AdsOverviewPage() {
  const [platforms, setPlatforms] = useState([
    { id: 'meta', name: 'Meta Ads', connected: false, spend: 2500, roas: 4.2 },
    { id: 'google', name: 'Google Ads', connected: false, spend: 3200, roas: 3.8 },
    { id: 'tiktok', name: 'TikTok Ads', connected: false, spend: 0, roas: 0 },
  ]);

  const totalSpend = platforms.reduce((sum, p) => sum + p.spend, 0);
  const avgROAS = platforms.filter((p) => p.connected).length > 0
    ? platforms.filter((p) => p.connected).reduce((sum, p) => sum + p.roas, 0) /
      platforms.filter((p) => p.connected).length
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Ads Manager</h1>
        <p className="text-zinc-400 mt-2">
          Manage and track all your advertising campaigns
        </p>
      </div>

      {/* Overall KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Spend"
          value={formatCurrency(totalSpend)}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
        />
        <KPICard
          title="Avg ROAS"
          value={`${avgROAS.toFixed(1)}x`}
          trend="up"
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        />
        <KPICard
          title="Connected Platforms"
          value={platforms.filter((p) => p.connected).length}
          description={`of ${platforms.length}`}
          icon={<Link2 className="h-4 w-4 text-muted-foreground" />}
        />
        <KPICard
          title="Active Campaigns"
          value="0"
          description="across all platforms"
        />
      </div>

      {/* Platform Cards */}
      <div className="grid gap-6 lg:grid-cols-3">
        {platforms.map((platform) => (
          <Card
            key={platform.id}
            className={cn(
              'bg-zinc-800 border-zinc-700 hover:border-zinc-600 transition-colors',
              platform.connected && 'border-green-500/50'
            )}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">{platform.name}</CardTitle>
                <Badge
                  variant="secondary"
                  className={cn(
                    platform.connected
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-zinc-500/20 text-zinc-400'
                  )}
                >
                  {platform.connected ? (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Connected
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3 mr-1" />
                      Not Connected
                    </>
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {platform.connected ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Spend (30d)</span>
                    <span className="text-white font-semibold">
                      {formatCurrency(platform.spend)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">ROAS</span>
                    <span className="text-white font-semibold">{platform.roas.toFixed(1)}x</span>
                  </div>
                  <Link href={`/admin/ads/${platform.id}`}>
                    <Button variant="outline" className="w-full">
                      View Dashboard
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-zinc-400 text-sm">
                    Connect your {platform.name} account to start tracking campaigns and performance.
                  </p>
                  <Link href={`/admin/ads/${platform.id}`}>
                    <Button className="w-full">Connect Account</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Comparison */}
      {platforms.filter((p) => p.connected).length > 1 && (
        <Card className="bg-zinc-800 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white">Platform Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChartWidget
              title="Spend by Platform"
              data={platforms
                .filter((p) => p.connected)
                .map((p) => ({
                  name: p.name,
                  value: p.spend,
                }))}
              orientation="horizontal"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
