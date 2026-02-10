'use client';

import { useState, useEffect } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Activity, Server, Database, Cpu, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

function StatusDot({ status }: { status: string }) {
  if (status === 'operational') {
    return (
      <span className="flex items-center gap-1.5 text-[#4ade80]">
        <span className="dash-pulse-dot" />
        Operational
      </span>
    );
  }
  if (status === 'degraded') {
    return (
      <span className="flex items-center gap-1.5 text-[#fbbf24]">
        <AlertTriangle className="h-4 w-4" />
        Degraded
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-[#f87171]">
      <XCircle className="h-4 w-4" />
      Outage
    </span>
  );
}

function AdminHealthContent() {
  const [systemStatus, setSystemStatus] = useState<Array<{name: string; status: string; latency: string; icon: typeof Server}>>([]);
  const [metrics, setMetrics] = useState<Array<{label: string; value: string; status: string; threshold?: number}>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch('/api/v1/health', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          const health = data.data || data;
          if (health.services) setSystemStatus(health.services);
          if (health.metrics) setMetrics(health.metrics);
        }
      } catch {
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
        <h1 className="text-3xl font-bold text-white">Platform Health</h1>
        <p className="text-white/60 mt-1">API latency, error rates, and system status</p>
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
              {m.status === 'ok' ? 'Within target' : m.status === 'warning' ? 'Above threshold' : 'Critical'}
            </p>
          </div>
        ))}
      </div>

      <div className="dash-card border-white/[0.06] p-6 bg-white/[0.03] backdrop-blur-sm">
        <h2 className="text-lg font-semibold text-white mb-4">System status</h2>
        {isLoading ? (
          <div className="text-white/60 text-sm">Loading...</div>
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
                    <p className="text-sm text-white/40">Latency: {s.latency}</p>
                  </div>
                </div>
                <StatusDot status={s.status} />
              </div>
            );
          })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="dash-card border-white/[0.06] p-6 bg-white/[0.03] backdrop-blur-sm">
          <h2 className="text-lg font-semibold text-white mb-4">Recent incidents</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <CheckCircle2 className="h-5 w-5 text-[#4ade80] shrink-0 mt-0.5" />
              <div>
                <p className="text-white text-sm font-medium">Resolved: API latency spike</p>
                <p className="text-white/40 text-xs">Resolved 2 hours ago · Duration 12 min</p>
              </div>
            </div>
            <p className="text-white/40 text-sm">No active incidents.</p>
          </div>
        </div>

        <div className="dash-card border-white/[0.06] p-6 bg-white/[0.03] backdrop-blur-sm">
          <h2 className="text-lg font-semibold text-white mb-4">Health summary</h2>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Services operational</span>
              <span className="text-[#4ade80] font-medium">3 / 4</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-[#4ade80]"
                style={{ width: '75%' }}
              />
            </div>
            <p className="text-white/40 text-xs">
              AI Engine is experiencing elevated latency. Team is investigating.
            </p>
          </div>
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
