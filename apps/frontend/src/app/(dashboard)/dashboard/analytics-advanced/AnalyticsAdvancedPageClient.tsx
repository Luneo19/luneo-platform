/**
 * Client Component pour Analytics Advanced
 * Version professionnelle simplifiée
 */

'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AnalyticsAdvancedHeader } from './components/AnalyticsAdvancedHeader';
import { FunnelAnalysis } from './components/FunnelAnalysis';
import { CohortAnalysis } from './components/CohortAnalysis';
import { GeographicAnalysis } from './components/GeographicAnalysis';
import { useAdvancedAnalytics } from './hooks/useAdvancedAnalytics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  Users,
  TrendingUp,
  Globe,
  Zap,
  Filter,
  Layers,
  GitBranch,
  HelpCircle,
} from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatPrice } from '@/lib/utils/formatters';
import type { TimeRange, AnalyticsView } from './types';

export function AnalyticsAdvancedPageClient() {
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [activeView, setActiveView] = useState<AnalyticsView>('overview');

  const {
    funnelData,
    cohortData,
    geographicData,
    segments,
    behavioralEvents,
    stats,
    isLoading,
  } = useAdvancedAnalytics(timeRange);

  const { data: revenuePredictions, isLoading: predictionsLoading } =
    trpc.analyticsAdvanced.getRevenuePredictions.useQuery(undefined, {
      staleTime: 60_000,
    });

  const handleExport = () => {
    toast({
      title: 'Export',
      description: 'Export des données en cours...',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-10">
        <div className="h-16 bg-gray-800 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 bg-gray-800 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <AnalyticsAdvancedHeader onExport={handleExport} />

      <div className="flex items-center gap-4">
        <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
          <SelectTrigger className="w-48 bg-gray-800 border-gray-600 text-white">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">7 derniers jours</SelectItem>
            <SelectItem value="30d">30 derniers jours</SelectItem>
            <SelectItem value="90d">90 derniers jours</SelectItem>
            <SelectItem value="1y">1 an</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <GitBranch className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-xs text-gray-400 mb-1">Étapes Funnel</p>
            <p className="text-xl font-bold text-blue-400">{stats.totalFunnelSteps}</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Layers className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-xs text-gray-400 mb-1">Cohortes</p>
            <p className="text-xl font-bold text-green-400">{stats.totalCohorts}</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-xs text-gray-400 mb-1">Segments</p>
            <p className="text-xl font-bold text-purple-400">{stats.totalSegments}</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Globe className="w-5 h-5 text-yellow-400" />
            </div>
            <p className="text-xs text-gray-400 mb-1">Pays</p>
            <p className="text-xl font-bold text-yellow-400">{stats.totalCountries}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as AnalyticsView)}>
        <TabsList className="bg-gray-800 border-gray-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-gray-700">
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="funnel" className="data-[state=active]:bg-gray-700">
            <GitBranch className="w-4 h-4 mr-2" />
            Funnel
          </TabsTrigger>
          <TabsTrigger value="cohort" className="data-[state=active]:bg-gray-700">
            <Layers className="w-4 h-4 mr-2" />
            Cohortes
          </TabsTrigger>
          <TabsTrigger value="geographic" className="data-[state=active]:bg-gray-700">
            <Globe className="w-4 h-4 mr-2" />
            Géographique
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-6">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-cyan-400" />
                  Prédictions de revenus
                  <span className="ml-1 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-500/20 dark:text-amber-400">
                    Beta
                  </span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex cursor-help text-gray-400 hover:text-gray-300">
                          <HelpCircle className="w-4 h-4" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs">
                        <p>
                          Prédictions basées sur des heuristiques statistiques. La précision
                          s&apos;améliorera avec plus de données.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardTitle>
              </div>
              <CardDescription className="text-gray-400">
                Prévisions sur les 30 prochains jours selon différents scénarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              {predictionsLoading ? (
                <div className="h-24 flex items-center justify-center text-gray-400 text-sm">
                  Chargement des prédictions...
                </div>
              ) : revenuePredictions?.predictions?.length ? (
                <ul className="space-y-3">
                  {revenuePredictions.predictions.map(
                    (
                      p: {
                        scenario: string;
                        revenue: number;
                        probability?: number;
                        confidence?: number;
                      },
                      i: number
                    ) => (
                      <li
                        key={i}
                        className="flex items-center justify-between py-2 border-b border-gray-700/50 last:border-0"
                      >
                        <span className="text-sm text-gray-300 capitalize">
                          {p.scenario === 'conservative'
                            ? 'Conservateur'
                            : p.scenario === 'optimistic'
                              ? 'Optimiste'
                              : 'Très optimiste'}
                        </span>
                        <span className="font-medium text-cyan-400">
                          {formatPrice(p.revenue, 'EUR')}
                        </span>
                        {p.confidence != null && (
                          <span className="text-xs text-gray-500 ml-2">
                            conf. {p.confidence.toFixed(0)}%
                          </span>
                        )}
                      </li>
                    )
                  )}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">
                  Aucune prédiction disponible. Les prédictions apparaîtront après accumulation de
                  données.
                </p>
              )}
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <FunnelAnalysis funnelData={funnelData.slice(0, 5)} />
            <CohortAnalysis cohortData={cohortData.slice(0, 5)} />
          </div>
          <GeographicAnalysis geographicData={geographicData.slice(0, 5)} />
        </TabsContent>

        <TabsContent value="funnel" className="space-y-4 mt-6">
          <FunnelAnalysis funnelData={funnelData} />
        </TabsContent>

        <TabsContent value="cohort" className="space-y-4 mt-6">
          <CohortAnalysis cohortData={cohortData} />
        </TabsContent>

        <TabsContent value="geographic" className="space-y-4 mt-6">
          <GeographicAnalysis geographicData={geographicData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

