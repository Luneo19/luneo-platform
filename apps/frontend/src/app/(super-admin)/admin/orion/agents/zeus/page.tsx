'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Brain, Loader2, Database, Target, AlertTriangle, FileBarChart } from 'lucide-react';
import { useAgentDetail } from '@/hooks/admin/use-agent-detail';
import { useAgentDomainData } from '@/hooks/admin/use-agent-detail';

type SegmentsOrAnalytics = {
  dataFreshness?: string | number;
  predictionAccuracy?: number;
  anomaliesDetected?: number;
  reportsGenerated?: number;
  reportingSchedule?: string | Record<string, unknown>;
  alertThresholds?: Record<string, number>;
} | null;

type AuditLogEntry = {
  id: string;
  action: string;
  eventType?: string;
  resourceType?: string;
  resource?: string;
  createdAt?: string;
  timestamp?: string;
};

function formatVal(value: unknown): string {
  if (value == null || value === '') return '—';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return value;
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export default function OrionZeusPage() {
  const { agent, isLoading: agentLoading, error: agentError, refresh } = useAgentDetail('ANALYTICS');
  const { data: domainData } = useAgentDomainData<SegmentsOrAnalytics>('/api/admin/orion/segments');
  const { data: auditLogData } = useAgentDomainData<{ items?: AuditLogEntry[] } | AuditLogEntry[]>('/api/admin/orion/audit-log?limit=5');
  const auditLogs = ((auditLogData && (Array.isArray(auditLogData) ? auditLogData : auditLogData.items)) ?? []).slice(0, 5);

  const isError = !!agentError;
  const config = agent?.config as Record<string, unknown> | undefined;

  if (agentLoading && !agent) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/orion/agents">
          <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Brain className="h-8 w-8 text-indigo-400" />
            ZEUS
          </h1>
          <p className="mt-1 text-zinc-400">Analytics Mastermind</p>
          <div className="mt-2 flex items-center gap-2">
            <Badge
              variant="secondary"
              className={
                agent?.status === 'ACTIVE'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
              }
            >
              {agent?.status ?? '—'}
            </Badge>
            <span className="text-xs text-zinc-500">
              Last run: {agent?.lastRunAt ? new Date(agent.lastRunAt).toLocaleString() : '—'}
            </span>
          </div>
        </div>
      </div>

      {isError && (
        <Card className="bg-zinc-800/80 border-zinc-600">
          <CardContent className="p-6 text-center">
            <p className="text-red-400 mb-4">Failed to load agent.</p>
            <Button variant="outline" onClick={() => refresh()} className="border-zinc-600 text-zinc-200">
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {!isError && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                  <Database className="h-4 w-4" /> Data Freshness
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-white">{formatVal(domainData?.dataFreshness ?? config?.dataFreshness)}</p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                  <Target className="h-4 w-4" /> Prediction Accuracy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-white">{formatVal(domainData?.predictionAccuracy ?? config?.predictionAccuracy)}</p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" /> Anomalies Detected
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-white">{formatVal(domainData?.anomaliesDetected ?? config?.anomaliesDetected)}</p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                  <FileBarChart className="h-4 w-4" /> Reports Generated
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-white">{formatVal(domainData?.reportsGenerated ?? config?.reportsGenerated)}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardHeader>
              <CardTitle className="text-white">Reporting schedule & alert thresholds</CardTitle>
              <p className="text-sm text-zinc-400">Current configuration (read-only)</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <dt className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Reporting schedule</dt>
                <dd className="text-white text-sm">{formatVal(domainData?.reportingSchedule ?? config?.reportingSchedule)}</dd>
              </div>
              {((domainData?.alertThresholds ?? config?.alertThresholds) as Record<string, number> | undefined) &&
              Object.keys((domainData?.alertThresholds ?? config?.alertThresholds) as Record<string, number>).length > 0 ? (
                <dl className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                  {Object.entries((domainData?.alertThresholds ?? config?.alertThresholds) as Record<string, number>).map(([key, value]) => (
                    <div key={key} className="flex justify-between gap-2 py-1 border-b border-zinc-700/50">
                      <dt className="text-zinc-400">{key}</dt>
                      <dd className="text-white font-medium">{formatVal(value)}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-zinc-500 text-sm">— No alert thresholds configured</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardHeader>
              <CardTitle className="text-white">Recent Actions</CardTitle>
            </CardHeader>
            <CardContent>
              {auditLogs.length > 0 ? (
                <ul className="space-y-2">
                  {auditLogs.map((log) => (
                    <li key={log.id} className="flex items-center justify-between text-sm border-b border-zinc-700/50 pb-2">
                      <span className="text-zinc-300">{log.action} — {log.resource ?? log.resourceType ?? log.eventType ?? ''}</span>
                      <span className="text-zinc-500 text-xs">{log.timestamp ?? log.createdAt ? new Date(log.timestamp ?? log.createdAt ?? '').toLocaleString() : ''}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-zinc-500 text-sm">No recent activity recorded.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
