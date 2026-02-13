'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, GraduationCap, Loader2, Target, Clock, CheckCircle, ListOrdered } from 'lucide-react';
import { useAgentDetail } from '@/hooks/admin/use-agent-detail';
import { useAgentDomainData } from '@/hooks/admin/use-agent-detail';

type QuickWinStatus = {
  welcomeEmail?: { configured?: boolean; templateId?: string | null };
  activationRate?: number;
  timeToValue?: number;
  onboardingCompletion?: number;
  activeSequences?: number;
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
  return String(value);
}

export default function OrionAthenaPage() {
  const { agent, isLoading: agentLoading, error: agentError, refresh } = useAgentDetail('ONBOARDING');
  const { data: domainData, isLoading: domainLoading } = useAgentDomainData<QuickWinStatus>('/api/admin/orion/quick-wins/status');
  const { data: auditLogData } = useAgentDomainData<{ items?: AuditLogEntry[] } | AuditLogEntry[]>('/api/admin/orion/audit-log?limit=5');
  const auditLogs = ((auditLogData && (Array.isArray(auditLogData) ? auditLogData : auditLogData.items)) ?? []).slice(0, 5);

  const isLoading = agentLoading || domainLoading;
  const isError = !!agentError;

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
            <GraduationCap className="h-8 w-8 text-violet-400" />
            ATHENA
          </h1>
          <p className="mt-1 text-zinc-400">Onboarding Orchestrator</p>
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
                  <Target className="h-4 w-4" /> Activation Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-white">{formatVal(domainData?.activationRate)}</p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Time-to-Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-white">{formatVal(domainData?.timeToValue)}</p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" /> Onboarding Completion
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-white">{formatVal(domainData?.onboardingCompletion)}</p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                  <ListOrdered className="h-4 w-4" /> Active Sequences
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-white">{formatVal(domainData?.activeSequences)}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardHeader>
              <CardTitle className="text-white">Welcome sequence settings</CardTitle>
              <p className="text-sm text-zinc-400">Current configuration (read-only)</p>
            </CardHeader>
            <CardContent className="space-y-2">
              {domainData?.welcomeEmail != null ? (
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between gap-2 py-1 border-b border-zinc-700/50">
                    <dt className="text-zinc-400">Configured</dt>
                    <dd className="text-white font-medium">{domainData.welcomeEmail.configured ? 'Yes' : 'No'}</dd>
                  </div>
                  <div className="flex justify-between gap-2 py-1 border-b border-zinc-700/50">
                    <dt className="text-zinc-400">Template ID</dt>
                    <dd className="text-white font-medium">{formatVal(domainData.welcomeEmail.templateId)}</dd>
                  </div>
                </dl>
              ) : (
                <p className="text-zinc-500 text-sm">— No welcome sequence settings available</p>
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
