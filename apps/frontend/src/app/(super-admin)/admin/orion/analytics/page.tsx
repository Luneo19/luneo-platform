'use client';

import React from 'react';
import {
  BarChart3,
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Mail,
  Activity,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import useSWR from 'swr';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

async function fetcher(url: string) {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch');
  return res.json();
}

function formatCurrency(value: number | undefined | null): string {
  if (value == null || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
}

function formatNum(value: number | undefined | null): string {
  if (value == null || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('en-US').format(value);
}

function formatPct(value: number | undefined | null): string {
  if (value == null || Number.isNaN(value)) return '—';
  return `${Number(value).toFixed(1)}%`;
}

function formatDate(value: string | undefined | null): string {
  if (!value) return '—';
  const d = new Date(value);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

type OverviewData = {
  agents?: unknown[];
  metrics?: {
    totalCustomers?: number;
    activeCustomers?: number;
    atRiskCustomers?: number;
    agentsActive?: number;
    agentsTotal?: number;
  };
};

type RevenueData = {
  mrr?: number;
  arr?: number;
  growthRate?: number;
  churnRevenue?: number;
  expansionRevenue?: number;
  arpu?: number;
  ltv?: number;
  trialConversions?: number;
};

type RetentionData = {
  totalUsers?: number;
  avgHealthScore?: number;
  atRiskCount?: number;
  atRiskPercent?: number;
  churnRate?: number;
};

type CommsStats = {
  totalTemplates?: number;
  totalCampaigns?: number;
  totalSent?: number;
  totalLogs?: number;
  delivered?: number;
  opened?: number;
  clicked?: number;
  converted?: number;
};

type AgentRow = {
  id: string;
  name: string;
  displayName?: string;
  status?: string;
  lastRunAt?: string | null;
};

export default function OrionAnalyticsPage() {
  const overviewKey = '/api/admin/orion/overview';
  const revenueKey = '/api/admin/orion/revenue';
  const retentionKey = '/api/admin/orion/retention';
  const commsKey = '/api/admin/orion/communications/stats';
  const agentsKey = '/api/admin/orion/agents';

  const { data: overview, error: overviewError, isLoading: overviewLoading, mutate: mutateOverview } = useSWR<OverviewData>(overviewKey, fetcher);
  const { data: revenue, error: revenueError, isLoading: revenueLoading, mutate: mutateRevenue } = useSWR<RevenueData>(revenueKey, fetcher);
  const { data: retention, error: retentionError, isLoading: retentionLoading, mutate: mutateRetention } = useSWR<RetentionData>(retentionKey, fetcher);
  const { data: comms, error: commsError, isLoading: commsLoading, mutate: mutateComms } = useSWR<CommsStats>(commsKey, fetcher);
  const { data: agents, error: agentsError, isLoading: agentsLoading, mutate: mutateAgents } = useSWR<AgentRow[]>(agentsKey, fetcher);

  const isLoading = overviewLoading || revenueLoading || retentionLoading || commsLoading || agentsLoading;
  const hasError = overviewError || revenueError || retentionError || commsError || agentsError;

  const refresh = () => {
    mutateOverview();
    mutateRevenue();
    mutateRetention();
    mutateComms();
    mutateAgents();
  };

  const mrr = revenue?.mrr;
  const activeUsers = overview?.metrics?.activeCustomers ?? overview?.metrics?.totalCustomers;
  const churnRate = retention?.churnRate ?? retention?.atRiskPercent;
  const avgHealth = retention?.avgHealthScore;

  const agentList = Array.isArray(agents) ? agents : [];

  const funnelSteps = [
    { label: 'Sent', value: comms?.totalSent, color: 'bg-slate-500' },
    { label: 'Delivered', value: comms?.delivered, color: 'bg-blue-600' },
    { label: 'Opened', value: comms?.opened, color: 'bg-amber-600' },
    { label: 'Clicked', value: comms?.clicked, color: 'bg-emerald-600' },
    { label: 'Converted', value: comms?.converted, color: 'bg-violet-600' },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="border-b border-zinc-800 bg-zinc-900/50 px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/orion"
              className="inline-flex items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800/80 p-2 text-zinc-300 transition hover:bg-zinc-700 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-amber-500" />
              <div>
                <h1 className="text-xl font-semibold tracking-tight">Analytics Dashboard</h1>
                <p className="text-sm text-zinc-400">ORION metrics, revenue, retention & communications</p>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={isLoading}
            className="border-zinc-600 bg-zinc-800/80 text-zinc-200 hover:bg-zinc-700"
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {hasError && (
          <div className="rounded-lg border border-amber-800/60 bg-amber-950/30 px-4 py-3 text-amber-200 text-sm">
            Some metrics could not be loaded. Showing available data.
          </div>
        )}

        {isLoading && !overview && !revenue && !retention ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
          </div>
        ) : (
          <>
            {/* Real-Time Metrics — top row */}
            <section>
              <h2 className="text-sm font-medium text-zinc-400 mb-3">Real-Time Metrics</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-zinc-800 bg-zinc-900/80">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" /> MRR
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold">{revenueLoading ? '…' : formatCurrency(mrr)}</p>
                  </CardContent>
                </Card>
                <Card className="border-zinc-800 bg-zinc-900/80">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                      <Users className="h-4 w-4" /> Active Users
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold">{overviewLoading ? '…' : formatNum(activeUsers)}</p>
                  </CardContent>
                </Card>
                <Card className="border-zinc-800 bg-zinc-900/80">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                      <TrendingDown className="h-4 w-4" /> Churn Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold">{retentionLoading ? '…' : formatPct(churnRate)}</p>
                  </CardContent>
                </Card>
                <Card className="border-zinc-800 bg-zinc-900/80">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                      <Activity className="h-4 w-4" /> Avg Health Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold">
                      {retentionLoading ? '…' : avgHealth != null && !Number.isNaN(avgHealth) ? `${Number(avgHealth).toFixed(1)}` : '—'}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Agent Health Status */}
            <section>
              <Card className="border-zinc-800 bg-zinc-900/80">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-amber-500" />
                    Agent Health Status
                  </CardTitle>
                  <CardDescription>ORION agents status and last run</CardDescription>
                </CardHeader>
                <CardContent>
                  {agentsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                    </div>
                  ) : agentList.length === 0 ? (
                    <p className="text-zinc-500 text-sm py-6 text-center">No agents configured.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-zinc-700 hover:bg-transparent">
                          <TableHead className="text-zinc-400">Name</TableHead>
                          <TableHead className="text-zinc-400">Status</TableHead>
                          <TableHead className="text-zinc-400">Type</TableHead>
                          <TableHead className="text-zinc-400">Last Run</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {agentList.map((agent) => (
                          <TableRow key={agent.id} className="border-zinc-800">
                            <TableCell className="font-medium">{agent.displayName || agent.name}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  agent.status === 'ACTIVE'
                                    ? 'border-emerald-600 text-emerald-400 bg-emerald-950/40'
                                    : agent.status === 'MAINTENANCE'
                                      ? 'border-amber-600 text-amber-400 bg-amber-950/40'
                                      : 'border-zinc-600 text-zinc-400 bg-zinc-800/40'
                                }
                              >
                                {agent.status ?? '—'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-zinc-400">{agent.name}</TableCell>
                            <TableCell className="text-zinc-400">{formatDate(agent.lastRunAt)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </section>

            {/* Email Funnel */}
            <section>
              <Card className="border-zinc-800 bg-zinc-900/80">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-amber-500" />
                    Email Funnel
                  </CardTitle>
                  <CardDescription>Sent → Delivered → Opened → Clicked → Converted</CardDescription>
                </CardHeader>
                <CardContent>
                  {commsLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      {funnelSteps.map((step, i) => (
                        <React.Fragment key={step.label}>
                          {i > 0 && <span className="text-zinc-600">→</span>}
                          <div className="flex items-center gap-2">
                            <Badge className={`${step.color} text-white border-0`}>
                              {step.label}: {step.value != null && !Number.isNaN(step.value) ? formatNum(step.value) : '—'}
                            </Badge>
                          </div>
                        </React.Fragment>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

            {/* Revenue Breakdown */}
            <section>
              <Card className="border-zinc-800 bg-zinc-900/80">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-amber-500" />
                    Revenue Breakdown
                  </CardTitle>
                  <CardDescription>ARPU, LTV, expansion and trial conversions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
                      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">ARPU</p>
                      <p className="text-lg font-semibold mt-1">{revenueLoading ? '…' : formatCurrency(revenue?.arpu)}</p>
                    </div>
                    <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
                      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">LTV</p>
                      <p className="text-lg font-semibold mt-1">{revenueLoading ? '…' : formatCurrency(revenue?.ltv)}</p>
                    </div>
                    <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
                      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Expansion Revenue</p>
                      <p className="text-lg font-semibold mt-1 text-emerald-400">
                        {revenueLoading ? '…' : formatCurrency(revenue?.expansionRevenue)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
                      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Trial Conversions</p>
                      <p className="text-lg font-semibold mt-1">
                        {revenueLoading ? '…' : revenue?.trialConversions != null ? formatNum(revenue.trialConversions) : '—'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Retention Overview */}
            <section>
              <Card className="border-zinc-800 bg-zinc-900/80">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-amber-500" />
                    Retention Overview
                  </CardTitle>
                  <CardDescription>Users scored, at-risk count and average health</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
                      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Total Users Scored</p>
                      <p className="text-lg font-semibold mt-1">{retentionLoading ? '…' : formatNum(retention?.totalUsers)}</p>
                    </div>
                    <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
                      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">At-Risk Count</p>
                      <p className="text-lg font-semibold mt-1 text-amber-400">{retentionLoading ? '…' : formatNum(retention?.atRiskCount)}</p>
                    </div>
                    <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
                      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">At-Risk %</p>
                      <p className="text-lg font-semibold mt-1">{retentionLoading ? '…' : formatPct(retention?.atRiskPercent)}</p>
                    </div>
                    <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
                      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Average Health Score</p>
                      <p className="text-lg font-semibold mt-1">
                        {retentionLoading ? '…' : retention?.avgHealthScore != null && !Number.isNaN(retention.avgHealthScore) ? Number(retention.avgHealthScore).toFixed(1) : '—'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
