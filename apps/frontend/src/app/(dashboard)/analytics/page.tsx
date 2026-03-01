/**
 * ★★★ ANALYTICS DASHBOARD PREMIUM ★★★
 * Dashboard analytics ultra-premium avec React Query, design dark glassmorphism
 * - React Query avec cache intelligent
 * - Design system dark glassmorphism (dash-card, dash-card-glow)
 * - KPIs avec glow effects
 * - Recharts dark theme
 * - Gestion d'erreurs complète
 * - Skeleton loaders
 * - Toast notifications
 */
'use client';

import { useState, useMemo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PlanGate } from '@/lib/hooks/api/useFeatureGate';
import { UpgradeRequiredPage } from '@/components/shared/UpgradeRequiredPage';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Download,
  Calendar,
  BarChart3,
  Target,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  LineChart,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  useAnalyticsMetrics,
  useAnalyticsTimeSeries,
  useAnalyticsTopEvents,
  useUnifiedScorecard,
  useExportAnalytics,
  type TimeRange,
  type TimeSeriesData,
  type TopEvent,
} from '@/hooks/use-analytics';
import { KPISkeleton, ChartSkeleton } from '@/components/ui/skeleton';
import { ErrorDisplay } from '@/components/ui/error-display';
import { useI18n } from '@/i18n/useI18n';
import { InsightsCard } from '@/components/dashboard/InsightsCard';

// Chart palette (dark theme)
const CHART_COLORS = [
  '#8b5cf6',
  '#ec4899',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#06b6d4',
  '#f97316',
];

const TOOLTIP_STYLE = {
  background: '#1a1a2e',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '12px',
  color: 'white',
  fontFamily: 'Inter, sans-serif',
};

