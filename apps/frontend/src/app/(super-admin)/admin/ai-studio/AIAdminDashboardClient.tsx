'use client';

import { useState } from 'react';
import { ImageIcon, DollarSign, Users, AlertTriangle, Activity } from 'lucide-react';
import { KPICard } from '@/components/admin/widgets/kpi-card';

const PROVIDERS = [
  { id: 'openai', name: 'OpenAI', status: 'healthy' as const },
  { id: 'stability', name: 'Stability', status: 'healthy' as const },
  { id: 'replicate', name: 'Replicate', status: 'healthy' as const },
  { id: 'meshy', name: 'Meshy', status: 'healthy' as const },
  { id: 'runway', name: 'Runway', status: 'degraded' as const },
];

export function AIAdminDashboardClient() {
  const [providers] = useState(PROVIDERS);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">AI Studio Admin</h1>
        <p className="text-white/60 mt-2">Vue d&apos;ensemble des coûts, providers et utilisation</p>
      </div>

      {/* KPI row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Generations"
          value="—"
          description="Toutes plateformes"
          icon={ImageIcon}
        />
        <KPICard
          title="Cost Today"
          value="—"
          description="Coût du jour"
          icon={DollarSign}
        />
        <KPICard
          title="Active Users"
          value="—"
          description="Utilisateurs actifs 24h"
          icon={Users}
        />
        <KPICard
          title="Error Rate"
          value="—"
          description="Taux d'erreur"
          icon={AlertTriangle}
        />
      </div>

      {/* Provider Health */}
      <div className="dash-card rounded-2xl p-6 border border-white/[0.06] bg-white/[0.03]">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-400" />
          Provider Health
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {providers.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 flex items-center justify-between"
            >
              <span className="text-white font-medium capitalize">{p.name}</span>
              <span
                className={`w-3 h-3 rounded-full ${
                  p.status === 'healthy' ? 'bg-green-500' : p.status === 'degraded' ? 'bg-amber-500' : 'bg-red-500'
                }`}
                title={p.status}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Cost chart placeholder */}
      <div className="dash-card rounded-2xl p-6 border border-white/[0.06] bg-white/[0.03]">
        <h2 className="text-lg font-semibold text-white mb-4">Cost Analytics</h2>
        <div className="h-64 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
          <p className="text-white/40">Graphique des coûts (à connecter)</p>
        </div>
      </div>

      {/* Top Users table placeholder */}
      <div className="dash-card rounded-2xl p-6 border border-white/[0.06] bg-white/[0.03]">
        <h2 className="text-lg font-semibold text-white mb-4">Top Users</h2>
        <div className="rounded-xl border border-white/[0.06] overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/[0.06] bg-white/[0.03]">
                <th className="px-4 py-3 text-sm font-medium text-white/70">User</th>
                <th className="px-4 py-3 text-sm font-medium text-white/70">Generations</th>
                <th className="px-4 py-3 text-sm font-medium text-white/70">Credits</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-white/40">
                  Aucune donnée (à connecter)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
