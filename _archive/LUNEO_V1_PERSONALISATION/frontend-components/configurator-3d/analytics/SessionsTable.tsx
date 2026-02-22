'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  Smartphone,
  Monitor,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { configurator3dEndpoints } from '@/lib/api/configurator-3d.endpoints';
import { format } from 'date-fns';

type SortField = 'startedAt' | 'status' | 'calculatedPrice' | 'duration';
type SortOrder = 'asc' | 'desc';

interface SessionRow {
  id: string;
  sessionId?: string;
  status: string;
  selections?: Record<string, string | string[]>;
  calculatedPrice?: number;
  currency?: string;
  source?: string;
  device?: { platform?: string; touchSupport?: boolean };
  duration?: number;
  startedAt?: string;
  lastActivityAt?: string;
}

interface SessionsResponse {
  data?: SessionRow[];
  meta?: { page: number; limit: number; total: number; totalPages: number };
}

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  ACTIVE: 'default',
  COMPLETED: 'secondary',
  CONVERTED: 'default',
  SAVED: 'outline',
  ABANDONED: 'destructive',
  EXPIRED: 'outline',
};

export interface SessionsTableProps {
  params?: { startDate?: string; endDate?: string; page?: number; limit?: number; sort?: string; order?: string };
  configId?: string;
  className?: string;
}

export function SessionsTable({ params = {}, configId, className }: SessionsTableProps) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sort, setSort] = useState<SortField>('startedAt');
  const [order, setOrder] = useState<SortOrder>('desc');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const queryParams = {
    ...params,
    page,
    limit,
    sort,
    order: order as 'asc' | 'desc',
  };

  const { data, isLoading } = useQuery({
    queryKey: ['configurator-sessions', queryParams, configId],
    queryFn: async () => {
      const res = await configurator3dEndpoints.analytics.sessions<SessionsResponse>(queryParams);
      return (typeof res === 'object' && res !== null ? res : {}) as SessionsResponse;
    },
  });

  const sessions = data?.data ?? [];
  const meta = data?.meta ?? { page: 1, limit: 10, total: 0, totalPages: 0 };

  const handleSort = (field: SortField) => {
    if (sort === field) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSort(field);
      setOrder('desc');
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '—';
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const formatSelections = (sel?: Record<string, string | string[]>) => {
    if (!sel || Object.keys(sel).length === 0) return '—';
    return Object.entries(sel)
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
      .slice(0, 2)
      .join('; ');
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Sessions</h3>
        <Select value={String(limit)} onValueChange={(v) => setLimit(parseInt(v, 10))}>
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => handleSort('startedAt')}>
                    Date
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => handleSort('status')}>
                    Status
                  </Button>
                </TableHead>
                <TableHead>Selections</TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => handleSort('calculatedPrice')}>
                    Price
                  </Button>
                </TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>
                  <Button variant="ghost" size="sm" onClick={() => handleSort('duration')}>
                    Duration
                  </Button>
                </TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No sessions found
                  </TableCell>
                </TableRow>
              ) : (
                sessions.map((row) => (
                  <TableRow
                    key={row.id}
                    className={cn(
                      'cursor-pointer transition-colors',
                      selectedId === row.id && 'bg-muted/50'
                    )}
                    onClick={() => setSelectedId(selectedId === row.id ? null : row.id)}
                  >
                    <TableCell className="text-sm">
                      {row.startedAt
                        ? format(new Date(row.startedAt), 'dd MMM yyyy HH:mm')
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANTS[row.status] ?? 'outline'}>
                        {row.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate text-sm">
                      {formatSelections(row.selections)}
                    </TableCell>
                    <TableCell>
                      {row.calculatedPrice != null
                        ? `${row.currency ?? '€'} ${row.calculatedPrice.toFixed(2)}`
                        : '—'}
                    </TableCell>
                    <TableCell className="text-sm">{row.source ?? '—'}</TableCell>
                    <TableCell>
                      {row.device?.touchSupport ? (
                        <Smartphone className="h-4 w-4" />
                      ) : (
                        <Monitor className="h-4 w-4" />
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDuration(row.duration)}
                    </TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}

        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-2">
            <p className="text-sm text-muted-foreground">
              Page {meta.page} of {meta.totalPages} ({meta.total} total)
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={meta.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={meta.page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
