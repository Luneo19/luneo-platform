'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BarChart3, Clock, MousePointer, ShoppingCart, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useARProjectAnalytics } from '../../../hooks/useARAnalytics';
import { Skeleton } from '@/components/ui/skeleton';

interface ProjectAnalyticsClientProps {
  projectId: string;
}

export function ProjectAnalyticsClient({ projectId }: ProjectAnalyticsClientProps) {
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const { data, loading, error, refetch } = useARProjectAnalytics(projectId, dateRange);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/ar-studio/projects/${projectId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-white">Analytics projet</h1>
            <p className="text-sm text-white/60">Sessions, placements et conversions</p>
          </div>
        </div>
      </div>

      {loading ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-xl w-full" />
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
                <p className="text-2xl font-semibold text-white">{data?.sessions ?? 0}</p>
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
                  <MousePointer className="h-4 w-4" />
                  Placements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-white">{data?.placements ?? 0}</p>
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-white/5">
              <CardHeader className="pb-1">
                <CardTitle className="text-sm font-medium text-white/60 flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Conversions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-white">{data?.conversions ?? 0}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Entonnoir de conversion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-end gap-4 h-48">
                {[
                  { label: 'Sessions', value: data?.sessions ?? 0, color: 'bg-blue-500' },
                  { label: 'Placements', value: data?.placements ?? 0, color: 'bg-emerald-500' },
                  { label: 'Conversions', value: data?.conversions ?? 0, color: 'bg-amber-500' },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <div
                      className={`w-20 rounded-t ${item.color}`}
                      style={{
                        height: `${Math.max(8, (item.value / Math.max(1, (data?.sessions ?? 1) / 10)))}px`,
                      }}
                    />
                    <span className="text-xs text-white/60">{item.label}</span>
                    <span className="text-sm font-medium text-white">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
