'use client';

import { useState } from 'react';
import { BarChart3, Clock, TrendingUp, DollarSign, Smartphone, Monitor } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useARAnalytics } from '../hooks/useARAnalytics';
import { Skeleton } from '@/components/ui/skeleton';

export function AnalyticsDashboardClient() {
  const [range, setRange] = useState({ startDate: '', endDate: '' });
  const { data, loading, error, refetch } = useARAnalytics(range);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">Analytics AR</h1>
          <p className="text-sm text-white/60">Vue globale des sessions et conversions</p>
        </div>
      </div>

      {loading ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
          <Skeleton className="h-48 rounded-xl w-full" />
        </>
      ) : error ? (
        <Card className="border-red-500/30 bg-red-500/10 p-6">
          <p className="text-red-400">{error.message}</p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            Réessayer
          </Button>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-white/10 bg-white/5">
              <CardHeader className="pb-1">
                <CardTitle className="text-sm font-medium text-white/60 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-white">{data?.totalSessions ?? 0}</p>
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-white/5">
              <CardHeader className="pb-1">
                <CardTitle className="text-sm font-medium text-white/60 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Durée moy.
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-white">{data?.avgDuration ?? 0}s</p>
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-white/5">
              <CardHeader className="pb-1">
                <CardTitle className="text-sm font-medium text-white/60 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Taux conversion
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-white">{((data?.conversionRate ?? 0) * 100).toFixed(1)}%</p>
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-white/5">
              <CardHeader className="pb-1">
                <CardTitle className="text-sm font-medium text-white/60 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Revenus
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-white">{(data?.revenue ?? 0).toFixed(2)} €</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle className="text-white">Sessions dans le temps</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48 flex items-end gap-1">
                  {data && (data.sessionsTrend ?? []).length > 0 ? (
                    (data.sessionsTrend as { date: string; count: number }[]).slice(-14).map((d, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-blue-500/80 rounded-t min-w-0"
                        style={{ height: `${Math.max(4, (d.count / Math.max(1, Math.max(...(data.sessionsTrend as { count: number }[]).map((x) => x.count)))) * 100)}%` }}
                        title={`${d.date}: ${d.count}`}
                      />
                    ))
                  ) : (
                    <p className="text-sm text-white/50">Aucune donnée</p>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle className="text-white">Plateformes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data && (data.platformDistribution ?? []).length > 0 ? (
                    (data.platformDistribution as { platform: string; count: number }[]).map((p, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-white/80">
                          {p.platform === 'ios' && <Smartphone className="h-4 w-4" />}
                          {p.platform === 'android' && <Smartphone className="h-4 w-4" />}
                          {p.platform === 'desktop' && <Monitor className="h-4 w-4" />}
                          {p.platform}
                        </span>
                        <span className="text-white font-medium">{p.count}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-white/50">Aucune donnée</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white">Top modèles</CardTitle>
            </CardHeader>
            <CardContent>
              {data && (data.topModels ?? []).length > 0 ? (
                <div className="space-y-2">
                  {(data.topModels as { id: string; name: string; sessions: number }[]).slice(0, 10).map((m, i) => (
                    <div key={m.id} className="flex items-center justify-between py-2 border-b border-white/10 last:border-0">
                      <span className="text-white/80">#{i + 1} {m.name}</span>
                      <span className="text-white font-medium">{m.sessions} sessions</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-white/50">Aucun modèle</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
