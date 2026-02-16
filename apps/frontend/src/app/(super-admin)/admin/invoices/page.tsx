'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Receipt, Search, Download, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Invoice {
  id: string;
  stripeInvoiceId: string | null;
  brandId: string;
  brandName: string;
  brandPlan: string | null;
  amount: number;
  currency: string;
  status: string;
  paidAt: string | null;
  invoicePdf: string | null;
  createdAt: string;
}

interface InvoicesMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function formatCurrency(amountCents: number, currency = 'CHF') {
  return new Intl.NumberFormat('fr-CH', { style: 'currency', currency }).format(amountCents / 100);
}

function statusBadge(status: string) {
  const colors: Record<string, string> = {
    paid: 'bg-green-500/10 text-green-400 border-green-500/20',
    open: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    void: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    uncollectible: 'bg-red-500/10 text-red-400 border-red-500/20',
    draft: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };
  return colors[status] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
}

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [meta, setMeta] = useState<InvoicesMeta>({ total: 0, page: 1, limit: 20, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchInvoices = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(`/api/admin/invoices?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.invoices || []);
        setMeta(data.meta || { total: 0, page: 1, limit: 20, totalPages: 0 });
      }
    } catch {
      // Error handled by loading state
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchInvoices(1);
  }, [fetchInvoices]);

  const totalRevenue = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Receipt className="w-6 h-6 text-purple-400" />
            Toutes les Factures
          </h1>
          <p className="text-zinc-400 mt-1">
            {meta.total} factures au total
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Rechercher par marque ou ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-zinc-800/50 border-zinc-700"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-md bg-zinc-800/50 border border-zinc-700 text-white text-sm"
        >
          <option value="">Tous les statuts</option>
          <option value="paid">Payées</option>
          <option value="open">Ouvertes</option>
          <option value="void">Annulées</option>
          <option value="uncollectible">Irrécouvrables</option>
        </select>
      </div>

      {/* Revenue Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardContent className="p-4">
            <p className="text-sm text-zinc-400">Total factures</p>
            <p className="text-2xl font-bold text-white">{meta.total}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardContent className="p-4">
            <p className="text-sm text-zinc-400">Revenue (page courante)</p>
            <p className="text-2xl font-bold text-green-400">{formatCurrency(totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardContent className="p-4">
            <p className="text-sm text-zinc-400">Page</p>
            <p className="text-2xl font-bold text-white">{meta.page} / {meta.totalPages}</p>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card className="bg-zinc-800/50 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-white text-sm">Factures</CardTitle>
        </CardHeader>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-700 hover:bg-transparent">
                <TableHead className="text-zinc-400">Marque</TableHead>
                <TableHead className="text-zinc-400">Plan</TableHead>
                <TableHead className="text-zinc-400">Montant</TableHead>
                <TableHead className="text-zinc-400">Statut</TableHead>
                <TableHead className="text-zinc-400">Payé le</TableHead>
                <TableHead className="text-zinc-400">Créé le</TableHead>
                <TableHead className="text-zinc-400">PDF</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length === 0 ? (
                <TableRow className="border-zinc-700">
                  <TableCell colSpan={7} className="text-center text-zinc-500 py-8">
                    Aucune facture trouvée
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((inv) => (
                  <TableRow key={inv.id} className="border-zinc-700">
                    <TableCell className="text-white font-medium">{inv.brandName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs capitalize">{inv.brandPlan || '—'}</Badge>
                    </TableCell>
                    <TableCell className="text-white">{formatCurrency(inv.amount, inv.currency?.toUpperCase())}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusBadge(inv.status)}>{inv.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-zinc-400">
                      {inv.paidAt ? new Date(inv.paidAt).toLocaleDateString('fr-FR') : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-zinc-400">
                      {new Date(inv.createdAt).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>
                      {inv.invoicePdf && (
                        <a href={inv.invoicePdf} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300">
                          <Download className="w-4 h-4" />
                        </a>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-700">
            <p className="text-sm text-zinc-400">
              Page {meta.page} sur {meta.totalPages} ({meta.total} factures)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchInvoices(meta.page - 1)}
                disabled={meta.page <= 1}
                className="border-zinc-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchInvoices(meta.page + 1)}
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
