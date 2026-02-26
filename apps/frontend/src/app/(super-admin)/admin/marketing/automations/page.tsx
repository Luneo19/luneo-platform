/**
 * ★★★ ADMIN MARKETING AUTOMATIONS PAGE ★★★
 * Page liste des automations email marketing
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { AutomationsList } from '@/components/admin/marketing/automations-list';
import { useAutomations } from '@/hooks/admin/use-automations';
import { cn } from '@/lib/utils';

export default function AutomationsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { automations, isLoading, refresh } = useAutomations();

  const filteredAutomations = React.useMemo(() => {
    if (statusFilter === 'all') return automations;
    return automations.filter((a) => a.status === statusFilter);
  }, [automations, statusFilter]);

  const stats = React.useMemo(() => {
    return {
      all: automations.length,
      active: automations.filter((a) => a.status === 'active').length,
      paused: automations.filter((a) => a.status === 'paused').length,
      draft: automations.filter((a) => a.status === 'draft').length,
    };
  }, [automations]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Email Automations</h1>
          <p className="text-zinc-400 mt-2">
            Create and manage automated email workflows
          </p>
        </div>
        <Link href="/admin/marketing/automations/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Automation
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-zinc-700 pb-4">
        <button
          onClick={() => setStatusFilter('all')}
          className={cn(
            'px-4 py-2 text-sm font-medium transition-colors',
            statusFilter === 'all'
              ? 'text-white border-b-2 border-white'
              : 'text-zinc-400 hover:text-white'
          )}
        >
          All ({stats.all})
        </button>
        <button
          onClick={() => setStatusFilter('active')}
          className={cn(
            'px-4 py-2 text-sm font-medium transition-colors',
            statusFilter === 'active'
              ? 'text-white border-b-2 border-white'
              : 'text-zinc-400 hover:text-white'
          )}
        >
          Active ({stats.active})
        </button>
        <button
          onClick={() => setStatusFilter('paused')}
          className={cn(
            'px-4 py-2 text-sm font-medium transition-colors',
            statusFilter === 'paused'
              ? 'text-white border-b-2 border-white'
              : 'text-zinc-400 hover:text-white'
          )}
        >
          Paused ({stats.paused})
        </button>
        <button
          onClick={() => setStatusFilter('draft')}
          className={cn(
            'px-4 py-2 text-sm font-medium transition-colors',
            statusFilter === 'draft'
              ? 'text-white border-b-2 border-white'
              : 'text-zinc-400 hover:text-white'
          )}
        >
          Draft ({stats.draft})
        </button>
      </div>

      {/* Automations List */}
      <AutomationsList automations={filteredAutomations} isLoading={isLoading} onRefresh={refresh} />
    </div>
  );
}