// ========================================
// COMPONENT
// ========================================
function AnalyticsLuxuryPageContent() {
  const { t } = useI18n();
  const [period, setPeriod] = useState<TimeRange>('30d');

  const {
    data: metrics,
    isLoading: metricsLoading,
    error: metricsError,
    refetch: refetchMetrics,
  } = useAnalyticsMetrics(period);
  const {
    data: timeSeries = [],
    isLoading: timeSeriesLoading,
    error: timeSeriesError,
    refetch: refetchTimeSeries,
  } = useAnalyticsTimeSeries(period);
  const {
    data: topEvents = [],
    isLoading: topEventsLoading,
    error: topEventsError,
    refetch: refetchTopEvents,
  } = useAnalyticsTopEvents(period);
  const { mutate: exportAnalytics, isPending: isExporting } =
    useExportAnalytics();
  const { data: scorecard } = useUnifiedScorecard(period);
  const isLoading = metricsLoading || timeSeriesLoading || topEventsLoading;
  const hasError = metricsError || timeSeriesError || topEventsError;

  const trends = useMemo(() => {
    if (!metrics || !timeSeries || timeSeries.length < 2) return null;

    const midPoint = Math.floor(timeSeries.length / 2);
    const firstHalf = timeSeries.slice(0, midPoint);
    const secondHalf = timeSeries.slice(midPoint);

    const calcAvg = (data: typeof timeSeries, key: keyof (typeof timeSeries)[0]) => {
      if (data.length === 0) return 0;
      const sum = data.reduce((acc, item) => acc + (Number(item[key]) || 0), 0);
      return sum / data.length;
    };

    const calcTrend = (first: number, second: number) => {
      if (first === 0) return { value: second > 0 ? 100 : 0, isPositive: second >= 0 };
      const change = ((second - first) / first) * 100;
      return {
        value: Math.abs(Math.round(change * 10) / 10),
        isPositive: change >= 0,
      };
    };

    const eventsFirst = calcAvg(firstHalf, 'events' as keyof (typeof timeSeries)[0]);
    const eventsSecond = calcAvg(secondHalf, 'events' as keyof (typeof timeSeries)[0]);

    const usersFirst = calcAvg(firstHalf, 'users' as keyof (typeof timeSeries)[0]);
    const usersSecond = calcAvg(secondHalf, 'users' as keyof (typeof timeSeries)[0]);

    const conversionsFirst = calcAvg(firstHalf, 'conversions' as keyof (typeof timeSeries)[0]);
    const conversionsSecond = calcAvg(secondHalf, 'conversions' as keyof (typeof timeSeries)[0]);

    const rateFirst = eventsFirst > 0 ? (conversionsFirst / eventsFirst) * 100 : 0;
    const rateSecond = eventsSecond > 0 ? (conversionsSecond / eventsSecond) * 100 : 0;

    return {
      events: calcTrend(eventsFirst, eventsSecond),
      users: calcTrend(usersFirst, usersSecond),
      conversions: calcTrend(conversionsFirst, conversionsSecond),
      rate: calcTrend(rateFirst, rateSecond),
    };
  }, [metrics, timeSeries]);

  const pieData = useMemo(() => {
    if (!topEvents || topEvents.length === 0) return [];
    return topEvents.slice(0, 5).map((event: TopEvent, index: number) => ({
      name: event.name.replace('_', ' ').toUpperCase(),
      value: event.count,
      color: CHART_COLORS[index % CHART_COLORS.length],
    }));
  }, [topEvents]);

  const handleExport = () => {
    exportAnalytics({ period, format: 'csv' });
  };

  return (
    <div className="min-h-screen dash-bg">
      <main
        id="main-content"
        className="container mx-auto max-w-7xl px-6 py-8"
        tabIndex={-1}
      >
        {/* Header */}
        <div className="mb-10 animate-fade-in">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="mb-2 text-5xl font-bold tracking-tight text-white">
                Analytics
              </h1>
              <p className="text-xl text-white/60">
                Insights performants et métriques en temps réel
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Select
                value={period}
                onValueChange={(value) => setPeriod(value as TimeRange)}
              >
                <SelectTrigger
                  className="dash-input w-[200px] border-white/[0.06] bg-[#1a1a2e] text-white"
                  aria-label="Sélectionner la période"
                >
                  <Calendar className="mr-2 h-4 w-4 text-white/40" aria-hidden="true" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-white/[0.06] bg-[#1a1a2e] text-white">
                  <SelectItem value="7d" className="focus:bg-white/[0.06] focus:text-white">
                    7 derniers jours
                  </SelectItem>
                  <SelectItem value="30d" className="focus:bg-white/[0.06] focus:text-white">
                    30 derniers jours
                  </SelectItem>
                  <SelectItem value="90d" className="focus:bg-white/[0.06] focus:text-white">
                    90 derniers jours
                  </SelectItem>
                  <SelectItem value="1y" className="focus:bg-white/[0.06] focus:text-white">
                    12 derniers mois
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                className="border-white/[0.06] bg-white/[0.03] font-semibold text-white backdrop-blur-sm hover:bg-white/[0.06]"
                onClick={handleExport}
                disabled={isExporting}
                aria-label={t('common.exportData')}
              >
                <Download className="mr-2 h-4 w-4" aria-hidden="true" />
                {isExporting ? t('common.exportInProgress') : t('common.export')}
              </Button>
            </div>
          </div>
        </div>

        {hasError && (
          <div className="mb-6">
            <ErrorDisplay
              error={
                metricsError ||
                timeSeriesError ||
                topEventsError ||
                new Error(t('common.unknownError'))
              }
              onRetry={() => {
                refetchMetrics();
                refetchTimeSeries();
                refetchTopEvents();
              }}
              title={t('common.analyticsLoadError')}
            />
          </div>
        )}

        {/* KPIs */}
        {isLoading ? (
          <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="dash-card rounded-2xl p-6">
                <KPISkeleton className="[&>div]:bg-white/[0.06]" />
              </div>
            ))}
          </div>
        ) : metrics ? (
          <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="dash-card-glow animate-fade-in-up border-white/[0.06] bg-transparent shadow-none">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold uppercase tracking-wide text-white/60">
                  Événements
                </CardTitle>
                <div
                  className="rounded-lg bg-gradient-to-br from-[#8b5cf6]/20 to-[#ec4899]/20 p-2"
                  aria-hidden="true"
                >
                  <Activity className="h-5 w-5 text-[#8b5cf6]" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <div>
                    <div
                      className="mb-1 text-4xl font-bold text-white"
                      aria-label={`${metrics.totalEvents.toLocaleString()} événements`}
                    >
                      {metrics.totalEvents.toLocaleString()}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      {trends?.events.isPositive ? (
                        <TrendingUp className="h-4 w-4 text-[#10b981]" aria-hidden="true" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-[#ef4444]" aria-hidden="true" />
                      )}
                      <span
                        className={`text-sm font-semibold ${trends?.events.isPositive ? 'text-[#10b981]' : 'text-[#ef4444]'}`}
                      >
                        {trends?.events.value}%
                      </span>
                      <span className="text-xs text-white/40">vs période précédente</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="dash-card-glow animate-fade-in-up border-white/[0.06] bg-transparent shadow-none"
              style={{ animationDelay: '0.1s' }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold uppercase tracking-wide text-white/60">
                  Vues
                </CardTitle>
                <div
                  className="rounded-lg bg-gradient-to-br from-[#10b981]/20 to-[#06b6d4]/20 p-2"
                  aria-hidden="true"
                >
                  <BarChart3 className="h-5 w-5 text-[#10b981]" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <div>
                    <div
                      className="mb-1 text-4xl font-bold text-white"
                      aria-label={`${metrics.pageViews.toLocaleString()} vues`}
                    >
                      {metrics.pageViews.toLocaleString()}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-white/40">Pages consultées</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="dash-card-glow animate-fade-in-up border-white/[0.06] bg-transparent shadow-none"
              style={{ animationDelay: '0.2s' }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold uppercase tracking-wide text-white/60">
                  Conversions
                </CardTitle>
                <div
                  className="rounded-lg bg-gradient-to-br from-[#f59e0b]/20 to-[#f97316]/20 p-2"
                  aria-hidden="true"
                >
                  <Target className="h-5 w-5 text-[#f59e0b]" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <div>
                    <div
                      className="mb-1 text-4xl font-bold text-white"
                      aria-label={`${metrics.conversions.toLocaleString()} conversions`}
                    >
                      {metrics.conversions.toLocaleString()}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      {trends?.conversions.isPositive ? (
                        <TrendingUp className="h-4 w-4 text-[#10b981]" aria-hidden="true" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-[#ef4444]" aria-hidden="true" />
                      )}
                      <span
                        className={`text-sm font-semibold ${trends?.conversions.isPositive ? 'text-[#10b981]' : 'text-[#ef4444]'}`}
                      >
                        {trends?.conversions.value}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="dash-card-glow animate-fade-in-up border-white/[0.06] bg-transparent shadow-none"
              style={{ animationDelay: '0.3s' }}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold uppercase tracking-wide text-white/60">
                  Taux de Conversion
                </CardTitle>
                <div
                  className="rounded-lg bg-gradient-to-br from-[#8b5cf6]/20 to-[#3b82f6]/20 p-2"
                  aria-hidden="true"
                >
                  <Award className="h-5 w-5 text-[#8b5cf6]" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <div>
                    <div
                      className="mb-1 text-4xl font-bold text-white"
                      aria-label={`Taux de conversion ${metrics.conversionRate.toFixed(2)}%`}
                    >
                      {metrics.conversionRate.toFixed(2)}%
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      {trends?.rate.isPositive ? (
                        <ArrowUpRight className="h-4 w-4 text-[#10b981]" aria-hidden="true" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-[#ef4444]" aria-hidden="true" />
                      )}
                      <span
                        className={`text-sm font-semibold ${trends?.rate.isPositive ? 'text-[#10b981]' : 'text-[#ef4444]'}`}
                      >
                        {trends?.rate.value}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {/* AI Insights */}
        <div className="mb-10">
          <InsightsCard />
        </div>

        {scorecard && (
          <div className="mb-10">
            <Card className="dash-card border-white/[0.06] bg-transparent shadow-none">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-white">ROI v1.5 - Provenance</CardTitle>
                <CardDescription className="text-white/60">
                  Distinction explicite entre métriques observées et estimées
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {scorecard.metrics.map((metric) => (
                    <div
                      key={metric.key}
                      className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-sm font-semibold text-white">{metric.label}</p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            metric.provenance === 'observed'
                              ? 'bg-emerald-500/15 text-emerald-300'
                              : 'bg-amber-500/15 text-amber-300'
                          }`}
                        >
                          {metric.provenance === 'observed' ? 'observed' : 'estimated'}
                        </span>
                      </div>
                      <p className="text-xs text-white/50">Source: {metric.source}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Charts */}
        <div className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {timeSeriesLoading ? (
            <div className="dash-card rounded-2xl p-6">
              <ChartSkeleton className="[&>div]:bg-white/[0.06]" />
            </div>
          ) : timeSeriesError ? (
            <ErrorDisplay
              error={timeSeriesError}
              onRetry={refetchTimeSeries}
              title={t('common.loadingChartError')}
            />
          ) : (
            <Card className="dash-card border-white/[0.06] bg-transparent shadow-none transition-[border-color,background] hover:border-white/[0.1] hover:bg-white/[0.05]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="mb-2 text-2xl font-bold text-white">
                      Évolution Temporelle
                    </CardTitle>
                    <CardDescription className="text-white/60">
                      Nombre d'événements par jour
                    </CardDescription>
                  </div>
                  <LineChart className="h-6 w-6 text-[#8b5cf6]" aria-hidden="true" />
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={timeSeries as TimeSeriesData[]} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                    <defs>
                      <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS[0]} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={CHART_COLORS[0]} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.04)" />
                    <XAxis
                      dataKey="date"
                      axisLine={{ stroke: 'rgba(255, 255, 255, 0.06)' }}
                      tick={{ fill: '#4a4a5e', fontSize: 12 }}
                      tickFormatter={(value) =>
                        new Date(value).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                        })
                      }
                    />
                    <YAxis
                      axisLine={{ stroke: 'rgba(255, 255, 255, 0.06)' }}
                      tick={{ fill: '#4a4a5e', fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      labelFormatter={(value) =>
                        new Date(value).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke={CHART_COLORS[0]}
                      fillOpacity={1}
                      fill="url(#colorEvents)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {topEventsLoading ? (
            <div className="dash-card rounded-2xl p-6">
              <ChartSkeleton className="[&>div]:bg-white/[0.06]" />
            </div>
          ) : topEventsError ? (
            <ErrorDisplay
              error={topEventsError}
              onRetry={refetchTopEvents}
              title={t('common.loadingChartError')}
            />
          ) : (
            <Card className="dash-card border-white/[0.06] bg-transparent shadow-none transition-[border-color,background] hover:border-white/[0.1] hover:bg-white/[0.05]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="mb-2 text-2xl font-bold text-white">
                      Top Événements
                    </CardTitle>
                    <CardDescription className="text-white/60">
                      Répartition des événements
                    </CardDescription>
                  </div>
                  <BarChart3 className="h-6 w-6 text-[#8b5cf6]" aria-hidden="true" />
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.8)' }} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <ErrorBoundary>
      <PlanGate
        minimumPlan="business"
        showUpgradePrompt
        fallback={
          <UpgradeRequiredPage
            feature="Analytics Avancés"
            requiredPlan="business"
            description="Les analytics avancés avec KPIs, graphiques et rapports détaillés sont disponibles à partir du plan Business."
          />
        }
      >
        <AnalyticsLuxuryPageContent />
      </PlanGate>
    </ErrorBoundary>
  );
}
