/**
 * ★★★ AUTOMATIONS LIST ★★★
 * Liste des automations avec stats et actions
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Play, Pause, Edit, Copy, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Automation } from '@/hooks/admin/use-automations';

export interface AutomationsListProps {
  automations: Automation[];
  isLoading?: boolean;
}

const statusColors: Record<string, string> = {
  active: 'bg-green-500/20 text-green-400',
  paused: 'bg-yellow-500/20 text-yellow-400',
  draft: 'bg-zinc-500/20 text-zinc-400',
};

export function AutomationsList({ automations, isLoading }: AutomationsListProps) {
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
      {automations.map((automation) => (
        <Card
          key={automation.id}
          className="bg-zinc-800 border-zinc-700 hover:border-zinc-600 transition-colors"
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-white">{automation.name}</h3>
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
                    <p className="text-lg font-semibold text-white">{automation.stats.sent}</p>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-500">Open Rate</span>
                    <p className="text-lg font-semibold text-white">
                      {automation.stats.openRate.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-500">Click Rate</span>
                    <p className="text-lg font-semibold text-white">
                      {automation.stats.clickRate.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-zinc-500">Conversions</span>
                    <p className="text-lg font-semibold text-green-400">
                      {automation.stats.converted}
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
                  <Button variant="outline" size="sm">
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </Button>
                ) : (
                  <Button variant="outline" size="sm">
                    <Play className="w-4 h-4 mr-2" />
                    Activate
                  </Button>
                )}
                <Link href={`/admin/marketing/automations/${automation.id}/edit`}>
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </Link>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
