'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Brain,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { useReviewQueue } from '@/hooks/admin/use-review-queue';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useToast } from '@/hooks/use-toast';

type QueueItem = {
  id: string;
  ticketId: string;
  generatedContent: string;
  confidenceScore: number;
  status: string;
  createdAt: string;
  ticket: {
    ticketNumber: string;
    subject: string;
    priority?: string;
    category?: string;
    user?: {
      email: string;
      firstName?: string;
      lastName?: string;
    };
  };
};

type QueueData = {
  items: QueueItem[];
  total: number;
  page: number;
  totalPages: number;
};

type StatsData = {
  pending: number;
  approvedToday: number;
  rejectedToday: number;
  avgConfidence: number;
  approvalRate: number;
};

function confidenceBadgeClass(score: number): string {
  if (score >= 0.8) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  if (score >= 0.5) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  return 'bg-red-500/20 text-red-400 border-red-500/30';
}

function ReviewQueuePageContent() {
  const { toast } = useToast();
  const {
    queue,
    stats,
    isLoading,
    error,
    approveResponse,
    rejectResponse,
    bulkApprove,
    refresh,
  } = useReviewQueue({ status: 'PENDING' });

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  const queueData = queue as QueueData | undefined;
  const statsData = stats as StatsData | undefined;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const items = queueData?.items ?? [];
  const total = queueData?.total ?? 0;

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i) => i.id)));
    }
  }, [items, selectedIds.size]);

  const handleApprove = useCallback(
    async (id: string) => {
      setActioningId(id);
      try {
        await approveResponse(id);
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        toast({ title: 'Réponse approuvée', description: 'La réponse IA a été approuvée avec succès.' });
      } catch {
        toast({
          title: 'Erreur',
          description: 'Impossible d\'approuver la réponse.',
          variant: 'destructive',
        });
      } finally {
        setActioningId(null);
      }
    },
    [approveResponse, toast]
  );

  const handleReject = useCallback(
    async (id: string) => {
      setActioningId(id);
      try {
        await rejectResponse(id);
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        toast({ title: 'Réponse rejetée', description: 'La réponse IA a été rejetée.' });
      } catch {
        toast({
          title: 'Erreur',
          description: 'Impossible de rejeter la réponse.',
          variant: 'destructive',
        });
      } finally {
        setActioningId(null);
      }
    },
    [rejectResponse, toast]
  );

  const handleBulkApprove = useCallback(async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setBulkLoading(true);
    try {
      await bulkApprove(ids);
      setSelectedIds(new Set());
      toast({ title: 'Sélection approuvée', description: `${ids.length} réponse(s) approuvée(s) avec succès.` });
    } catch {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'approuver la sélection.',
        variant: 'destructive',
      });
    } finally {
      setBulkLoading(false);
    }
  }, [selectedIds, bulkApprove, toast]);

  if (isLoading && !queueData) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-zinc-900">
        <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-zinc-100">
      <div className="flex items-center gap-4">
        <Link href="/admin/orion">
          <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white" aria-label="Retour à la liste des agents">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Brain className="h-8 w-8 text-emerald-400" />
            File de Validation IA
          </h1>
          <p className="mt-1 text-zinc-400">
            Réponses IA en attente d&apos;approbation
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refresh()}
          disabled={isLoading}
          className="border-zinc-700 text-zinc-200 gap-2"
          aria-label="Rafraîchir la file"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Rafraîchir
        </Button>
      </div>

      {error && (
        <Card className="bg-zinc-800/80 border-zinc-600 border-red-500/30">
          <CardContent className="p-6 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
            <p className="text-red-400 flex-1">Erreur lors du chargement de la file.</p>
            <Button variant="outline" onClick={() => refresh()} className="border-zinc-600 text-zinc-200" aria-label="Réessayer">
              Réessayer
            </Button>
          </CardContent>
        </Card>
      )}

      {!error && statsData && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400">En attente</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-amber-400">{statsData.pending ?? 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400">Approuvés aujourd&apos;hui</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-emerald-400">{statsData.approvedToday ?? 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400">Rejetés aujourd&apos;hui</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-400">{statsData.rejectedToday ?? 0}</p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400">Taux d&apos;approbation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-white">
                  {statsData.approvalRate != null ? `${(statsData.approvalRate * 100).toFixed(1)}%` : '—'}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400">Confiance moyenne</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-white">
                  {statsData.avgConfidence != null ? (statsData.avgConfidence * 100).toFixed(0) + '%' : '—'}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-white">Réponses en attente</CardTitle>
              {items.length > 0 && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={items.length > 0 && selectedIds.size === items.length}
                    onCheckedChange={toggleSelectAll}
                    className="border-zinc-600 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                  />
                  <span className="text-sm text-zinc-400">Tout sélectionner</span>
                  <Button
                    size="sm"
                    onClick={handleBulkApprove}
                    disabled={selectedIds.size === 0 || bulkLoading}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2"
                    aria-label="Approuver la sélection"
                  >
                    {bulkLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    Approuver la sélection ({selectedIds.size})
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <p className="text-zinc-500 text-center py-8">Aucune réponse en attente de validation.</p>
              ) : (
                <div className="space-y-4" role="list" aria-label="File de réponses en attente de validation">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-lg border border-zinc-700/50 bg-zinc-900/50"
                    >
                      <div className="flex items-center gap-3 shrink-0">
                        <Checkbox
                          checked={selectedIds.has(item.id)}
                          onCheckedChange={() => toggleSelect(item.id)}
                          className="border-zinc-600 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                        />
                        <div>
                          <p className="font-medium text-white">
                            #{item.ticket?.ticketNumber ?? item.ticketId}
                          </p>
                          <p className="text-sm text-zinc-400 truncate max-w-[200px]">
                            {item.ticket?.subject ?? '—'}
                          </p>
                          {item.ticket?.user && (
                            <p className="text-xs text-zinc-500">
                              {[item.ticket.user.firstName, item.ticket.user.lastName].filter(Boolean).join(' ') || item.ticket.user.email}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <Badge className={`${confidenceBadgeClass(item.confidenceScore ?? 0)} shrink-0`}>
                          {(item.confidenceScore != null ? item.confidenceScore * 100 : 0).toFixed(0)}% confiance
                        </Badge>
                        <p className="mt-2 text-sm text-zinc-300 line-clamp-3 break-words">
                          {item.generatedContent ?? '—'}
                        </p>
                        <p className="text-xs text-zinc-500 mt-1">
                          {item.createdAt ? new Date(item.createdAt).toLocaleString('fr-FR') : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-emerald-600 text-emerald-400 hover:bg-emerald-500/20"
                          onClick={() => handleApprove(item.id)}
                          disabled={actioningId === item.id}
                          aria-label="Approuver la réponse"
                        >
                          {actioningId === item.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                          <span className="sr-only sm:not-sr-only sm:ml-1">Approuver</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-600 text-red-400 hover:bg-red-500/20"
                          onClick={() => handleReject(item.id)}
                          disabled={actioningId === item.id}
                          aria-label="Rejeter la réponse"
                        >
                          {actioningId === item.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <XCircle className="w-4 h-4" />
                          )}
                          <span className="sr-only sm:not-sr-only sm:ml-1">Rejeter</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {total > items.length && (
                <p className="text-sm text-zinc-500 mt-4">
                  Page {queueData?.page ?? 1} / {queueData?.totalPages ?? 1} — {total} élément(s) au total
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export default function OrionReviewQueuePage() {
  return (
    <ErrorBoundary level="page" componentName="OrionReviewQueuePage">
      <ReviewQueuePageContent />
    </ErrorBoundary>
  );
}
