'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { endpoints } from '@/lib/api/client';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BarChart3, Maximize2, MapPin } from 'lucide-react';

export function HeatmapsPageClient() {
  const [modelId, setModelId] = useState<string>('');
  const [data, setData] = useState<{
    viewAngleDistribution?: { angle: string; count: number }[];
    scaleDistribution?: { scale: string; count: number }[];
    placementZones?: { zone: string; count: number }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    endpoints.ar.analytics.heatmaps({ modelId: modelId || undefined })
      .then((res) => setData((res as typeof data) ?? null))
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, [modelId]);

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-white">Heatmaps AR</h1>
          <p className="text-sm text-white/60">Angles de vue, échelle et zones de placement</p>
        </div>
        <Select value={modelId || 'all'} onValueChange={(v) => setModelId(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-48 bg-white/5 border-white/20">
            <SelectValue placeholder="Modèle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les modèles</SelectItem>
            {/* Optionally load model list and map here */}
          </SelectContent>
        </Select>
      </div>

      {error ? (
        <Card className="border-red-500/30 bg-red-500/10 p-6">
          <p className="text-red-400">{error.message}</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Distribution des angles de vue
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data && (data.viewAngleDistribution ?? []).length > 0 ? (
                <div className="space-y-2">
                  {(data.viewAngleDistribution as { angle: string; count: number }[]).map((d, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <span className="text-white/80 w-24">{d.angle}°</span>
                      <div className="flex-1 h-6 rounded bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-blue-500/80 rounded"
                          style={{
                            width: `${(d.count / Math.max(1, Math.max(...(data.viewAngleDistribution as { count: number }[]).map((x) => x.count)))) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-white font-medium w-12">{d.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-white/50">Aucune donnée</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Maximize2 className="h-5 w-5" />
                Distribution des échelles
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data && (data.scaleDistribution ?? []).length > 0 ? (
                <div className="space-y-2">
                  {(data.scaleDistribution as { scale: string; count: number }[]).map((d, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <span className="text-white/80 w-24">{d.scale}x</span>
                      <div className="flex-1 h-6 rounded bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500/80 rounded"
                          style={{
                            width: `${(d.count / Math.max(1, Math.max(...(data.scaleDistribution as { count: number }[]).map((x) => x.count)))) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-white font-medium w-12">{d.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-white/50">Aucune donnée</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Zones de placement
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data && (data.placementZones ?? []).length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {(data.placementZones as { zone: string; count: number }[]).map((z, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-lg bg-white/5 border border-white/10 text-center"
                    >
                      <p className="text-white/60 text-sm">{z.zone}</p>
                      <p className="text-xl font-semibold text-white mt-1">{z.count}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-white/50">Aucune donnée</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
