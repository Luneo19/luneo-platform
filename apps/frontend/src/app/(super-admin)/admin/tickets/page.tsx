'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Ticket,
  Filter,
  RefreshCw,
  Loader2,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { logger } from '@/lib/logger';
import { api } from '@/lib/api/client';
import type { AdminTicket } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'open', label: 'Ouvert' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'resolved', label: 'Résolu' },
  { value: 'closed', label: 'Fermé' },
];

const PRIORITY_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'Toutes les priorités' },
  { value: 'low', label: 'Basse' },
  { value: 'medium', label: 'Moyenne' },
  { value: 'high', label: 'Haute' },
  { value: 'urgent', label: 'Urgent' },
];

const STATUS_BADGE: Record<string, string> = {
  open: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  in_progress: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  resolved: 'bg-green-500/20 text-green-400 border-green-500/30',
  closed: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
};

const PRIORITY_BADGE: Record<string, string> = {
  low: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
  medium: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  urgent: 'bg-red-500/20 text-red-400 border-red-500/30',
};

function getClientDisplay(ticket: AdminTicket): string {
  const c = ticket.client;
  if (!c) return '—';
  if (c.name) return c.name;
  if (c.firstName || c.lastName) return [c.firstName, c.lastName].filter(Boolean).join(' ') || '—';
  if (c.email) return c.email;
  return '—';
}

function getTicketNumber(ticket: AdminTicket): string {
  return ticket.ticketNumber ?? ticket.id?.slice(0, 8) ?? '—';
}

export default function AdminTicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<AdminTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const params: { page: number; limit: number; status?: string; priority?: string } = {
        page,
        limit,
      };
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;

      const res = await api.get<{
        data: AdminTicket[];
        meta: { total: number; page: number; limit: number; totalPages: number };
      }>('/api/v1/admin/support/tickets', { params });

      const rawRes = res as unknown as { data?: AdminTicket[]; meta?: { total: number; page: number; limit: number; totalPages: number } };
      const data = rawRes?.data ?? (Array.isArray(res) ? res : []);
      const meta = rawRes?.meta;

      if (Array.isArray(data)) {
        setTickets(data);
      } else if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as { data: AdminTicket[] }).data)) {
        setTickets((data as { data: AdminTicket[] }).data);
      } else {
        setTickets([]);
      }

      if (meta) {
        setTotal(meta.total ?? 0);
        setTotalPages(meta.totalPages ?? 1);
      }
    } catch (err) {
      logger.error('Tickets fetch failed', { error: err });
      setTickets([]);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [page, limit, statusFilter, priorityFilter]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleStatusChange = (value: string) => {
    setStatusFilter(value === 'all' ? '' : value);
    setPage(1);
  };

  const handlePriorityChange = (value: string) => {
    setPriorityFilter(value === 'all' ? '' : value);
    setPage(1);
  };

  const statusSelectValue = statusFilter || 'all';
  const prioritySelectValue = priorityFilter || 'all';

  return (
    <div className="space-y-6 min-h-full bg-[#0a0a0f] text-white -m-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Ticket className="w-6 h-6" />
          Tickets
        </h1>
        <p className="text-white/50 mt-1">
          Liste des tickets support avec filtres et pagination
        </p>
      </div>

      {/* Filtres */}
      <Card className="bg-white/[0.04] border-white/10">
        <CardContent className="p-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-white/70">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filtres</span>
          </div>
          <Select value={statusSelectValue} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={prioritySelectValue} onValueChange={handlePriorityChange}>
            <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Priorité" />
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchTickets()}
            disabled={loading}
            className="border-white/20 text-white hover:bg-white/10"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-white/[0.04] border-white/10">
        <CardHeader>
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <Ticket className="w-4 h-4" />
            {total} ticket{total !== 1 ? 's' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
            </div>
          ) : loadError ? (
            <div className="text-center py-12">
              <p className="text-red-400 mb-4">Erreur lors du chargement des tickets.</p>
              <Button
                variant="outline"
                onClick={() => fetchTickets()}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Réessayer
              </Button>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-12 text-white/50">Aucun ticket trouvé</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-white/70">Ticket #</TableHead>
                  <TableHead className="text-white/70">Client</TableHead>
                  <TableHead className="text-white/70">Sujet</TableHead>
                  <TableHead className="text-white/70">Statut</TableHead>
                  <TableHead className="text-white/70">Priorité</TableHead>
                  <TableHead className="text-white/70">Date</TableHead>
                  <TableHead className="text-white/70 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((t) => (
                  <TableRow
                    key={t.id}
                    className="border-white/10 hover:bg-white/[0.04]"
                  >
                    <TableCell className="font-mono text-sm text-white">
                      {getTicketNumber(t)}
                    </TableCell>
                    <TableCell className="text-white/90">
                      {getClientDisplay(t)}
                    </TableCell>
                    <TableCell className="text-white/90 max-w-[240px] truncate">
                      {t.subject ?? '—'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={STATUS_BADGE[t.status] ?? 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'}
                      >
                        {t.status === 'in_progress' ? 'En cours' : t.status === 'open' ? 'Ouvert' : t.status === 'resolved' ? 'Résolu' : t.status === 'closed' ? 'Fermé' : t.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={PRIORITY_BADGE[t.priority] ?? 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'}
                      >
                        {t.priority === 'low' ? 'Basse' : t.priority === 'medium' ? 'Moyenne' : t.priority === 'high' ? 'Haute' : t.priority === 'urgent' ? 'Urgent' : t.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-white/60 text-sm">
                      {t.createdAt
                        ? new Date(t.createdAt).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-white/80 hover:text-white hover:bg-white/10"
                        onClick={() => {
                          router.push(`/support?ticketId=${encodeURIComponent(t.id)}`);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>

        {totalPages > 1 && !loading && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
            <p className="text-sm text-white/50">
              Page {page} sur {totalPages} ({total} ticket{total !== 1 ? 's' : ''})
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="border-white/20 text-white hover:bg-white/10 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="border-white/20 text-white hover:bg-white/10 disabled:opacity-50"
              >
                Suivant
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
