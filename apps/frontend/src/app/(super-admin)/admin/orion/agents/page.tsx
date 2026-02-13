'use client';

import React, { useCallback, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Play, Pause, ChevronRight, Bot } from 'lucide-react';
import { useAgentDetail } from '@/hooks/admin/use-agent-detail';
import { logger } from '@/lib/logger';

const AGENT_ROUTES: Record<string, string> = {
  ACQUISITION: '/admin/orion/agents/apollo',
  ONBOARDING: '/admin/orion/agents/athena',
  COMMUNICATION: '/admin/orion/agents/hermes',
  RETENTION: '/admin/orion/agents/artemis',
  REVENUE: '/admin/orion/agents/hades',
  ANALYTICS: '/admin/orion/agents/zeus',
};

export default function OrionAgentsPage() {
  const { agents, isLoading, error, refresh } = useAgentDetail('');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleStatusToggle = useCallback(
    async (agent: { id: string; status: string }) => {
      setTogglingId(agent.id);
      try {
        const newStatus = agent.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
        const res = await fetch(`/api/admin/orion/agents/${agent.id}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });
        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}));
          logger.error('Agent status toggle failed', { agentId: agent.id, status: res.status, body: errBody });
        } else {
          await refresh();
        }
      } catch (err) {
        logger.error('Agent status toggle failed', { agentId: agent.id, error: err });
      } finally {
        setTogglingId(null);
      }
    },
    [refresh]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/orion">
            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <Card className="bg-zinc-800/80 border-zinc-600">
          <CardContent className="p-6 text-center">
            <p className="text-red-400 mb-4">Failed to load agents.</p>
            <Button variant="outline" onClick={() => refresh()} className="border-zinc-600 text-zinc-200">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            <Bot className="h-8 w-8 text-blue-400" />
            ORION Agents
          </h1>
          <p className="mt-1 text-zinc-400">Manage and monitor all ORION AI agents</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.length === 0 ? (
          <Card className="bg-zinc-800/50 border-zinc-700 col-span-full">
            <CardContent className="p-8 text-center text-zinc-400">
              No agents configured. Initialize agents from the ORION Command Center.
            </CardContent>
          </Card>
        ) : (
          agents.map((agent) => {
            const href = AGENT_ROUTES[agent.type] ?? '#';
            const isActive = agent.status === 'ACTIVE';
            return (
              <Card key={agent.id} className="bg-zinc-800/50 border-zinc-700 hover:border-zinc-600 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                          isActive ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                        aria-hidden
                      />
                      <CardTitle className="text-white text-base truncate">{agent.name}</CardTitle>
                    </div>
                    <Badge
                      variant="secondary"
                      className={
                        isActive
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      }
                    >
                      {agent.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-zinc-500">{(agent as { displayName?: string }).displayName ?? agent.type}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-zinc-400 line-clamp-2">{agent.description ?? '—'}</p>
                  <p className="text-xs text-zinc-500">
                    Last run: {agent.lastRunAt ? new Date(agent.lastRunAt).toLocaleString() : '—'}
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-zinc-600 text-zinc-200 hover:bg-zinc-700"
                      onClick={() => handleStatusToggle(agent)}
                      disabled={togglingId === agent.id}
                    >
                      {togglingId === agent.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isActive ? (
                        <>
                          <Pause className="h-3.5 w-3.5 mr-1" /> Pause
                        </>
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5 mr-1" /> Active
                        </>
                      )}
                    </Button>
                    <Link href={href}>
                      <Button variant="ghost" size="sm" className="text-zinc-300 hover:text-white">
                        View <ChevronRight className="h-4 w-4 ml-0.5" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
