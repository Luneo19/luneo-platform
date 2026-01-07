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
} from 'lucide-react';
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

