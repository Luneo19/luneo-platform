'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  TrendingUp,
  TrendingDown,
  Eye,
  ShoppingCart,
  Download,
  Activity,
  Smartphone,
  Monitor,
  RefreshCw,
  Share2,
  ExternalLink,
  BarChart3,
} from 'lucide-react';
import { UsageQuotaOverview } from '@/components/dashboard/UsageQuotaOverview';
import { logger } from '@/lib/logger';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAnalyticsData } from '@/lib/hooks/useAnalyticsData';
import { AnalyticsSkeleton } from '@/components/ui/skeletons';
import { EmptyState } from '@/components/ui/empty-states/EmptyState';
import { useToast } from '@/hooks/use-toast';

interface AnalyticsData {
  views: { value: number; change: number };
  designs: { value: number; change: number };
  conversions: { value: number; change: number };
  revenue: { value: number; change: number };
}

interface ChartData {
  date: string;
  views: number;
  designs: number;
  conversions: number;
}

export default function AnalyticsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const sharedPayload = searchParams?.get('share') ?? null;
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [shareStatus, setShareStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Utiliser le hook pour charger les vraies données
  const {
    analytics,
    chartData,
    devices,
    topPages,
    topCountries,
    realtimeUsers,
    loading,
    error,
    refresh,
  } = useAnalyticsData(timeRange);

  const deviceColorMap: Record<string, string> = {
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    pink: 'bg-pink-500'
  };

  const funnelColorMap: Record<string, string> = {
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    pink: 'bg-pink-500',
    green: 'bg-green-500'
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await fetch(`/api/analytics/export?period=${timeRange}&format=csv`);
      
      if (!response.ok) {
        throw new Error('Erreur lors de l\'export');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Export réussi',
        description: 'Les données analytics ont été téléchargées',
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      logger.error('Export analytics failed', { error, message: errorMessage });
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  const handleShareSnapshot = async () => {
    if (typeof navigator === 'undefined') return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareStatus('success');
      setTimeout(() => setShareStatus('idle'), 3000);
    } catch (error) {
      logger.error('Share failed', {
        error,
        payload: sharedPayload,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      setShareStatus('error');
      setTimeout(() => setShareStatus('idle'), 4000);
    }
  };

  const StatCard = ({ title, value, change, icon, valuePrefix = '', valueSuffix = '' }: any) => {
    const isPositive = change >= 0;
    return (
      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm text-gray-400 mb-1">{title}</p>
            <h3 className="text-3xl font-bold text-white">
              {valuePrefix}{value.toLocaleString()}{valueSuffix}
            </h3>
          </div>
          <div className={`p-3 rounded-lg ${isPositive ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
            {icon}
          </div>
        </div>
        <div className={`flex items-center gap-2 text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          <span>{isPositive ? '+' : ''}{change}% vs période précédente</span>
        </div>
      </Card>
    );
  };

  const sharedQuota = useMemo(() => {
    if (!sharedPayload || typeof window === 'undefined') {
      return null;
    }
    try {
      const decoded = decodeURIComponent(sharedPayload);
      const payload = window.atob(decoded);
      const json = JSON.parse(payload);
      return json as {
        brandId: string;
        plan: string;
        overage: number;
        recommendation: string | null;
        pressure: { metric: string; percentage: number } | null;
        timestamp: string;
      };
    } catch (error) {
      logger.error('Failed to decode share payload', {
        error,
        payload: sharedPayload,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }, [sharedPayload]);

  return (
    <div className="space-y-6 pb-10">
      {sharedQuota && (
        <Card className="border-violet-500/40 bg-violet-950/30 p-6 text-sm text-violet-50 space-y-2">
          <p className="text-xs uppercase text-violet-200 flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Aperçu partagé
          </p>
          <p>
            Brand <span className="font-semibold">{sharedQuota.brandId}</span> — plan{' '}
            <span className="font-semibold">{sharedQuota.plan}</span>
          </p>
          <p>
            Overage estimé :{' '}
            <span className="font-semibold">
              {(sharedQuota.overage / 100).toLocaleString('fr-FR', {
                style: 'currency',
                currency: 'EUR',
              })}
            </span>
          </p>
          {sharedQuota.pressure && (
            <p>
              Pression maximale : <strong>{sharedQuota.pressure.metric}</strong> (
              {sharedQuota.pressure.percentage.toFixed(0)}%)
            </p>
          )}
          {sharedQuota.recommendation && (
            <p>
              Plan recommandé : <strong>{sharedQuota.recommendation}</strong>
            </p>
          )}
          <p className="text-xs text-violet-200/70">
            Snapshot du {new Date(sharedQuota.timestamp).toLocaleString('fr-FR')}
          </p>
        </Card>
      )}

      {loading && <AnalyticsSkeleton />}
      {error && (
        <EmptyState
          icon={<Activity className="w-16 h-16" />}
          title="Erreur de chargement"
          description={error}
          action={{
            label: 'Réessayer',
            onClick: handleRefresh,
          }}
        />
      )}
      {!loading && !error && analytics.views.value === 0 && analytics.designs.value === 0 && (
        <EmptyState
          icon={<Activity className="w-16 h-16" />}
          title="Aucune donnée disponible"
          description="Vous n'avez pas encore de données analytics. Créez des designs et recevez des commandes pour voir vos statistiques."
        />
      )}
      {/* Header - Enhanced with animations */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-400" />
            Analytics
          </h1>
          <p className="text-gray-400">Vue d'ensemble de vos performances en temps réel</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={timeRange} onValueChange={(value) => setTimeRange(value as any)}>
            <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="7d">7 derniers jours</SelectItem>
              <SelectItem value="30d">30 derniers jours</SelectItem>
              <SelectItem value="90d">90 derniers jours</SelectItem>
              <SelectItem value="1y">1 an</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="border-slate-700 hover:bg-slate-800"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button
            variant="outline"
            className="border-slate-700 hover:bg-slate-800 min-w-[140px]"
            onClick={handleExport}
            disabled={exporting}
          >
            <Download className={`w-4 h-4 mr-2 ${exporting ? 'animate-spin' : ''}`} />
            {exporting ? 'Export...' : 'Exporter'}
          </Button>
          <Button
            variant="outline"
            className={`border-slate-700 hover:bg-slate-800 ${
              shareStatus === 'success' ? 'text-green-400 border-green-500/50 bg-green-500/10' : ''
            } ${
              shareStatus === 'error' ? 'text-red-400 border-red-500/50 bg-red-500/10' : ''
            }`}
            onClick={handleShareSnapshot}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Partager
          </Button>
          <Button
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25"
            onClick={() => router.push('/overview')}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Overview
          </Button>
        </div>
      </motion.div>

      {shareStatus === 'success' && (
        <p className="text-sm text-green-400">Lien copié ! Partagez cette vue analytics à votre équipe.</p>
      )}
      {shareStatus === 'error' && (
        <p className="text-sm text-red-400">Impossible de copier le lien. Réessayez ou vérifiez vos permissions.</p>
      )}

      {/* Key Metrics */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Vues totales"
          value={analytics.views.value}
          change={analytics.views.change}
          icon={<Eye className="w-6 h-6 text-blue-400" />}
        />
        <StatCard
          title="Designs créés"
          value={analytics.designs.value}
          change={analytics.designs.change}
          icon={<Activity className="w-6 h-6 text-purple-400" />}
        />
        <StatCard
          title="Conversions"
          value={analytics.conversions.value}
          change={analytics.conversions.change}
          icon={<ShoppingCart className="w-6 h-6 text-green-400" />}
        />
        <StatCard
          title="Revenus"
          value={analytics.revenue.value}
          change={analytics.revenue.change}
          valuePrefix="$"
          icon={<TrendingUp className="w-6 h-6 text-yellow-400" />}
        />
      </div>

      {/* Usage overview */}
      <UsageQuotaOverview />

      {/* Realtime Users */}
      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-white mb-1">Utilisateurs en temps réel</h3>
            <p className="text-sm text-gray-400">Activité des 60 dernières minutes</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-2xl font-bold text-white">{realtimeUsers[realtimeUsers.length - 1].count}</span>
            <span className="text-gray-400">utilisateurs actifs</span>
          </div>
        </div>
        <div className="flex items-end gap-2 h-32">
          {realtimeUsers.map((data, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(data.count / 50) * 100}%` }}
                transition={{ delay: i * 0.1 }}
                className="w-full bg-gradient-to-t from-green-600 to-green-400 rounded-t"
              />
              <span className="text-xs text-gray-400">{data.time}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Views Chart */}
        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h3 className="text-lg font-bold text-white mb-6">Vues et Designs</h3>
          <div className="space-y-4">
            {chartData.map((data, i) => {
              const maxViews = Math.max(...chartData.map(d => d.views));
              const viewPercentage = (data.views / maxViews) * 100;
              const designPercentage = (data.designs / data.views) * 100;
              
              return (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">{data.date}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-blue-400">{data.views} vues</span>
                      <span className="text-purple-400">{data.designs} designs</span>
                    </div>
                  </div>
                  <div className="relative h-8 bg-gray-900 rounded overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${viewPercentage}%` }}
                      transition={{ delay: i * 0.1 }}
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600 to-blue-400"
                    />
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${designPercentage}%` }}
                      transition={{ delay: i * 0.1 + 0.2 }}
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-600 to-purple-400"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Devices */}
        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h3 className="text-lg font-bold text-white mb-6">Appareils</h3>
          <div className="space-y-6">
            {devices.map((device, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    {device.name === 'Desktop' && <Monitor className="w-5 h-5 text-blue-400" />}
                    {device.name === 'Mobile' && <Smartphone className="w-5 h-5 text-purple-400" />}
                    {device.name === 'Tablet' && <Monitor className="w-5 h-5 text-pink-400" />}
                    <span className="text-white font-medium">{device.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold">{device.percentage}%</div>
                    <div className="text-xs text-gray-400">{device.count.toLocaleString()}</div>
                  </div>
                </div>
                <div className="h-2 bg-gray-900 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${device.percentage}%` }}
                    transition={{ delay: i * 0.1 }}
                    className={`h-full ${deviceColorMap[device.color] ?? 'bg-blue-500'}`}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-gray-900/50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Total d'appareils</span>
              <span className="text-white font-bold">
                {devices.reduce((sum, d) => sum + d.count, 0).toLocaleString()}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Top Pages */}
      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <h3 className="text-lg font-bold text-white mb-6">Pages les plus visitées</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 text-gray-400 font-medium">Page</th>
                <th className="text-right py-3 text-gray-400 font-medium">Vues</th>
                <th className="text-right py-3 text-gray-400 font-medium">Conversions</th>
                <th className="text-right py-3 text-gray-400 font-medium">Taux</th>
                <th className="text-right py-3 text-gray-400 font-medium">Performance</th>
              </tr>
            </thead>
            <tbody>
              {topPages.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-400">
                    Aucune page suivie pour le moment.
                    <div className="mt-4">
                      <Button onClick={() => router.push('/overview')} variant="outline">
                        Ajouter un premier tracking
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                topPages.map((page, i) => (
                  <tr key={i} className="border-b border-gray-800 hover:bg-gray-900/20">
                    <td className="py-4 text-white font-mono text-sm">{page.path}</td>
                    <td className="py-4 text-right text-gray-300">{page.views.toLocaleString()}</td>
                    <td className="py-4 text-right text-green-400">{page.conversions}</td>
                    <td className="py-4 text-right text-gray-300">{page.rate}</td>
                    <td className="py-4">
                      <div className="flex justify-end">
                        <div className="w-24 h-2 bg-gray-900 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-600 to-purple-600"
                            style={{ width: `${parseFloat(page.rate) * 30}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Geographic Data */}
      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <h3 className="text-lg font-bold text-white mb-6">Répartition géographique</h3>
        <div className="space-y-4">
          {topCountries.map((country, i) => (
            <div key={i} className="flex items-center gap-4">
              <span className="text-3xl">{country.flag}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-medium">{country.name}</span>
                  <div className="text-right">
                    <div className="text-white font-bold">{country.percentage}%</div>
                    <div className="text-xs text-gray-400">{country.users.toLocaleString()} utilisateurs</div>
                  </div>
                </div>
                <div className="h-2 bg-gray-900 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${country.percentage}%` }}
                    transition={{ delay: i * 0.1 }}
                    className="h-full bg-gradient-to-r from-blue-600 to-purple-600"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Insight Actions */}
      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <h3 className="text-lg font-bold text-white mb-4">Prochaines actions</h3>
        <p className="text-sm text-gray-400 mb-6">
          Transformez vos insights en actions concrètes : export, partage, pilotage.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Button
            className="h-20 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            onClick={() => router.push('/dashboard/reports')}
          >
            <TrendingUp className="w-5 h-5 mr-2" />
            Générer un rapport
          </Button>
          <Button
            variant="outline"
            className="h-20 border-gray-600 text-gray-300 hover:bg-gray-700"
            onClick={handleExport}
            disabled={exporting}
          >
            <Download className={`w-5 h-5 mr-2 ${exporting ? 'animate-spin' : ''}`} />
            {exporting ? 'Export...' : 'Exporter CSV'}
          </Button>
          <Button
            variant="outline"
            className="h-20 border-gray-600 text-gray-300 hover:bg-gray-700"
            onClick={() => router.push('/dashboard/integrations')}
          >
            <Monitor className="w-5 h-5 mr-2" />
            Connecter un pixel
          </Button>
        </div>
      </Card>

      {/* Conversion Funnel */}
      <Card className="p-6 bg-gray-800/50 border-gray-700">
        <h3 className="text-lg font-bold text-white mb-6">Entonnoir de conversion</h3>
        <div className="space-y-4">
          {[
            { stage: 'Visiteurs', count: 45280, percentage: 100, color: 'blue' },
            { stage: 'Ont customisé', count: 12450, percentage: 27.5, color: 'purple' },
            { stage: 'Ajouté au panier', count: 3240, percentage: 7.2, color: 'pink' },
            { stage: 'Commandé', count: 892, percentage: 2.0, color: 'green' }
          ].map((stage, i) => (
            <div key={i} className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">{stage.stage}</span>
                <div className="text-right">
                  <span className="text-white font-bold">{stage.count.toLocaleString()}</span>
                  <span className="text-gray-400 text-sm ml-2">({stage.percentage}%)</span>
                </div>
              </div>
              <div className="h-12 bg-gray-900 rounded overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stage.percentage}%` }}
                  transition={{ delay: i * 0.2 }}
                  className={`h-full ${funnelColorMap[stage.color] ?? 'bg-blue-500'} flex items-center justify-center text-white font-bold`}
                >
                  {stage.percentage}%
                </motion.div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
