'use client';

/**
 * ORION Communications Hub
 */
import React, { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, ArrowLeft, Loader2, FileText, List, BarChart3 } from 'lucide-react';

async function fetcher(url: string) {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}

type TabId = 'templates' | 'logs' | 'stats';

type TemplateCategory =
  | 'ONBOARDING'
  | 'RETENTION'
  | 'ENGAGEMENT'
  | 'TRANSACTIONAL'
  | 'PROMOTIONAL'
  | string;

type CommunicationTemplate = {
  id: string;
  name: string;
  subject?: string | null;
  category?: TemplateCategory | null;
  createdAt?: string;
};

type LogStatus = 'SENT' | 'DELIVERED' | 'OPENED' | 'CLICKED' | 'FAILED';

type CommunicationLog = {
  id: string;
  recipientEmail?: string | null;
  templateName?: string | null;
  templateId?: string | null;
  status?: LogStatus | null;
  sentAt?: string | null;
};

type CommunicationStats = {
  totalSent?: number;
  deliveryRate?: number | null;
  openRate?: number | null;
  clickRate?: number | null;
};

function formatDate(d: string | undefined | null): string {
  if (!d) return '—';
  const date = new Date(d);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function categoryBadgeClass(category: TemplateCategory | undefined | null): string {
  switch (category) {
    case 'ONBOARDING':
      return 'bg-violet-500/20 text-violet-400 border-violet-500/30';
    case 'RETENTION':
      return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    case 'ENGAGEMENT':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'TRANSACTIONAL':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'PROMOTIONAL':
      return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
    default:
      return 'bg-zinc-600/50 text-zinc-300 border-zinc-500/50';
  }
}

function statusBadgeClass(status: LogStatus | undefined | null): string {
  switch (status) {
    case 'SENT':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'DELIVERED':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'OPENED':
      return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    case 'CLICKED':
      return 'bg-violet-500/20 text-violet-400 border-violet-500/30';
    case 'FAILED':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    default:
      return 'bg-zinc-600/50 text-zinc-300 border-zinc-500/50';
  }
}

export default function OrionCommunicationsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('templates');

  const templatesKey = activeTab === 'templates' ? '/api/admin/orion/communications/templates' : null;
  const logsKey = activeTab === 'logs' ? '/api/admin/orion/communications/logs' : null;
  const statsKey = activeTab === 'stats' ? '/api/admin/orion/communications/stats' : null;

  const { data: templatesData, error: templatesError, isLoading: templatesLoading } = useSWR<
    CommunicationTemplate[] | { error?: string }
  >(templatesKey, fetcher, { revalidateOnFocus: false });

  const { data: logsData, error: logsError, isLoading: logsLoading } = useSWR<
    CommunicationLog[] | { error?: string }
  >(logsKey, fetcher, { revalidateOnFocus: false });

  const { data: statsData, error: statsError, isLoading: statsLoading } = useSWR<
    CommunicationStats | { error?: string }
  >(statsKey, fetcher, { revalidateOnFocus: false });

  const templates: CommunicationTemplate[] = Array.isArray(templatesData)
    ? templatesData
    : [];
  const logs: CommunicationLog[] = Array.isArray(logsData) ? logsData : [];
  const stats: CommunicationStats =
    statsData && typeof statsData === 'object' && !Array.isArray(statsData) && !('error' in statsData)
      ? (statsData as CommunicationStats)
      : {};

  const templatesFailed = !!templatesError || (templatesKey && !templatesLoading && !Array.isArray(templatesData));
  const logsFailed = !!logsError || (logsKey && !logsLoading && !Array.isArray(logsData));
  const statsFailed = !!statsError;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/orion">
          <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Mail className="h-8 w-8 text-violet-400" />
            Communications Hub
          </h1>
          <p className="mt-1 text-zinc-400">
            Templates, delivery logs and communication stats
          </p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-zinc-700 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'templates'
              ? 'bg-blue-600 text-white'
              : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
          }`}
        >
          <FileText className="h-4 w-4 inline-block mr-2 align-middle" />
          Templates
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'logs'
              ? 'bg-blue-600 text-white'
              : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
          }`}
        >
          <List className="h-4 w-4 inline-block mr-2 align-middle" />
          Logs
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'stats'
              ? 'bg-blue-600 text-white'
              : 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
          }`}
        >
          <BarChart3 className="h-4 w-4 inline-block mr-2 align-middle" />
          Stats
        </button>
      </div>

      {activeTab === 'templates' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Templates</h2>
          {templatesLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
          )}
          {templatesFailed && !templatesLoading && (
            <Card className="border-zinc-700 bg-zinc-800/50">
              <CardContent className="py-6 text-center text-zinc-400">
                Failed to load templates. The API may be unavailable.
              </CardContent>
            </Card>
          )}
          {!templatesLoading && !templatesFailed && templates.length === 0 && (
            <Card className="border-zinc-700 bg-zinc-800/50">
              <CardContent className="py-12 text-center text-zinc-400">
                No templates yet.
              </CardContent>
            </Card>
          )}
          {!templatesLoading && !templatesFailed && templates.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {templates.map((t) => (
                <Card key={t.id} className="border-zinc-700 bg-zinc-800/50">
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                    <CardTitle className="text-base font-medium text-white">
                      {t.name}
                    </CardTitle>
                    <Badge
                      variant="secondary"
                      className={categoryBadgeClass(t.category)}
                    >
                      {t.category ?? '—'}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-zinc-400">
                      Subject: {t.subject ?? '—'}
                    </p>
                    <p className="text-xs text-zinc-500">
                      Created {formatDate(t.createdAt ?? undefined)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Logs</h2>
          {logsLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
          )}
          {logsFailed && !logsLoading && (
            <Card className="border-zinc-700 bg-zinc-800/50">
              <CardContent className="py-6 text-center text-zinc-400">
                Failed to load logs. The API may be unavailable.
              </CardContent>
            </Card>
          )}
          {!logsLoading && !logsFailed && logs.length === 0 && (
            <Card className="border-zinc-700 bg-zinc-800/50">
              <CardContent className="py-12 text-center text-zinc-400">
                No logs yet.
              </CardContent>
            </Card>
          )}
          {!logsLoading && !logsFailed && logs.length > 0 && (
            <Card className="border-zinc-700 bg-zinc-800/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-700 bg-zinc-800/80">
                      <th className="text-left py-3 px-4 font-medium text-zinc-400">Recipient</th>
                      <th className="text-left py-3 px-4 font-medium text-zinc-400">Template</th>
                      <th className="text-left py-3 px-4 font-medium text-zinc-400">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-zinc-400">Sent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-700">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-zinc-800/50">
                        <td className="py-3 px-4 text-white">
                          {log.recipientEmail ?? '—'}
                        </td>
                        <td className="py-3 px-4 text-zinc-400">
                          {log.templateName ?? log.templateId ?? '—'}
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant="secondary"
                            className={statusBadgeClass(log.status ?? null)}
                          >
                            {log.status ?? '—'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-zinc-400">
                          {formatDate(log.sentAt ?? undefined)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Stats</h2>
          {statsLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
          )}
          {!statsLoading && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="border-zinc-700 bg-zinc-800/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-400">Total Sent</CardTitle>
                  <Mail className="h-4 w-4 text-zinc-500" />
                </CardHeader>
                <CardContent>
                  <span className="text-2xl font-bold text-white">
                    {statsFailed || stats.totalSent == null ? '—' : stats.totalSent}
                  </span>
                </CardContent>
              </Card>
              <Card className="border-zinc-700 bg-zinc-800/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-400">Delivery Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <span className="text-2xl font-bold text-white">
                    {statsFailed || stats.deliveryRate == null
                      ? '—'
                      : `${Number(stats.deliveryRate).toFixed(1)}%`}
                  </span>
                </CardContent>
              </Card>
              <Card className="border-zinc-700 bg-zinc-800/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-400">Open Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <span className="text-2xl font-bold text-white">
                    {statsFailed || stats.openRate == null
                      ? '—'
                      : `${Number(stats.openRate).toFixed(1)}%`}
                  </span>
                </CardContent>
              </Card>
              <Card className="border-zinc-700 bg-zinc-800/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-zinc-400">Click Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <span className="text-2xl font-bold text-white">
                    {statsFailed || stats.clickRate == null
                      ? '—'
                      : `${Number(stats.clickRate).toFixed(1)}%`}
                  </span>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
