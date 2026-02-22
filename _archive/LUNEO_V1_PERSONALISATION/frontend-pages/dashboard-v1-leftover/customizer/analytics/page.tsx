'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Loader2, TrendingUp, Users, ShoppingCart, DollarSign, Image as ImageIcon } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/trpc/client';

function GlobalAnalyticsContent() {
  const { data, isLoading, error } = api.visualCustomizer.customizer.list.useQuery({
    page: 1,
    limit: 100,
  });

  const customizers = (data?.customizers ?? []) as Record<string, unknown>[];

  // Aggregate stats across all customizers
  const totalSessions = customizers.reduce(
    (sum: number, c: Record<string, unknown>) =>
      sum + ((c.sessionCount as number) ?? 0),
    0
  );
  const totalDesigns = customizers.reduce(
    (sum: number, c: Record<string, unknown>) =>
      sum + ((c.savedDesignCount as number) ?? 0),
    0
  );
  const totalConversions = customizers.reduce(
    (sum: number, c: Record<string, unknown>) =>
      sum + ((c.conversionCount as number) ?? 0),
    0
  );
  const totalRevenue = customizers.reduce(
    (sum: number, c: Record<string, unknown>) =>
      sum + ((c.revenue as number) ?? 0),
    0
  );

  const topCustomizers = [...customizers]
    .sort(
      (a: Record<string, unknown>, b: Record<string, unknown>) =>
        ((b.sessionCount as number) ?? 0) - ((a.sessionCount as number) ?? 0)
    )
    .slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-6">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Failed to load analytics.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Customizer Analytics</h1>
        <p className="text-muted-foreground">Overview of all customizers performance</p>
      </div>

      {/* Summary Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Sessions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSessions.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saved Designs</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDesigns.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Conversions</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalConversions.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRevenue.toLocaleString()} EUR</div>
          </CardContent>
        </Card>
      </div>

      {/* Top Customizers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Customizers</CardTitle>
          <CardDescription>Customizers with the most sessions</CardDescription>
        </CardHeader>
        <CardContent>
          {topCustomizers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No customizers yet</p>
          ) : (
            <div className="space-y-4">
              {(topCustomizers as Record<string, unknown>[]).map((customizer: Record<string, unknown>, index: number) => (
                <div
                  key={customizer.id as string}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      <span className="text-sm font-medium">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {(customizer.name as string) ?? 'Unnamed'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {(customizer.sessionCount as number) ?? 0} sessions
                      </p>
                    </div>
                  </div>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function GlobalAnalyticsPage() {
  return (
    <ErrorBoundary level="page" componentName="GlobalAnalyticsPage">
      <GlobalAnalyticsContent />
    </ErrorBoundary>
  );
}
