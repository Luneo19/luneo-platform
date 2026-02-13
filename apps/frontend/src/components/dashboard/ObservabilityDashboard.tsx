'use client';

import { useMemo, memo } from 'react';
import { useI18n } from '@/i18n/useI18n';
import { Activity, AlertTriangle, CheckCircle, Cpu, Radio } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  useRealtimeMetrics,
  type QuotaRealtimePayload,
  type RealtimeQueueMetric,
} from '@/hooks/useRealtimeMetrics';
import { useFeatureFlag } from '@/contexts/FeatureFlagContext';
import { cn } from '@/lib/utils';

const formatNumber = (value: number) =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);

const formatPercent = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 }).format(value);

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${Math.floor(seconds % 60)}s`;
  }
  return `${Math.floor(seconds)}s`;
};

function ObservabilityDashboard() {
  const { t } = useI18n();
  const { data, quotaSummaries, isConnected, lastUpdated } = useRealtimeMetrics();
  const isEnabled = useFeatureFlag('realtime_monitoring', true);

  const totals = useMemo(
    () =>
      data?.totals ?? {
        waiting: 0,
        delayed: 0,
        active: 0,
        failed: 0,
        completed: 0,
      },
    [data],
  );

  const totalJobs = useMemo(() => {
    return totals.waiting + totals.delayed + totals.active + totals.completed + totals.failed;
  }, [totals]);

  const prioritizedQuotas = useMemo(() => {
    return quotaSummaries
      .map((entry) => {
        const hottestMetric =
          entry.summary.metrics.reduce((prev, current) => {
            return current.percentage > prev.percentage ? current : prev;
          }, entry.summary.metrics[0]);
        const latestAlert = entry.summary.alerts?.[0];
        return {
          ...entry,
          hottestMetric,
          latestAlert,
        };
      })
      .sort((a, b) => b.hottestMetric.percentage - a.hottestMetric.percentage);
  }, [quotaSummaries]);

  if (!isEnabled) {
    return (
      <div className="mx-auto max-w-3xl rounded-xl border border-border bg-card/80 p-12 text-center shadow-lg">
        <h2 className="text-2xl font-semibold text-foreground">Monitoring désactivé</h2>
        <p className="mt-4 text-muted-foreground">
          Le flag <code className="rounded bg-muted px-2 py-0.5">realtime_monitoring</code> est
          actuellement inactif. Activez-le pour accéder aux métriques live de la plateforme.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Observabilité temps réel</h1>
          <p className="text-sm text-muted-foreground">
            Suivi live des queues BullMQ, ressources système et indicateurs critiques.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm shadow-sm">
          <span
            className={cn(
              'flex h-2.5 w-2.5 rounded-full',
              isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-destructive',
            )}
          />
          <span className="font-medium text-foreground">
            {isConnected ? 'Connecté en direct' : 'Déconnecté'}
          </span>
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">MAJ {new Date(lastUpdated).toLocaleTimeString()}</span>
          )}
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Jobs en attente"
          value={formatNumber(totals.waiting + totals.delayed)}
          trendLabel="pending"
          tone="amber"
          icon={<AlertTriangle className="h-5 w-5 text-amber-500" aria-hidden="true" />}
        />
        <StatCard
          title="Jobs en cours"
          value={formatNumber(totals.active)}
          trendLabel="processing"
          tone="blue"
          icon={<Activity className="h-5 w-5 text-blue-500" aria-hidden="true" />}
        />
        <StatCard
          title="Jobs complétés (24h)"
          value={formatNumber(totals.completed)}
          trendLabel="done"
          tone="emerald"
          icon={<CheckCircle className="h-5 w-5 text-emerald-500" aria-hidden="true" />}
        />
        <StatCard
          title="Jobs en échec"
          value={formatNumber(totals.failed)}
          trendLabel="failures"
          tone="rose"
          icon={<Radio className="h-5 w-5 text-rose-500" aria-hidden="true" />}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3 border-border/80 bg-card/60 backdrop-blur">
          <div className="border-b border-border/60 px-6 py-4">
            <h2 className="text-lg font-semibold text-foreground">Queues & santé</h2>
            <p className="text-sm text-muted-foreground">
              Suivi détaillé des queues BullMQ et des alertes temps réel.
            </p>
          </div>
          <div className="divide-y divide-border/60">
            {data?.queues.map((queue) => (
              <QueueRow key={queue.name} queue={queue} />
            )) ?? (
              <div className="p-6 text-sm text-muted-foreground">
                Collecte des métriques en cours…
              </div>
            )}
          </div>
        </Card>

        <Card className="lg:col-span-2 border-border/80 bg-card/60 backdrop-blur">
          <div className="border-b border-border/60 px-6 py-4">
            <h2 className="text-lg font-semibold text-foreground">Ressources système</h2>
            <p className="text-sm text-muted-foreground">
              Chargement du worker et du nœud backend.
            </p>
          </div>
          <div className="space-y-6 p-6">
            <MetricWithProgress
              label="Charge CPU (1 min)"
              value={data?.system.loadAvg1m ?? 0}
              max={4}
              formatValue={(value) => value.toFixed(2)}
            />
            <MetricWithProgress
              label="Mémoire RSS"
              value={(data?.system.memoryRss ?? 0) / (1024 * 1024 * 1024)}
              max={16}
              formatValue={(value) => `${value.toFixed(2)} GB`}
            />
            <MetricWithProgress
              label={t('common.heapUsed')}
              value={(data?.system.heapUsed ?? 0) / (1024 * 1024)}
              max={2048}
              formatValue={(value) => `${value.toFixed(0)} MB`}
            />
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/40 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">Uptime process</p>
                <p className="text-xs text-muted-foreground">
                  {formatDuration(data?.system.uptimeSeconds ?? 0)}
                </p>
              </div>
              <Cpu className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            </div>
          </div>
        </Card>
      </section>

      <section className="rounded-xl border border-border/70 bg-muted/40 p-6">
        <h2 className="text-lg font-semibold text-foreground">Analyse rapide</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <InsightCard
            title="Taux de succès"
            description="Part des jobs complétés sans erreur"
            value={
              totalJobs === 0
                ? '—'
                : formatPercent((totals.completed || 0) / Math.max(totalJobs, 1))
            }
            tone="emerald"
          />
          <InsightCard
            title="Concentration Backlog"
            description="Jobs en file d'attente vs traitements actifs"
            value={
              totals.active === 0
                ? '—'
                : formatPercent((totals.waiting + totals.delayed) / Math.max(totalJobs, 1))
            }
            tone="amber"
          />
          <InsightCard
            title="Taux d'échec"
            description="Proportion de jobs en erreur"
            value={
              totalJobs === 0
                ? '—'
                : formatPercent((totals.failed || 0) / Math.max(totalJobs, 1))
            }
            tone="rose"
          />
        </div>
      </section>

      {prioritizedQuotas.length > 0 && (
        <section className="rounded-xl border border-border/70 bg-card/60 p-6 shadow-lg">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Quotas en tension (Live)</h2>
              <p className="text-sm text-muted-foreground">
                Flux WebSocket alimenté directement par le guard quota (`usage.quota.summary`).
              </p>
            </div>
            <Badge variant="outline" className="text-xs">
              {prioritizedQuotas.length} brand(s) surveillés
            </Badge>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {prioritizedQuotas.slice(0, 3).map((entry) => (
              <QuotaLiveCard key={entry.brandId} entry={entry} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

interface QuotaLiveCardProps {
  entry: {
    hottestMetric: {
      type: string;
      percentage: number;
      current: number;
      limit: number;
      overage: number;
    };
    latestAlert?: UsageSummaryAlert;
  } & QuotaRealtimePayload;
}

type UsageSummaryAlert = QuotaRealtimePayload['summary']['alerts'][number];

function QuotaLiveCard({ entry }: QuotaLiveCardProps) {
  const usagePercentage = Math.min(100, entry.hottestMetric.percentage);
  const severity =
    usagePercentage >= 95 ? 'critical' : usagePercentage >= 80 ? 'warning' : 'stable';

  const toneClasses: Record<typeof severity, string> = {
    critical: 'border-rose-500/40 bg-rose-500/10 text-rose-100',
    warning: 'border-amber-500/40 bg-amber-500/10 text-amber-100',
    stable: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100',
  };

  const lastAlertLabel = entry.latestAlert
    ? new Date(entry.latestAlert.timestamp).toLocaleTimeString()
    : 'Aucune alerte';

  return (
    <Card className={cn('space-y-4 border px-5 py-4', toneClasses[severity])}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-white/70">{entry.plan.name}</p>
          <p className="text-base font-semibold text-white">{entry.brandId}</p>
        </div>
        <Badge variant="outline" className="border-white/40 text-white">
          {severity === 'critical' ? 'Critique' : severity === 'warning' ? 'Sous tension' : 'Stable'}
        </Badge>
      </div>

      <div>
        <p className="text-sm text-white/80">{entry.hottestMetric.type}</p>
        <div className="mt-2 flex items-center justify-between text-sm text-white">
          <span>
            {entry.hottestMetric.current.toLocaleString()} /{' '}
            {entry.hottestMetric.limit.toLocaleString()}
          </span>
          <span>{usagePercentage.toFixed(0)}%</span>
        </div>
        <Progress
          value={usagePercentage}
          className="mt-2 h-2"
          indicatorClassName={cn(
            'h-full rounded-full',
            severity === 'critical'
              ? 'bg-gradient-to-r from-rose-400 to-purple-500'
              : severity === 'warning'
                ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                : 'bg-gradient-to-r from-emerald-400 to-teal-500',
          )}
        />
      </div>

      <div className="rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-xs text-white/80">
        <p className="font-medium">Dernière alerte</p>
        <p>{entry.latestAlert?.message ?? 'Aucune alerte active'}</p>
        <p className="text-[11px] text-white/60">MAJ {lastAlertLabel}</p>
      </div>
    </Card>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  trendLabel: string;
  tone: 'emerald' | 'blue' | 'amber' | 'rose';
  icon: React.ReactNode;
}

function StatCard({ title, value, trendLabel, tone, icon }: StatCardProps) {
  const toneClasses: Record<StatCardProps['tone'], string> = {
    emerald: 'border-emerald-500/20 bg-emerald-500/5',
    blue: 'border-blue-500/20 bg-blue-500/5',
    amber: 'border-amber-500/20 bg-amber-500/5',
    rose: 'border-rose-500/20 bg-rose-500/5',
  };

  return (
    <Card className={cn('border border-border/70 bg-card/70 backdrop-blur', toneClasses[tone])}>
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-semibold text-foreground">{value}</p>
        </div>
        <div className="rounded-full bg-background/60 p-3">{icon}</div>
      </div>
      <div className="border-t border-border/60 px-6 py-3 text-xs text-muted-foreground uppercase tracking-wide">
        {trendLabel}
      </div>
    </Card>
  );
}

interface MetricWithProgressProps {
  label: string;
  value: number;
  max: number;
  formatValue?: (value: number) => string;
}

function MetricWithProgress({ label, value, max, formatValue }: MetricWithProgressProps) {
  const percentage = Math.min(100, (value / max) * 100);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <span className="text-sm text-muted-foreground">
          {formatValue ? formatValue(value) : value.toFixed(2)}
        </span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
}

interface QueueRowProps {
  queue: RealtimeQueueMetric;
}

function QueueRow({ queue }: QueueRowProps) {
  const waiting = queue.counts.waiting ?? 0;
  const delayed = queue.counts.delayed ?? 0;
  const failed = queue.counts.failed ?? 0;
  const active = queue.counts.active ?? 0;
  const oldestAgeSeconds = queue.oldestWaitingAt
    ? Math.max(0, (Date.now() - new Date(queue.oldestWaitingAt).getTime()) / 1000)
    : 0;

  return (
    <div className="flex flex-col gap-2 px-6 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <p className="font-medium text-foreground">{queue.name}</p>
          <Badge
            className={cn(
              'px-2 py-0.5 text-xs',
              queue.isHealthy ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500',
            )}
          >
            {queue.isHealthy ? 'Healthy' : 'Unhealthy'}
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground">
          {waiting + delayed} en attente · {active} actifs · {failed} échecs
        </div>
        {queue.oldestWaitingAt && (
          <div className="text-xs text-muted-foreground">
            Plus ancien job en attente : {formatDuration(oldestAgeSeconds)}
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {queue.lastFailedJobId && (
          <Badge variant="outline" className="border-border/60 text-xs text-muted-foreground">
            Dernier échec&nbsp;: {queue.lastFailedJobId}
          </Badge>
        )}
        {queue.lastFailedReason && (
          <Badge variant="outline" className="border-border/60 text-xs text-muted-foreground">
            {queue.lastFailedReason}
          </Badge>
        )}
      </div>
    </div>
  );
}

interface InsightCardProps {
  title: string;
  description: string;
  value: string;
  tone: 'emerald' | 'amber' | 'rose';
}

function InsightCard({ title, description, value, tone }: InsightCardProps) {
  const toneClasses: Record<InsightCardProps['tone'], string> = {
    emerald: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    amber: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    rose: 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300',
  };

  return (
    <div className={cn('rounded-lg border px-4 py-3 text-sm shadow-sm', toneClasses[tone])}>
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-xs">{description}</p>
      <p className="mt-3 text-base font-semibold">{value}</p>
    </div>
  );
}

// Optimisation avec React.memo pour éviter les re-renders inutiles
const ObservabilityDashboardMemo = memo(ObservabilityDashboard);

export default function ObservabilityDashboardWrapper() {
  return (
    <ErrorBoundary componentName="ObservabilityDashboard">
      <ObservabilityDashboardMemo />
    </ErrorBoundary>
  );
}
