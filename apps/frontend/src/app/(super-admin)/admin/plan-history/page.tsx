'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { History, Search, Loader2, ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface PlanChange {
  id: string;
  action: string;
  brandId: string | null;
  brandName: string;
  currentPlan: string | null;
  previousPlan: string | null;
  newPlan: string | null;
  userId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

interface HistoryMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function actionLabel(action: string) {
  const map: Record<string, { label: string; color: string; icon: typeof ArrowUpRight }> = {
    'SUBSCRIPTION_CREATED': { label: 'Souscription', color: 'bg-green-500/10 text-green-400', icon: ArrowUpRight },
    'checkout.session.completed': { label: 'Souscription', color: 'bg-green-500/10 text-green-400', icon: ArrowUpRight },
    'SUBSCRIPTION_UPDATED': { label: 'Modification', color: 'bg-blue-500/10 text-blue-400', icon: RefreshCw },
    'subscription.updated': { label: 'Modification', color: 'bg-blue-500/10 text-blue-400', icon: RefreshCw },
    'PLAN_CHANGED': { label: 'Changement de plan', color: 'bg-purple-500/10 text-purple-400', icon: RefreshCw },
    'SUBSCRIPTION_CANCELED': { label: 'Annulation', color: 'bg-red-500/10 text-red-400', icon: ArrowDownRight },
    'subscription.deleted': { label: 'Annulation', color: 'bg-red-500/10 text-red-400', icon: ArrowDownRight },
  };
  return map[action] || { label: action, color: 'bg-zinc-500/10 text-zinc-400', icon: RefreshCw };
}

export default function AdminPlanHistoryPage() {
  const [history, setHistory] = useState<PlanChange[]>([]);
  const [meta, setMeta] = useState<HistoryMeta>({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [brandFilter, setBrandFilter] = useState('');

  const fetchHistory = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (brandFilter) params.set('brandId', brandFilter);

      const res = await fetch(`/api/admin/plan-history?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
        setMeta(data.meta || { total: 0, page: 1, limit: 20, totalPages: 0 });
      }
    } catch {
      // Error handled
    } finally {
      setIsLoading(false);
    }
  }, [brandFilter]);

  useEffect(() => {
    fetchHistory(1);
  }, [fetchHistory]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <History className="w-6 h-6 text-purple-400" />
          Historique des Changements de Plan
        </h1>
        <p className="text-zinc-400 mt-1">
          Traçabilité complète de tous les upgrades, downgrades et annulations
        </p>
      </div>

      {/* Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Filtrer par Brand ID..."
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            className="pl-10 bg-zinc-800/50 border-zinc-700"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardContent className="p-4">
            <p className="text-sm text-zinc-400">Total changements</p>
            <p className="text-2xl font-bold text-white">{meta.total}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardContent className="p-4">
            <p className="text-sm text-zinc-400">Page</p>
            <p className="text-2xl font-bold text-white">{meta.page} / {Math.max(meta.totalPages, 1)}</p>
          </CardContent>
        </Card>
      </div>

      {/* History Timeline */}
      <Card className="bg-zinc-800/50 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-white text-sm">Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center text-zinc-500 py-12">
              <History className="w-10 h-10 mx-auto mb-3 text-zinc-600" />
              <p>Aucun changement de plan enregistré</p>
              <p className="text-xs mt-1">Les changements de plan sont tracés automatiquement via les webhooks Stripe</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item) => {
                const info = actionLabel(item.action);
                const Icon = info.icon;
                return (
                  <div key={item.id} className="flex items-start gap-4 p-4 rounded-lg border border-zinc-700 bg-zinc-900/50">
                    <div className={`p-2 rounded-lg ${info.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-white">{item.brandName}</span>
                        <Badge variant="outline" className={info.color}>{info.label}</Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm">
                        {item.previousPlan && (
                          <Badge variant="outline" className="text-xs bg-zinc-700/50 text-zinc-300">
                            {String(item.previousPlan)}
                          </Badge>
                        )}
                        {item.previousPlan && item.newPlan && (
                          <span className="text-zinc-500">→</span>
                        )}
                        {item.newPlan && (
                          <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-400">
                            {String(item.newPlan)}
                          </Badge>
                        )}
                        {item.currentPlan && !item.previousPlan && !item.newPlan && (
                          <span className="text-xs text-zinc-400">Plan actuel: {item.currentPlan}</span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 mt-1">
                        {new Date(item.createdAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-700">
            <p className="text-sm text-zinc-400">
              Page {meta.page} sur {meta.totalPages} ({meta.total} entrées)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchHistory(meta.page - 1)}
                disabled={meta.page <= 1}
                className="border-zinc-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchHistory(meta.page + 1)}
                disabled={meta.page >= meta.totalPages}
                className="border-zinc-700"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
