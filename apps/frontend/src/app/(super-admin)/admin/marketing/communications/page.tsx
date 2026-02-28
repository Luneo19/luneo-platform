/**
 * ★★★ ADMIN COMMUNICATIONS LOG PAGE ★★★
 * Log des communications envoyées (emails, notifications)
 * ✅ Données réelles depuis l'API backend (orion/communications/logs)
 */

'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, RefreshCw, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { normalizeListResponse } from '@/lib/api/normalize';

interface CommunicationLog {
  id: string;
  type: string;
  to: string;
  subject?: string;
  status: string;
  sentAt?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

interface CommunicationStats {
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  openRate: number;
  clickRate: number;
}

async function fetcher(url: string) {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch');
  const raw = await res.json();
  return raw.data ?? raw;
}

const statusConfig = {
  sent: { icon: CheckCircle, color: 'text-green-400', label: 'Sent' },
  delivered: { icon: CheckCircle, color: 'text-blue-400', label: 'Delivered' },
  failed: { icon: XCircle, color: 'text-red-400', label: 'Failed' },
  pending: { icon: Clock, color: 'text-yellow-400', label: 'Pending' },
  queued: { icon: Clock, color: 'text-orange-400', label: 'Queued' },
} as const;

type StatusKey = keyof typeof statusConfig;

function getStatusConfig(status: string) {
  return status in statusConfig
    ? statusConfig[status as StatusKey]
    : statusConfig.pending;
}

export default function CommunicationsPage() {
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const logsUrl = typeFilter === 'all'
    ? '/api/admin/marketing/communications/logs'
    : `/api/admin/marketing/communications/logs?type=${typeFilter}`;

  const { data: logs, isLoading: logsLoading, error: logsError, mutate } = useSWR<CommunicationLog[]>(
    logsUrl,
    fetcher,
    { revalidateOnFocus: true }
  );

  const { data: stats, isLoading: statsLoading } = useSWR<CommunicationStats>(
    '/api/admin/marketing/communications/stats',
    fetcher
  );

  const communicationLogs = normalizeListResponse<CommunicationLog>(logs);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Mail className="w-8 h-8 text-purple-400" />
            Communications Log
          </h1>
          <p className="text-white/80 mt-2">
            Track all sent emails, notifications and communications
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => mutate()}
          className="border-white/10 text-white/70 hover:text-white hover:bg-white/5"
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {!statsLoading && stats && (
        <div className="grid gap-4 md:grid-cols-5">
          {[
            { label: 'Total Sent', value: stats.totalSent, color: 'text-blue-400' },
            { label: 'Delivered', value: stats.totalDelivered, color: 'text-green-400' },
            { label: 'Failed', value: stats.totalFailed, color: 'text-red-400' },
            { label: 'Open Rate', value: `${stats.openRate}%`, color: 'text-purple-400' },
            { label: 'Click Rate', value: `${stats.clickRate}%`, color: 'text-amber-400' },
          ].map((stat) => (
            <Card key={stat.label} className="bg-white/[0.03] border-white/[0.06]">
              <CardContent className="p-4 text-center">
                <p className="text-white/70 text-xs">{stat.label}</p>
                <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-3 items-center">
        <span className="text-white/75 text-sm">Filter by type:</span>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px] bg-white/[0.03] border-white/[0.06] text-white">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a2e] border-white/[0.08] text-white">
            <SelectItem value="all" className="text-white focus:bg-white/[0.06] focus:text-white">All</SelectItem>
            <SelectItem value="email" className="text-white focus:bg-white/[0.06] focus:text-white">Email</SelectItem>
            <SelectItem value="notification" className="text-white focus:bg-white/[0.06] focus:text-white">Notification</SelectItem>
            <SelectItem value="sms" className="text-white focus:bg-white/[0.06] focus:text-white">SMS</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading State */}
      {logsLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          <span className="ml-3 text-white/80">Loading communications...</span>
        </div>
      )}

      {/* Error State */}
      {logsError && !logsLoading && (
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="p-6 text-center">
            <p className="text-red-400">Failed to load communications. Backend may not be available.</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => mutate()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Communications Table */}
      {!logsLoading && !logsError && (
        <Card className="bg-white/[0.03] border-white/[0.06]">
          <CardContent className="p-0">
            {communicationLogs.length === 0 ? (
              <div className="p-12 text-center">
                <Mail className="w-12 h-12 mx-auto text-white/20 mb-4" />
                <p className="text-white/70">No communications found</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.06]">
                {/* Table Header */}
                <div className="grid grid-cols-5 gap-4 p-4 text-xs text-white/70 uppercase tracking-wider">
                  <span>Status</span>
                  <span>Type</span>
                  <span>Recipient</span>
                  <span>Subject</span>
                  <span>Date</span>
                </div>
                {/* Table Rows */}
                {communicationLogs.map((log) => {
                  const config = getStatusConfig(log.status);
                  const StatusIcon = config.icon;
                  return (
                    <div key={log.id} className="grid grid-cols-5 gap-4 p-4 text-sm hover:bg-white/[0.02]">
                      <div className="flex items-center gap-2">
                        <StatusIcon className={`w-4 h-4 ${config.color}`} />
                        <span className={config.color}>{config.label}</span>
                      </div>
                      <div>
                        <Badge variant="outline" className="text-xs text-white/75 border-white/10">
                          {log.type}
                        </Badge>
                      </div>
                      <span className="text-white/70 truncate">{log.to}</span>
                      <span className="text-white/75 truncate">{log.subject || '-'}</span>
                      <span className="text-white/30">
                        {new Date(log.sentAt || log.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
