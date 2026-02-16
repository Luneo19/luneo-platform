'use client';

import { useState, useEffect } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useI18n } from '@/i18n/useI18n';
import { Activity, Server, Database, Cpu, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

function StatusDot({ status, t }: { status: string; t: (key: string) => string }) {
  if (status === 'operational') {
    return (
      <span className="flex items-center gap-1.5 text-[#4ade80]">
        <span className="dash-pulse-dot" />
        {t('admin.health.operational')}
      </span>
    );
  }
  if (status === 'degraded') {
    return (
      <span className="flex items-center gap-1.5 text-[#fbbf24]">
        <AlertTriangle className="h-4 w-4" />
        {t('admin.health.degraded')}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-[#f87171]">
      <XCircle className="h-4 w-4" />
      {t('admin.health.outage')}
    </span>
  );
}

function AdminHealthContent() {
  const { t } = useI18n();
  const [systemStatus, setSystemStatus] = useState<Array<{name: string; status: string; latency: string; icon: typeof Server}>>([]);
  const [metrics, setMetrics] = useState<Array<{label: string; value: string; status: string; threshold?: number}>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const res = await fetch('/api/v1/health', { 
          credentials: 'include',
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (res.ok) {
          const data = await res.json();
          const health = data.data || data;
          const iconByKey: Record<string, typeof Server> = { database: Database, redis: Cpu, stripe: Activity, email: Activity };
          const deps = health.dependencies || health.services;
          const services = deps && typeof deps === 'object' && !Array.isArray(deps)
            ? (Object.entries(deps) as [string, { name?: string; status?: string; latencyMs?: number; latency?: number; service?: string }][]).map(([key, dep]) => ({
                name: dep?.name ?? key.charAt(0).toUpperCase() + key.slice(1),
                status: dep?.status ?? 'unknown',
                latency: dep?.latencyMs != null ? `${dep.latencyMs}ms` : '-',
                icon: iconByKey[key] ?? Server,
              }))
            : Array.isArray(deps) ? (deps as Array<{ name?: string; status?: string; latencyMs?: number; latency?: number; service?: string }>).map((d) => ({
                name: d.name ?? d.service ?? 'Service',
                status: d.status ?? 'unknown',
                latency: d.latency != null ? String(d.latency) : d.latencyMs != null ? `${d.latencyMs}ms` : '-',
                icon: Server,
              })) : [];
          if (services.length) setSystemStatus(services);
          if (health.metrics) setMetrics(health.metrics);
        }
      } catch (error) {
        // Fallback: show unknown status
        setSystemStatus([
          { name: 'API Gateway', status: 'unknown', latency: '-', icon: Server },
          { name: 'Database', status: 'unknown', latency: '-', icon: Database },
          { name: 'Redis Cache', status: 'unknown', latency: '-', icon: Cpu },
          { name: 'AI Engine', status: 'unknown', latency: '-', icon: Activity },
        ]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  // Default metrics if API doesn't return them
  const displayMetrics = metrics.length > 0 ? metrics : [
    { label: 'API latency (p95)', value: '-', status: 'unknown' },
    { label: 'Error rate (24h)', value: '-', status: 'unknown' },
    { label: 'Uptime (30d)', value: '-', status: 'unknown' },
    { label: 'Queue depth', value: '-', status: 'unknown' },
  ];

  // Default system status if API doesn't return it
  const displaySystemStatus = systemStatus.length > 0 ? systemStatus : [
    { name: 'API Gateway', status: 'unknown', latency: '-', icon: Server },
    { name: 'Database', status: 'unknown', latency: '-', icon: Database },
    { name: 'Redis Cache', status: 'unknown', latency: '-', icon: Cpu },
    { name: 'AI Engine', status: 'unknown', latency: '-', icon: Activity },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">{t('admin.health.platformHealth')}</h1>
        <p className="text-white/60 mt-1">{t('admin.health.subtitleDetail')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayMetrics.map((m) => (
          <div
            key={m.label}
            className="dash-card border-white/[0.06] p-5 bg-white/[0.03] backdrop-blur-sm"
          >
            <p className="text-white/60 text-sm">{m.label}</p>
            <p className="text-2xl font-bold text-white mt-1">{m.value}</p>
            <p className={`text-xs mt-1 ${m.status === 'ok' ? 'text-[#4ade80]' : m.status === 'warning' ? 'text-[#fbbf24]' : 'text-[#f87171]'}`}>
              {m.status === 'ok' ? t('admin.health.withinTarget') : m.status === 'warning' ? t('admin.health.aboveThreshold') : t('admin.health.critical')}
            </p>
          </div>
        ))}
      </div>

      <div className="dash-card border-white/[0.06] p-6 bg-white/[0.03] backdrop-blur-sm">
        <h2 className="text-lg font-semibold text-white mb-4">{t('admin.health.systemStatusLabel')}</h2>
        {isLoading ? (
          <div className="text-white/60 text-sm">{t('admin.health.loading')}</div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {displaySystemStatus.map((s) => {
              const Icon = s.icon;
            return (
              <div
                key={s.name}
                className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/[0.06]">
                    <Icon className="h-5 w-5 text-white/80" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{s.name}</p>
                    <p className="text-sm text-white/40">{t('admin.health.latency')}: {s.latency}</p>
                  </div>
                </div>
                <StatusDot status={s.status} t={t} />
              </div>
            );
          })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="dash-card border-white/[0.06] p-6 bg-white/[0.03] backdrop-blur-sm">
          <h2 className="text-lg font-semibold text-white mb-4">{t('admin.health.recentIncidents')}</h2>
          <div className="space-y-3">
            {(() => {
              const degradedServices = displaySystemStatus.filter(s => s.status !== 'operational' && s.status !== 'unknown');
              if (degradedServices.length === 0) {
                return (
                  <div className="flex items-start gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                    <CheckCircle2 className="h-5 w-5 text-[#4ade80] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white text-sm font-medium">{t('admin.health.noActiveIncidents')}</p>
                      <p className="text-white/40 text-xs">{t('admin.health.allServicesNormal')}</p>
                    </div>
                  </div>
                );
              }
              return degradedServices.map(s => (
                <div key={s.name} className="flex items-start gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  {s.status === 'degraded' ? (
                    <AlertTriangle className="h-5 w-5 text-[#fbbf24] shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-[#f87171] shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="text-white text-sm font-medium">{s.name} — {s.status}</p>
                    <p className="text-white/40 text-xs">{t('admin.health.latency')}: {s.latency}</p>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>

        <div className="dash-card border-white/[0.06] p-6 bg-white/[0.03] backdrop-blur-sm">
          <h2 className="text-lg font-semibold text-white mb-4">{t('admin.health.healthSummary')}</h2>
          {(() => {
            const total = displaySystemStatus.length;
            const operational = displaySystemStatus.filter(s => s.status === 'operational').length;
            const pct = total > 0 ? Math.round((operational / total) * 100) : 0;
            const allOk = operational === total;
            return (
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">{t('admin.health.servicesOperational')}</span>
                  <span className={`font-medium ${allOk ? 'text-[#4ade80]' : pct >= 50 ? 'text-[#fbbf24]' : 'text-[#f87171]'}`}>
                    {operational} / {total}
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${allOk ? 'bg-[#4ade80]' : pct >= 50 ? 'bg-[#fbbf24]' : 'bg-[#f87171]'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {!allOk && (
                  <p className="text-white/40 text-xs">
                    {total - operational} {total - operational > 1 ? 'services nécessitent attention' : 'service nécessite attention'}
                  </p>
                )}
                {allOk && (
                  <p className="text-[#4ade80]/60 text-xs">{t('admin.health.allServicesNormal')}</p>
                )}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

export default function AdminHealthPage() {
  return (
    <ErrorBoundary level="page" componentName="AdminHealthPage">
      <AdminHealthContent />
    </ErrorBoundary>
  );
}
