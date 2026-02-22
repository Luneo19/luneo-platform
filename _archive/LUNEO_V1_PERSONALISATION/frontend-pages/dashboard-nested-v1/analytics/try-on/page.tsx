'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useI18n } from '@/i18n/useI18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { ArrowLeft, Download, Camera, Loader2 } from 'lucide-react';

const PERIODS = [
  { value: 7, label: '7j' },
  { value: 30, label: '30j' },
  { value: 90, label: '90j' },
] as const;

type Period = (typeof PERIODS)[number]['value'];

const COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

interface TryOnAnalytics {
  totalSessions: number;
  totalProductsTried: number;
  totalScreenshots: number;
  avgSessionDuration: number;
  sessionsOverTime: Array<{ date: string; count: number }>;
  topProducts: Array<{ productId: string; productName: string; tryCount: number }>;
  conversionRate: number;
  categoryBreakdown: Array<{ category: string; count: number }>;
}

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

function TryOnAnalyticsContent() {
  const { t } = useI18n();
  const [period, setPeriod] = useState<Period>(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TryOnAnalytics | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/try-on/analytics?days=${period}`)
      .then((res) => {
        if (!res.ok) throw new Error('Erreur chargement analytics');
        return res.json();
      })
      .then((raw) => {
        const d = raw.data ?? raw;
        setData({
          totalSessions: d.totalSessions ?? 0,
          totalProductsTried: d.totalProductsTried ?? 0,
          totalScreenshots: d.totalScreenshots ?? 0,
          avgSessionDuration: d.avgSessionDuration ?? 0,
          sessionsOverTime: d.sessionsOverTime ?? [],
          topProducts: d.topProducts ?? [],
          conversionRate: d.conversionRate ?? 0,
          categoryBreakdown: d.categoryBreakdown ?? [],
        });
      })
      .catch(() => setError(t('analytics.errorLoadTryOn')))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const handleExport = useCallback(() => {
    if (!data) return;
    const rows = data.sessionsOverTime.map((d) => ({ date: d.date, sessions: d.count }));
    if (rows.length === 0) rows.push({ date: '', sessions: 0 });
    downloadCSV(rows, `try-on-analytics-${period}d.csv`);
  }, [data, period]);

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-center">
        <p className="text-red-400">{error}</p>
        <Button variant="outline" className="mt-4 border-gray-600" onClick={() => setError(null)}>
          {t('analytics.retry')}
        </Button>
      </div>
    );
  }

  if (loading) {
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

  const d = data!;
  const pieData = d.categoryBreakdown.map((c) => ({ name: c.category, value: c.count }));

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
            <Camera className="w-8 h-8 text-cyan-400" />
            <div>
              <h1 className="text-2xl font-bold text-white">{t('analytics.tryOnPageTitle')}</h1>
              <p className="text-sm text-gray-400">{t('analytics.tryOnPageSubtitle')}</p>
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
            {t('analytics.exportCsv')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <p className="text-sm text-gray-400">{t('analytics.totalSessions')}</p>
            <p className="text-2xl font-bold text-white">{d.totalSessions}</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <p className="text-sm text-gray-400">{t('analytics.productsTried')}</p>
            <p className="text-2xl font-bold text-white">{d.totalProductsTried}</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <p className="text-sm text-gray-400">{t('analytics.screenshots')}</p>
            <p className="text-2xl font-bold text-white">{d.totalScreenshots}</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <p className="text-sm text-gray-400">{t('analytics.conversionRate')}</p>
            <p className="text-2xl font-bold text-white">{d.conversionRate}%</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">{t('analytics.sessionsOverTime')}</CardTitle>
          </CardHeader>
          <CardContent>
            {d.sessionsOverTime.length === 0 ? (
              <p className="text-gray-400 text-sm py-8 text-center">{t('analytics.noSessionData')}</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={d.sessionsOverTime}>
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
            <CardTitle className="text-white">{t('analytics.byCategory')}</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <p className="text-gray-400 text-sm py-8 text-center">{t('analytics.noDataAvailable')}</p>
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

      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">{t('analytics.topTried')}</CardTitle>
        </CardHeader>
        <CardContent>
          {d.topProducts.length === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center">{t('analytics.noProductsYet')}</p>
          ) : (
            <ul className="space-y-2">
              {d.topProducts.map((p, i) => (
                <li key={p.productId || i} className="flex justify-between text-sm">
                  <span className="text-white">{p.productName}</span>
                  <span className="text-gray-400">{p.tryCount}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function TryOnAnalyticsPage() {
  return (
    <ErrorBoundary level="page" componentName="TryOnAnalyticsPage">
      <TryOnAnalyticsContent />
    </ErrorBoundary>
  );
}
