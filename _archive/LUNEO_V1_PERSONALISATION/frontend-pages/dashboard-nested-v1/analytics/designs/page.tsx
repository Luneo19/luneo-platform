'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { ArrowLeft, Download, Palette, Loader2 } from 'lucide-react';
import { logger } from '@/lib/logger';
import { endpoints } from '@/lib/api/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const PERIODS = [
  { value: 7, label: '7j' },
  { value: 30, label: '30j' },
  { value: 90, label: '90j' },
] as const;

type Period = (typeof PERIODS)[number]['value'];

interface DesignRow {
  id: string;
  name: string | null;
  status: string;
  createdAt: string;
  previewUrl?: string | null;
  viewCount?: number;
}

const COLORS = ['#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#6366f1'];

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

function DesignsContent() {
  const { t } = useI18n();
  const [period, setPeriod] = useState<Period>(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [designs, setDesigns] = useState<DesignRow[]>([]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const load = async () => {
      try {
        const data = await endpoints.designs.list({ limit: 100 });
        const rawList = Array.isArray(data) ? data : (data as { designs?: unknown[] })?.designs ?? [];
        const list = rawList as Array<{ id: string; name?: string | null; status?: string; createdAt?: string; previewUrl?: string | null; viewCount?: number }>;
        const since = new Date();
        since.setDate(since.getDate() - period);
        const filtered = list.filter((d) => {
          if (!d.createdAt) return true;
          return new Date(d.createdAt) >= since;
        });
        setDesigns(
          filtered.map((d) => ({
            id: d.id,
            name: d.name ?? null,
            status: d.status ?? 'PENDING',
            createdAt: d.createdAt ?? '',
            previewUrl: d.previewUrl ?? null,
            viewCount: d.viewCount ?? 0,
          }))
        );
      } catch (err) {
        logger.error('Designs analytics load error', { error: err });
        setError(t('analytics.errorLoadDesigns'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [period, t]);

  const stats = useMemo(() => {
    const total = designs.length;
    const thisMonth = designs.filter((d) => {
      const t = new Date(d.createdAt);
      const now = new Date();
      return t.getMonth() === now.getMonth() && t.getFullYear() === now.getFullYear();
    }).length;
    const completed = designs.filter((d) => d.status === 'COMPLETED').length;
    const completedRate = total ? Math.round((completed / total) * 100) : 0;
    const weeks = Math.max(1, Math.ceil(period / 7));
    const avgPerWeek = Math.round((total / weeks) * 10) / 10;
    return { total, thisMonth, completedRate, avgPerWeek };
  }, [designs, period]);

  const areaData = useMemo(() => {
    const byDate: Record<string, number> = {};
    designs.forEach((d) => {
      const key = d.createdAt ? d.createdAt.slice(0, 10) : '';
      if (key) byDate[key] = (byDate[key] ?? 0) + 1;
    });
    return Object.entries(byDate)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }));
  }, [designs]);

  const pieData = useMemo(() => {
    const byStatus: Record<string, number> = {};
    designs.forEach((d) => {
      const s = d.status || 'Draft';
      byStatus[s] = (byStatus[s] ?? 0) + 1;
    });
    return Object.entries(byStatus).map(([name, value]) => ({ name, value }));
  }, [designs]);

  const barData = useMemo(() => {
    const categories = ['Jewelry', 'Watches', 'Glasses', 'Autre'];
    const byCat: Record<string, number> = {};
    categories.forEach((c) => (byCat[c] = 0));
    designs.forEach((d) => {
      const name = (d.name ?? '').toLowerCase();
      if (name.includes('watch') || name.includes('montre')) byCat['Watches']++;
      else if (name.includes('glass') || name.includes('lunette')) byCat['Glasses']++;
      else if (name.includes('ring') || name.includes('necklace') || name.includes('bijou')) byCat['Jewelry']++;
      else byCat['Autre']++;
    });
    return Object.entries(byCat).map(([name, count]) => ({ name, count }));
  }, [designs]);

  const topViewed = useMemo(
    () => [...designs].sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0)).slice(0, 10),
    [designs]
  );

  const handleExport = useCallback(() => {
    downloadCSV(
      designs.map((d) => ({
        id: d.id,
        name: d.name ?? '',
        status: d.status,
        createdAt: d.createdAt,
        views: d.viewCount ?? 0,
      })),
      `designs-analytics-${period}d.csv`
    );
  }, [designs, period]);

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
            <Palette className="w-8 h-8 text-cyan-400" />
            <div>
              <h1 className="text-2xl font-bold text-white">{t('analytics.designsPageTitle')}</h1>
              <p className="text-sm text-gray-400">{t('analytics.designsPageSubtitle')}</p>
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
            <p className="text-sm text-gray-400">{t('analytics.totalDesigns')}</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <p className="text-sm text-gray-400">{t('analytics.thisMonth')}</p>
            <p className="text-2xl font-bold text-white">{stats.thisMonth}</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <p className="text-sm text-gray-400">{t('analytics.completionRate')}</p>
            <p className="text-2xl font-bold text-white">{stats.completedRate}%</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-4">
            <p className="text-sm text-gray-400">{t('analytics.avgPerWeek')}</p>
            <p className="text-2xl font-bold text-white">{stats.avgPerWeek}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">{t('analytics.designsOverTime')}</CardTitle>
          </CardHeader>
          <CardContent>
            {areaData.length === 0 ? (
              <p className="text-gray-400 text-sm py-8 text-center">{t('analytics.noData')}</p>
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
            <CardTitle className="text-white">{t('analytics.byStatus')}</CardTitle>
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
          <CardTitle className="text-white">{t('analytics.byCategory')}</CardTitle>
        </CardHeader>
        <CardContent>
          {barData.every((d) => d.count === 0) ? (
            <p className="text-gray-400 text-sm py-8 text-center">{t('analytics.noDataAvailable')}</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis type="number" stroke="#9ca3af" fontSize={12} />
                <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize={12} width={70} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">{t('analytics.topViewed')}</CardTitle>
        </CardHeader>
        <CardContent>
          {topViewed.length === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center">{t('analytics.noDesignsYet')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700 hover:bg-transparent">
                  <TableHead className="text-gray-400">{t('analytics.design')}</TableHead>
                  <TableHead className="text-gray-400">{t('support.status')}</TableHead>
                  <TableHead className="text-gray-400">{t('analytics.metrics.views')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topViewed.map((d) => (
                  <TableRow key={d.id} className="border-gray-700">
                    <TableCell className="text-white font-medium">{d.name ?? d.id.slice(0, 8)}</TableCell>
                    <TableCell className="text-gray-400">{d.status}</TableCell>
                    <TableCell className="text-gray-400">{d.viewCount ?? 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function DesignAnalyticsPage() {
  return (
    <ErrorBoundary level="page" componentName="DesignAnalyticsPage">
      <DesignsContent />
    </ErrorBoundary>
  );
}
