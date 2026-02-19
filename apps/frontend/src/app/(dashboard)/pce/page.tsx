'use client';

import { useState } from 'react';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Package, Truck, Factory, RefreshCw, AlertTriangle,
  CheckCircle, Clock, TrendingUp, Activity, RotateCcw,
} from 'lucide-react';

import { PCEOverview } from '@/components/pce/PCEOverview';
import { PipelinesList } from '@/components/pce/PipelinesList';
import { QueuesMonitor } from '@/components/pce/QueuesMonitor';
import { PCEMetricsChart } from '@/components/pce/PCEMetricsChart';
import { RecentAlerts } from '@/components/pce/RecentAlerts';
import { FulfillmentList } from '@/components/pce/FulfillmentList';
import { ManufacturingPanel } from '@/components/pce/ManufacturingPanel';
import { ReturnsPanel } from '@/components/pce/ReturnsPanel';
import { usePCEDashboard } from '@/hooks/usePCE';

export default function PCEDashboardPage() {
  const [selectedTab, setSelectedTab] = useState('overview');
  const { data: dashboard, isLoading, refetch } = usePCEDashboard();

  if (isLoading) {
    return <PCELoadingSkeleton />;
  }

  const d = (dashboard ?? {}) as Record<string, unknown>;
  const stats = (d.stats ?? {}) as Record<string, number>;
  const queueStatus = (d.queueStatus ?? {}) as Record<string, unknown>;
  const recentPipelines = (d.recentPipelines ?? []) as Array<Record<string, unknown>>;
  const alerts = (d.alerts ?? []) as Array<Record<string, unknown>>;

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Production & Commerce Engine
          </h1>
          <p className="text-muted-foreground">
            Gérez le flux complet de vos commandes : du paiement à la livraison
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Actualiser
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Commandes totales"
          value={stats.totalOrders ?? 0}
          icon={<Package className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="En cours"
          value={stats.processingOrders ?? 0}
          icon={<Clock className="h-4 w-4 text-orange-500" />}
          description="Commandes en traitement"
        />
        <StatsCard
          title="Complétées aujourd'hui"
          value={stats.completedToday ?? 0}
          icon={<CheckCircle className="h-4 w-4 text-green-500" />}
        />
        <StatsCard
          title="Erreurs"
          value={stats.failedToday ?? 0}
          icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
          variant={(stats.failedToday ?? 0) > 0 ? 'destructive' : 'default'}
        />
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="overview">
            <Activity className="mr-2 h-4 w-4" />
            Vue d&apos;ensemble
          </TabsTrigger>
          <TabsTrigger value="pipelines">
            <Factory className="mr-2 h-4 w-4" />
            Pipelines
          </TabsTrigger>
          <TabsTrigger value="queues">
            <TrendingUp className="mr-2 h-4 w-4" />
            Files d&apos;attente
          </TabsTrigger>
          <TabsTrigger value="fulfillment">
            <Truck className="mr-2 h-4 w-4" />
            Expéditions
          </TabsTrigger>
          <TabsTrigger value="production">
            <Factory className="mr-2 h-4 w-4" />
            Production
          </TabsTrigger>
          <TabsTrigger value="returns">
            <RotateCcw className="mr-2 h-4 w-4" />
            Retours
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Flux de traitement</CardTitle>
                <CardDescription>Visualisation en temps réel du pipeline de commandes</CardDescription>
              </CardHeader>
              <CardContent>
                <PCEOverview pipelines={recentPipelines as Array<{ id: string; orderId: string; currentStage: string; progress: number; order?: { orderNumber?: string } }>} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance</CardTitle>
                <CardDescription>Métriques des 7 derniers jours</CardDescription>
              </CardHeader>
              <CardContent>
                <PCEMetricsChart />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alertes récentes</CardTitle>
                <CardDescription>Problèmes nécessitant une attention</CardDescription>
              </CardHeader>
              <CardContent>
                <RecentAlerts alerts={alerts as Array<{ id: string; type: 'error' | 'warning' | 'info'; message: string; stage?: string; pipelineId?: string; createdAt: string }>} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pipelines">
          <Card>
            <CardHeader>
              <CardTitle>Pipelines actifs</CardTitle>
              <CardDescription>Suivi des commandes en cours de traitement</CardDescription>
            </CardHeader>
            <CardContent>
              <PipelinesList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queues">
          <QueuesMonitor queues={queueStatus} />
        </TabsContent>

        <TabsContent value="fulfillment">
          <Card>
            <CardHeader>
              <CardTitle>Expéditions</CardTitle>
              <CardDescription>Suivi des livraisons et expéditions</CardDescription>
            </CardHeader>
            <CardContent>
              <FulfillmentList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="production">
          <ManufacturingPanel />
        </TabsContent>

        <TabsContent value="returns">
          <ReturnsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatsCard({
  title, value, icon, description, variant = 'default',
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  description?: string;
  variant?: 'default' | 'destructive';
}) {
  return (
    <Card className={variant === 'destructive' ? 'border-red-200 dark:border-red-800' : ''}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );
}

function PCELoadingSkeleton() {
  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="h-10 w-64 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        ))}
      </div>
      <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
    </div>
  );
}
