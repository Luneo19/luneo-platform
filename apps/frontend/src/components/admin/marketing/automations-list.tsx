/**
 * ★★★ AUTOMATIONS LIST ★★★
 * Liste des automations avec stats et actions
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Play, Pause, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Automation } from '@/hooks/admin/use-automations';
import { api } from '@/lib/api/client';
import { useToast } from '@/hooks/use-toast';
import { getErrorDisplayMessage } from '@/lib/hooks/useErrorToast';
import { logger } from '@/lib/logger';

export interface AutomationsListProps {
  automations: Automation[];
  isLoading?: boolean;
  onRefresh?: () => Promise<unknown>;
}

const statusColors: Record<string, string> = {
  active: 'bg-green-500/20 text-green-400',
  paused: 'bg-yellow-500/20 text-yellow-400',
  draft: 'bg-zinc-500/20 text-zinc-400',
};

function getAutomationDisplayName(automation: Automation): string {
  const rawName = String(automation.name || '').trim();
  const id = String(automation.id || '').trim();
  const looksLikeUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(rawName);

  if (!rawName || rawName === id || looksLikeUuid) {
    const shortId = id ? id.slice(0, 8) : 'draft';
    return `Automation ${shortId}`;
  }

  return rawName;
}

export function AutomationsList({ automations, isLoading, onRefresh }: AutomationsListProps) {
  const [loadingId, setLoadingId] = React.useState<string | null>(null);
  const { toast } = useToast();

  const toggleStatus = React.useCallback(async (automation: Automation) => {
    const nextStatus = automation.status === 'active' ? 'paused' : 'active';
    setLoadingId(automation.id);
    try {
      await api.put(`/api/admin/marketing/automations/${automation.id}`, {
        status: nextStatus,
        active: nextStatus === 'active',
      });
      await onRefresh?.();
      toast({
        title: 'Automation updated',
        description:
          nextStatus === 'active'
            ? 'Automation activated successfully'
            : 'Automation paused successfully',
      });
    } catch (error) {
      logger.error('Failed to toggle automation status', error);
      toast({
        variant: 'destructive',
        title: 'Update failed',
        description: getErrorDisplayMessage(error),
      });
    } finally {
      setLoadingId(null);
    }
  }, [onRefresh, toast]);

  const testAutomation = React.useCallback(async (automationId: string) => {
    setLoadingId(automationId);
    try {
      const result = await api.post<{ message?: string }>('/api/admin/marketing/automations/test', { id: automationId });
      toast({
        title: 'Automation test sent',
        description: result?.message || 'Test workflow executed successfully',
      });
      await onRefresh?.();
    } catch (error) {
      logger.error('Failed to test automation', error);
      toast({
        variant: 'destructive',
        title: 'Test failed',
        description: getErrorDisplayMessage(error),
      });
    } finally {
      setLoadingId(null);
    }
  }, [onRefresh, toast]);

  if (isLoading) {
    return (
      <Card className="bg-zinc-800 border-zinc-700">
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-zinc-700 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (automations.length === 0) {
    return (
      <Card className="bg-zinc-800 border-zinc-700">
        <CardContent className="p-12 text-center">
          <p className="text-zinc-400 mb-4">No automations found</p>
          <Link href="/admin/marketing/automations/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create First Automation
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {automations.map((automation) => {
        const stats = automation.stats ?? {
          sent: 0,
          opened: 0,
          clicked: 0,
          converted: 0,
          openRate: 0,
          clickRate: 0,
          conversionRate: 0,
        };

        return (
          <Card
            key={automation.id}
            className="bg-zinc-800 border-zinc-700 hover:border-zinc-600 transition-colors"
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-white">{getAutomationDisplayName(automation)}</h3>
                  <Badge
                    variant="secondary"
                    className={cn('text-xs', statusColors[automation.status])}
                  >
                    {automation.status.charAt(0).toUpperCase() + automation.status.slice(1)}
                  </Badge>
                </div>
                <p className="text-sm text-zinc-400 mb-4">
                  Trigger: <span className="text-white">{automation.trigger}</span> •{' '}
                  {automation.steps.length} steps
                </p>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <span className="text-xs text-zinc-500">Sent (30d)</span>
                    <p className="text-lg font-semibold text-white">{stats.sent}</p>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-500">Open Rate</span>
                    <p className="text-lg font-semibold text-white">
                      {stats.openRate.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-500">Click Rate</span>
                    <p className="text-lg font-semibold text-white">
                      {stats.clickRate.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-500">Conversions</span>
                    <p className="text-lg font-semibold text-green-400">
                      {stats.converted}
                    </p>
                  </div>
                </div>

                {/* Steps Preview */}
                <div className="flex items-center gap-2 flex-wrap">
                  {automation.steps.slice(0, 5).map((step, index) => (
                    <div
                      key={step.id}
                      className="flex items-center gap-2 text-xs text-zinc-400"
                    >
                      {index > 0 && <span>→</span>}
                      <span className="px-2 py-1 bg-zinc-700 rounded">
                        {step.type === 'email' ? '📧 Email' : step.type === 'wait' ? '⏰ Wait' : step.type}
                      </span>
                    </div>
                  ))}
                  {automation.steps.length > 5 && (
                    <span className="text-xs text-zinc-500">
                      +{automation.steps.length - 5} more
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 ml-4">
                {automation.status === 'active' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-zinc-700 text-zinc-100 hover:bg-zinc-800"
                    disabled={loadingId === automation.id}
                    onClick={() => toggleStatus(automation)}
                  >
                    <Pause className="w-4 h-4 mr-2" />
                    {loadingId === automation.id ? 'Updating...' : 'Pause'}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-zinc-700 text-zinc-100 hover:bg-zinc-800"
                    disabled={loadingId === automation.id}
                    onClick={() => toggleStatus(automation)}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {loadingId === automation.id ? 'Updating...' : 'Activate'}
                  </Button>
                )}
                <Link href={`/admin/marketing/automations/${automation.id}/edit`}>
                  <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-100 hover:bg-zinc-800">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={loadingId === automation.id}
                  onClick={() => testAutomation(automation.id)}
                  title="Run test"
                >
                  <Play className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
