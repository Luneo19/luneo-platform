'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AreaChart,
  Area,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ComposedChart,
} from 'recharts';
import { ArrowLeft, Download, Sparkles, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';

const PERIODS = [
  { value: 7, label: '7j' },
  { value: 30, label: '30j' },
  { value: 90, label: '90j' },
] as const;

type Period = (typeof PERIODS)[number]['value'];

const COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b'];

function downloadCSV(rows: Record<string, unknown>[], filename: string) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => String(r[h] ?? '')).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function AiAnalyticsContent() {
  const [period, setPeriod] = useState<Period>(30);

  const { data, isLoading, error } = trpc.ai.listGenerated.useQuery({
    page: 1,
    limit: 100,
  });

  const designs = useMemo(() => {
    const list = data?.designs ?? data?.data ?? [];
    return Array.isArray(list) ? list : [];
  }, [data]);

  const filteredByPeriod = useMemo(() => {
    const since = new Date();
    since.setDate(since.getDate() - period);
    return designs.filter((d: { createdAt?: string | Date }) => {
      const t = d.createdAt ? new Date(d.createdAt) : null;
      return t && t >= since;
    });
  }, [designs, period]);

  const stats = useMemo(() => {
    const total = filteredByPeriod.length;
    const creditsPerGen = 10;
    const totalCredits = total * creditsPerGen;
    const successRate = total ? 100 : 0;
    const avgCost = total ? Math.round((totalCredits / total) * 100) / 100 : 0;
    return { total, totalCredits, successRate, avgCost };
  }, [filteredByPeriod]);

  const areaData = useMemo(() => {
    const byDate: Record<string, number> = {};
    filteredByPeriod.forEach((d: { createdAt?: string | Date }) => {
      const t = d.createdAt ? new Date(d.createdAt) : null;
      const key = t ? t.toISOString().slice(0, 10) : '';
      if (key) byDate[key] = (byDate[key] ?? 0) + 1;
    });
    return Object.entries(byDate)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count, credits: count * 10 }));
  }, [filteredByPeriod]);

  const pieData = useMemo(() => {
    const types: Record<string, number> = { '2D': 0, '3D': 0, Animation: 0 };
    filteredByPeriod.forEach((d: { metadata?: { type?: string } }) => {
      const t = (d.metadata?.type ?? '2D').toLowerCase();
      if (t.includes('3d')) types['3D']++;
      else if (t.includes('anim')) types['Animation']++;
      else types['2D']++;
    });
    return Object.entries(types).map(([name, value]) => ({ name, value })).filter((d) => d.value > 0);
  }, [filteredByPeriod]);

  const barData = useMemo(() => {
    const models: Record<string, number> = { 'DALL-E 3': 0, Meshy: 0, Runway: 0 };
    filteredByPeriod.forEach((d: { metadata?: { model?: string } }) => {
      const m = (d.metadata?.model ?? 'DALL-E 3').toLowerCase();
      if (m.includes('meshy')) models['Meshy']++;
      else if (m.includes('runway')) models['Runway']++;
      else models['DALL-E 3']++;
    });
    return Object.entries(models).map(([name, count]) => ({ name, count }));
  }, [filteredByPeriod]);

  const handleExport = useCallback(() => {
    downloadCSV(
      filteredByPeriod.map((d: { id?: string; createdAt?: string; metadata?: Record<string, unknown> }) => ({
        id: d.id,
        createdAt: d.createdAt,
        type: (d.metadata as { type?: string })?.type ?? '2D',
        model: (d.metadata as { model?: string })?.model ?? 'DALL-E 3',
        credits: 10,
      })),
      `ai-analytics-${period}d.csv`
    );
  }, [filteredByPeriod, period]);

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-center">
        <p className="text-red-400">Erreur lors du chargement des générations</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-10 w-48 bg-gray-800 rounded animate-pulse" />
          <div className="flex gap-2">
            {PERIODS.map((p) => (
              <div key={p.value} className="h-9 w-12 bg-gray-800 rounded animate-pulse" />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-4">
                <div className="h-4 w-24 bg-gray-700 rounded animate-pulse mb-2" />
                <div className="h-8 w-16 bg-gray-700 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="h-64 bg-gray-800/50 rounded-lg animate-pulse flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/analytics"
            className="rounded-lg border border-gray-700 bg-gray-800/50 p-2 hover:bg-gray-800"
          >
            <ArrowLeft className="w-4 h-4 text-gray-400" />
          </Link>
          <div className="flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-cyan-400" />
            <div>
              <h1 className="text-2xl font-bold text-white">Analytics AI Studio</h1>
              <p className="text-sm text-gray-400">Générations, crédits et coûts</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {PERIODS.map((p) => (
            <Button
              key={p.value}
              variant={period === p.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod(p.value)}
              className={period === p.value ? 'bg-cyan-600' : 'border-gray-600 text-gray-400'}
            >
              {p.label}
            </Button>
          ))}
          <Button variant="outline" size="sm" className="border-gray-600" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <p className="text-sm text-gray-400">Total générations</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <p className="text-sm text-gray-400">Crédits utilisés</p>
            <p className="text-2xl font-bold text-white">{stats.totalCredits}</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <p className="text-sm text-gray-400">Taux de succès</p>
            <p className="text-2xl font-bold text-white">{stats.successRate}%</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <p className="text-sm text-gray-400">Coût moyen</p>
            <p className="text-2xl font-bold text-white">{stats.avgCost} cr.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Générations dans le temps</CardTitle>
          </CardHeader>
          <CardContent>
            {areaData.length === 0 ? (
              <p className="text-gray-400 text-sm py-8 text-center">Aucune donnée sur la période</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={areaData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                  <Area type="monotone" dataKey="count" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Répartition par type</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <p className="text-gray-400 text-sm py-8 text-center">Aucune donnée</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Usage par modèle</CardTitle>
          </CardHeader>
          <CardContent>
            {barData.every((d) => d.count === 0) ? (
              <p className="text-gray-400 text-sm py-8 text-center">Aucune donnée</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Crédits utilisés (tendance)</CardTitle>
          </CardHeader>
          <CardContent>
            {areaData.length === 0 ? (
              <p className="text-gray-400 text-sm py-8 text-center">Aucune donnée</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={areaData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                  <Area type="monotone" dataKey="credits" fill="#10b981" fillOpacity={0.2} stroke="#10b981" />
                  <Line type="monotone" dataKey="credits" stroke="#10b981" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AiAnalyticsPage() {
  return (
    <ErrorBoundary level="page" componentName="AiAnalyticsPage">
      <AiAnalyticsContent />
    </ErrorBoundary>
  );
}
