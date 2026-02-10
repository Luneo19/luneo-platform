'use client';

import { CreditCard, TrendingUp, Users, AlertTriangle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useBillingOverview } from '@/hooks/admin/use-billing-overview';

function formatCurrency(amount: number, currency = 'CHF') {
  return new Intl.NumberFormat('fr-CH', { style: 'currency', currency }).format(amount);
}

export default function BillingPage() {
  const { data, isLoading, isError, refresh } = useBillingOverview();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-6">
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="p-6 text-center">
            <p className="text-red-400">Erreur lors du chargement des données billing</p>
            <Button variant="outline" onClick={() => refresh()} className="mt-4">Réessayer</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Billing & Subscriptions</h1>
          <p className="text-zinc-400 mt-1">Vue d&apos;ensemble de la facturation et des abonnements</p>
        </div>
        <Button variant="outline" onClick={() => refresh()} className="border-zinc-700">Rafraîchir</Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10"><TrendingUp className="w-5 h-5 text-green-400" /></div>
            <div>
              <p className="text-sm text-zinc-400">MRR</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(data.mrr)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10"><CreditCard className="w-5 h-5 text-blue-400" /></div>
            <div>
              <p className="text-sm text-zinc-400">ARR</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(data.arr)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10"><Users className="w-5 h-5 text-purple-400" /></div>
            <div>
              <p className="text-sm text-zinc-400">Abonnés actifs</p>
              <p className="text-2xl font-bold text-white">{data.activeSubscriptions}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/10"><AlertTriangle className="w-5 h-5 text-yellow-400" /></div>
            <div>
              <p className="text-sm text-zinc-400">En trial</p>
              <p className="text-2xl font-bold text-white">{data.trialSubscriptions}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plan Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardHeader><CardTitle className="text-white text-sm">Distribution par plan</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(data.subscribersByPlan).map(([plan, count]) => (
              <div key={plan} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-xs capitalize">{plan}</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 bg-zinc-700 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(((count as number) / Math.max(data.activeSubscriptions + data.trialSubscriptions, 1)) * 100, 100)}%` }} />
                  </div>
                  <span className="text-sm text-white w-8 text-right">{count as number}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardHeader><CardTitle className="text-white text-sm">Résumé financier</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Revenue total', value: formatCurrency(data.totalRevenue) },
              { label: 'MRR', value: formatCurrency(data.mrr) },
              { label: 'ARR', value: formatCurrency(data.arr) },
              { label: 'Abonnements actifs', value: String(data.activeSubscriptions) },
              { label: 'Trials en cours', value: String(data.trialSubscriptions) },
              { label: 'Résiliés', value: String(data.cancelledSubscriptions) },
            ].map((item) => (
              <div key={item.label} className="flex justify-between">
                <span className="text-sm text-zinc-400">{item.label}</span>
                <span className="text-sm font-medium text-white">{item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Invoices */}
      <Card className="bg-zinc-800/50 border-zinc-700">
        <CardHeader><CardTitle className="text-white text-sm">Factures récentes</CardTitle></CardHeader>
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-700 hover:bg-transparent">
              <TableHead className="text-zinc-400">Marque</TableHead>
              <TableHead className="text-zinc-400">Montant</TableHead>
              <TableHead className="text-zinc-400">Statut</TableHead>
              <TableHead className="text-zinc-400">Payé le</TableHead>
              <TableHead className="text-zinc-400">Créé le</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.recentInvoices.length === 0 ? (
              <TableRow className="border-zinc-700">
                <TableCell colSpan={5} className="text-center text-zinc-500 py-8">
                  Aucune facture
                </TableCell>
              </TableRow>
            ) : (
              data.recentInvoices.map((invoice) => (
                <TableRow key={invoice.id} className="border-zinc-700">
                  <TableCell className="text-white font-medium">{invoice.brandName}</TableCell>
                  <TableCell className="text-white">{formatCurrency(invoice.amount, invoice.currency.toUpperCase())}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={
                      invoice.status === 'paid' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                      invoice.status === 'open' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                      'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                    }>
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-zinc-400">
                    {invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString('fr-FR') : '—'}
                  </TableCell>
                  <TableCell className="text-sm text-zinc-400">
                    {new Date(invoice.createdAt).toLocaleDateString('fr-FR')}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
