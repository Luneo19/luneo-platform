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
import { SoftPlanGate } from '@/components/shared/SoftPlanGate';
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
        <div className="dash-card h-16 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="dash-card h-64 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <SoftPlanGate minimumPlan="business" featureName="Analytics Avancées">
      <div className="min-h-screen dash-bg space-y-6 pb-10">
        <AnalyticsAdvancedHeader onExport={handleExport} />

      <div className="flex items-center gap-4">
        <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
          <SelectTrigger className="dash-input w-48 border-white/[0.06] bg-[#1a1a2e] text-white">
            <Filter className="w-4 h-4 mr-2 text-white/40" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-white/[0.06] bg-[#1a1a2e] text-white">
            <SelectItem value="7d" className="focus:bg-white/[0.06] focus:text-white">7 derniers jours</SelectItem>
            <SelectItem value="30d" className="focus:bg-white/[0.06] focus:text-white">30 derniers jours</SelectItem>
            <SelectItem value="90d" className="focus:bg-white/[0.06] focus:text-white">90 derniers jours</SelectItem>
            <SelectItem value="1y" className="focus:bg-white/[0.06] focus:text-white">1 an</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="dash-card border-white/[0.06] bg-transparent shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <GitBranch className="w-5 h-5 text-[#3b82f6]" />
            </div>
            <p className="text-xs text-white/60 mb-1">Étapes Funnel</p>
            <p className="text-xl font-bold text-[#3b82f6]">{stats.totalFunnelSteps}</p>
          </CardContent>
        </Card>
        <Card className="dash-card border-white/[0.06] bg-transparent shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Layers className="w-5 h-5 text-[#10b981]" />
            </div>
            <p className="text-xs text-white/60 mb-1">Cohortes</p>
            <p className="text-xl font-bold text-[#10b981]">{stats.totalCohorts}</p>
          </CardContent>
        </Card>
        <Card className="dash-card border-white/[0.06] bg-transparent shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-[#8b5cf6]" />
            </div>
            <p className="text-xs text-white/60 mb-1">Segments</p>
            <p className="text-xl font-bold text-[#8b5cf6]">{stats.totalSegments}</p>
          </CardContent>
        </Card>
        <Card className="dash-card border-white/[0.06] bg-transparent shadow-none">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Globe className="w-5 h-5 text-[#f59e0b]" />
            </div>
            <p className="text-xs text-white/60 mb-1">Pays</p>
            <p className="text-xl font-bold text-[#f59e0b]">{stats.totalCountries}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as AnalyticsView)}>
        <TabsList className="dash-card border-white/[0.06] bg-transparent p-1">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:dash-card-active data-[state=active]:text-white text-white/60 hover:text-white/80"
          >
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger
            value="funnel"
            className="data-[state=active]:dash-card-active data-[state=active]:text-white text-white/60 hover:text-white/80"
          >
            <GitBranch className="w-4 h-4 mr-2" />
            Funnel
          </TabsTrigger>
          <TabsTrigger
            value="cohort"
            className="data-[state=active]:dash-card-active data-[state=active]:text-white text-white/60 hover:text-white/80"
          >
            <Layers className="w-4 h-4 mr-2" />
            Cohortes
          </TabsTrigger>
          <TabsTrigger
            value="geographic"
            className="data-[state=active]:dash-card-active data-[state=active]:text-white text-white/60 hover:text-white/80"
          >
            <Globe className="w-4 h-4 mr-2" />
            Géographique
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-6">
          <Card className="dash-card border-white/[0.06] bg-transparent shadow-none">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg flex items-center gap-2 text-white">
                  <TrendingUp className="w-5 h-5 text-[#06b6d4]" />
                  Prédictions de revenus
                  <span className="dash-badge dash-badge-new ml-1 px-2 py-0.5">
                    Beta
                  </span>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex cursor-help text-white/40 hover:text-white/60">
                          <HelpCircle className="w-4 h-4" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs border-white/[0.08] bg-[#1a1a2e] text-white">
                        <p>
                          Prédictions basées sur des heuristiques statistiques. La précision
                          s&apos;améliorera avec plus de données.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardTitle>
              </div>
              <CardDescription className="text-white/60">
                Prévisions sur les 30 prochains jours selon différents scénarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              {predictionsLoading ? (
                <div className="h-24 flex items-center justify-center text-white/40 text-sm">
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
                        className="flex items-center justify-between py-2 border-b border-white/[0.06] last:border-0"
                      >
                        <span className="text-sm text-white/80 capitalize">
                          {p.scenario === 'conservative'
                            ? 'Conservateur'
                            : p.scenario === 'optimistic'
                              ? 'Optimiste'
                              : 'Très optimiste'}
                        </span>
                        <span className="font-medium text-[#06b6d4]">
                          {formatPrice(p.revenue, 'EUR')}
                        </span>
                        {p.confidence != null && (
                          <span className="text-xs text-white/40 ml-2">
                            conf. {p.confidence.toFixed(0)}%
                          </span>
                        )}
                      </li>
                    )
                  )}
                </ul>
              ) : (
                <p className="text-sm text-white/40">
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
    </SoftPlanGate>
  );
}

