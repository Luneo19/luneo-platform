/**
 * Monitoring Metrics Component
 * Displays detailed performance metrics and charts
 * 
 * CURSOR RULES COMPLIANT:
 * - Server Component compatible
 * - < 300 lines
 * - Types explicit
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { DashboardMetrics } from '@/lib/monitoring/types';

interface MonitoringMetricsProps {
  metrics: DashboardMetrics | null;
}

export function MonitoringMetrics({ metrics }: MonitoringMetricsProps) {
  if (!metrics) {
    return (
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-8 text-center">
          <p className="text-slate-400">Aucune métrique disponible</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Performance Metrics */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle>Métriques de performance</CardTitle>
          <CardDescription>Web Vitals et temps de réponse</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.avgWebVitals.LCP && (
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <p className="text-sm text-slate-400 mb-1">LCP (Largest Contentful Paint)</p>
                <p className="text-2xl font-bold">{metrics.avgWebVitals.LCP.toFixed(0)}ms</p>
                <p className="text-xs text-slate-500 mt-1">
                  {metrics.avgWebVitals.LCP < 2500 ? '✅ Bon' : metrics.avgWebVitals.LCP < 4000 ? '⚠️ À améliorer' : '❌ Mauvais'}
                </p>
              </div>
            )}
            {metrics.avgWebVitals.FID && (
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <p className="text-sm text-slate-400 mb-1">FID (First Input Delay)</p>
                <p className="text-2xl font-bold">{metrics.avgWebVitals.FID.toFixed(0)}ms</p>
                <p className="text-xs text-slate-500 mt-1">
                  {metrics.avgWebVitals.FID < 100 ? '✅ Bon' : metrics.avgWebVitals.FID < 300 ? '⚠️ À améliorer' : '❌ Mauvais'}
                </p>
              </div>
            )}
            {metrics.avgWebVitals.CLS !== undefined && (
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <p className="text-sm text-slate-400 mb-1">CLS (Cumulative Layout Shift)</p>
                <p className="text-2xl font-bold">{metrics.avgWebVitals.CLS.toFixed(3)}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {metrics.avgWebVitals.CLS < 0.1 ? '✅ Bon' : metrics.avgWebVitals.CLS < 0.25 ? '⚠️ À améliorer' : '❌ Mauvais'}
                </p>
              </div>
            )}
            {metrics.avgWebVitals.TTFB && (
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <p className="text-sm text-slate-400 mb-1">TTFB (Time to First Byte)</p>
                <p className="text-2xl font-bold">{metrics.avgWebVitals.TTFB.toFixed(0)}ms</p>
                <p className="text-xs text-slate-500 mt-1">
                  {metrics.avgWebVitals.TTFB < 800 ? '✅ Bon' : metrics.avgWebVitals.TTFB < 1800 ? '⚠️ À améliorer' : '❌ Mauvais'}
                </p>
              </div>
            )}
            {metrics.avgWebVitals.FCP && (
              <div className="p-4 bg-slate-800/50 rounded-lg">
                <p className="text-sm text-slate-400 mb-1">FCP (First Contentful Paint)</p>
                <p className="text-2xl font-bold">{metrics.avgWebVitals.FCP.toFixed(0)}ms</p>
                <p className="text-xs text-slate-500 mt-1">
                  {metrics.avgWebVitals.FCP < 1800 ? '✅ Bon' : metrics.avgWebVitals.FCP < 3000 ? '⚠️ À améliorer' : '❌ Mauvais'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* API Metrics */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle>Métriques API</CardTitle>
          <CardDescription>Performance des endpoints API</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
              <span className="text-slate-300">Temps de réponse moyen</span>
              <span className="font-semibold">{metrics.avgResponseTime}ms</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
              <span className="text-slate-300">Taux d'erreur</span>
              <span className="font-semibold text-red-400">{metrics.errorRate.toFixed(2)}%</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
              <span className="text-slate-300">Pic de requêtes/min</span>
              <span className="font-semibold">{metrics.peakRPM}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}






