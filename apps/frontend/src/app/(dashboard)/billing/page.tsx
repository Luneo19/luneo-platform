/**
 * ★★★ PAGE - FACTURATION ★★★
 * Page complète pour gérer la facturation
 * - Abonnement actuel
 * - Usage & limites
 * - Historique factures
 * - Méthodes de paiement
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { memo } from 'react';
import { trpc } from '@/lib/trpc/client';
import { endpoints } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import { formatDate, formatPrice, formatBytes } from '@/lib/utils/formatters';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CreditCard, Download, AlertCircle, Package, TrendingUp, Zap, Database } from 'lucide-react';

// ========================================
// COMPONENT
// ========================================

function BillingPageContent() {
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);

  // Queries
  const subscriptionQuery = trpc.billing.getSubscription.useQuery();
  const usageQuery = trpc.billing.getUsageMetrics.useQuery({});
  const limitsQuery = trpc.billing.getBillingLimits.useQuery();
  const invoicesQuery = trpc.billing.listInvoices.useQuery({ limit: 20 });
  const paymentMethodsQuery = trpc.billing.listPaymentMethods.useQuery();

  // Mutations
  const cancelMutation = trpc.billing.cancelSubscription.useMutation({
    onSuccess: () => {
      subscriptionQuery.refetch();
      logger.info('Subscription cancelled');
    },
  });

  const reactivateMutation = trpc.billing.reactivateSubscription.useMutation({
    onSuccess: () => {
      subscriptionQuery.refetch();
      logger.info('Subscription reactivated');
    },
  });

  const setDefaultPaymentMethodMutation = trpc.billing.setDefaultPaymentMethod.useMutation({
    onSuccess: () => {
      paymentMethodsQuery.refetch();
      logger.info('Default payment method set');
    },
  });

  const removePaymentMethodMutation = trpc.billing.removePaymentMethod.useMutation({
    onSuccess: () => {
      paymentMethodsQuery.refetch();
      logger.info('Payment method removed');
    },
  });

  // ========================================
  // USAGE PERCENTAGES
  // ========================================

  const usagePercentages = useMemo(() => {
    if (!usageQuery.data || !limitsQuery.data) return {};

    return {
      customizations: Math.min(
        (usageQuery.data.customizations / limitsQuery.data.monthlyCustomizations) * 100,
        100
      ),
      renders: Math.min(
        (usageQuery.data.renders / limitsQuery.data.monthlyRenders) * 100,
        100
      ),
      apiCalls: Math.min(
        (usageQuery.data.apiCalls / limitsQuery.data.monthlyApiCalls) * 100,
        100
      ),
      storage: Math.min(
        (usageQuery.data.storageBytes / limitsQuery.data.storageBytes) * 100,
        100
      ),
    };
  }, [usageQuery.data, limitsQuery.data]);

  // ========================================
  // HANDLERS
  // ========================================

  const handleCancelSubscription = useCallback(() => {
    if (!confirm('Êtes-vous sûr de vouloir annuler votre abonnement ?')) {
      return;
    }

    cancelMutation.mutate({ cancelAtPeriodEnd: true });
  }, [cancelMutation]);

  const handleReactivateSubscription = useCallback(() => {
    reactivateMutation.mutate();
  }, [reactivateMutation]);

  const handleDownloadInvoice = useCallback(async (invoiceId: string) => {
    try {
      const { trpcVanilla } = await import('@/lib/trpc/vanilla-client');
      const result = await trpcVanilla.billing.downloadInvoice.query({ id: invoiceId });
      if (result.url) {
        window.open(result.url, '_blank');
      }
    } catch (error) {
      logger.error('Error downloading invoice', { error });
      alert('Erreur lors du téléchargement de la facture');
    }
  }, []);

  const handleSetDefaultPaymentMethod = useCallback(
    (paymentMethodId: string) => {
      if (!confirm('Définir ce moyen de paiement comme défaut ?')) {
        return;
      }

      setDefaultPaymentMethodMutation.mutate({ paymentMethodId });
    },
    [setDefaultPaymentMethodMutation]
  );

  const handleRemovePaymentMethod = useCallback(
    (paymentMethodId: string) => {
      if (!confirm('Supprimer ce moyen de paiement ?')) {
        return;
      }

      removePaymentMethodMutation.mutate({ paymentMethodId });
    },
    [removePaymentMethodMutation]
  );

  // ========================================
  // RENDER
  // ========================================

  if (subscriptionQuery.isPending || usageQuery.isPending || limitsQuery.isPending || invoicesQuery.isPending || paymentMethodsQuery.isPending) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] dash-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-white/10 border-t-purple-500 mx-auto" />
          <p className="mt-4 text-white/60">Chargement...</p>
        </div>
      </div>
    );
  }

  const subscription = subscriptionQuery.data;
  const usage = usageQuery.data;
  const limits = limitsQuery.data;
  const invoices = invoicesQuery.data?.invoices || [];
  const paymentMethods = paymentMethodsQuery.data || [];

  return (
    <div className="container mx-auto py-8 px-4 dash-bg min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-white">Facturation</h1>
        <p className="text-white/60">Gérez votre abonnement et vos factures</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-white/[0.04] border border-white/[0.06] p-1 rounded-xl">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=inactive]:text-white/60 rounded-lg"
          >
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger
            value="invoices"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=inactive]:text-white/60 rounded-lg"
          >
            Factures
          </TabsTrigger>
          <TabsTrigger
            value="payment-methods"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=inactive]:text-white/60 rounded-lg"
          >
            Moyens de paiement
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Subscription Card - glow */}
          <Card className="dash-card-glow border-white/[0.06]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">Abonnement</CardTitle>
                  <CardDescription className="text-white/60">
                    {subscription ? (
                      <>
                        Plan {subscription.plan.toUpperCase()}
                        {subscription.cancelAtPeriodEnd && (
                          <span className="dash-badge dash-badge-live ml-2">Annulé</span>
                        )}
                      </>
                    ) : (
                      'Aucun abonnement actif'
                    )}
                  </CardDescription>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    className="border-white/20 text-white/90 hover:bg-white/10"
                    onClick={async () => {
                      try {
                        const result = await endpoints.billing.portal() as { url?: string };
                        if (result?.url) window.location.href = result.url;
                      } catch (e) {
                        logger.error('Billing portal error', { error: e });
                      }
                    }}
                  >
                    Gérer les paiements (Stripe)
                  </Button>
                  {subscription && (
                    <>
                      {subscription.cancelAtPeriodEnd ? (
                        <Button
                          onClick={handleReactivateSubscription}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border-0"
                        >
                          Réactiver
                        </Button>
                      ) : (
                        <Button variant="destructive" onClick={handleCancelSubscription} className="bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30">
                          Annuler
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            {subscription && (
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-white/60">Période actuelle</span>
                    <span className="text-sm font-medium text-white">
                      {formatDate(subscription.currentPeriodStart)} -{' '}
                      {formatDate(subscription.currentPeriodEnd)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-white/60">Statut</span>
                    <span
                      className={
                        subscription.status === 'active'
                          ? 'dash-badge dash-badge-new'
                          : 'dash-badge text-white/60 border-white/20'
                      }
                    >
                      {subscription.status}
                    </span>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Usage Card - glass with gradient progress */}
          <Card className="dash-card border-white/[0.06]">
            <CardHeader>
              <CardTitle className="text-white">Utilisation</CardTitle>
              <CardDescription className="text-white/60">
                Utilisation pour la période en cours
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Customizations */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-white/40" />
                    <span className="text-sm font-medium text-white">Personnalisations</span>
                  </div>
                  <span className="text-sm text-white/60">
                    {usage?.customizations || 0} / {limits?.monthlyCustomizations || 0}
                  </span>
                </div>
                <Progress
                  value={usagePercentages.customizations || 0}
                  className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-purple-600 [&>div]:to-pink-600 bg-white/[0.06]"
                />
              </div>

              {/* Renders */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-white/40" />
                    <span className="text-sm font-medium text-white">Rendus</span>
                  </div>
                  <span className="text-sm text-white/60">
                    {usage?.renders || 0} / {limits?.monthlyRenders || 0}
                  </span>
                </div>
                <Progress
                  value={usagePercentages.renders || 0}
                  className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-purple-600 [&>div]:to-pink-600 bg-white/[0.06]"
                />
              </div>

              {/* API Calls */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-white/40" />
                    <span className="text-sm font-medium text-white">Appels API</span>
                  </div>
                  <span className="text-sm text-white/60">
                    {usage?.apiCalls || 0} / {limits?.monthlyApiCalls || 0}
                  </span>
                </div>
                <Progress
                  value={usagePercentages.apiCalls || 0}
                  className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-purple-600 [&>div]:to-pink-600 bg-white/[0.06]"
                />
              </div>

              {/* Storage */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-white/40" />
                    <span className="text-sm font-medium text-white">Stockage</span>
                  </div>
                  <span className="text-sm text-white/60">
                    {formatBytes(usage?.storageBytes || 0)} /{' '}
                    {formatBytes(limits?.storageBytes || 0)}
                  </span>
                </div>
                <Progress
                  value={usagePercentages.storage || 0}
                  className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-purple-600 [&>div]:to-pink-600 bg-white/[0.06]"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices">
          <Card className="dash-card border-white/[0.06]">
            <CardHeader>
              <CardTitle className="text-white">Factures</CardTitle>
              <CardDescription className="text-white/60">Historique de vos factures</CardDescription>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="mx-auto h-12 w-12 text-white/40 mb-4" />
                  <p className="text-white/60">Aucune facture trouvée</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/[0.06] hover:bg-transparent">
                      <TableHead className="text-white/60">Numéro</TableHead>
                      <TableHead className="text-white/60">Date</TableHead>
                      <TableHead className="text-white/60">Montant</TableHead>
                      <TableHead className="text-white/60">Statut</TableHead>
                      <TableHead className="text-white/60">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id} className="border-white/[0.06] hover:bg-white/[0.04]">
                        <TableCell className="font-medium text-white">{invoice.number}</TableCell>
                        <TableCell className="text-white/60">{formatDate(invoice.createdAt)}</TableCell>
                        <TableCell className="text-white">{formatPrice(invoice.amount, invoice.currency)}</TableCell>
                        <TableCell>
                          <span
                            className={
                              invoice.status === 'paid'
                                ? 'dash-badge dash-badge-new'
                                : invoice.status === 'open'
                                ? 'dash-badge text-white/60 border-white/20'
                                : 'dash-badge dash-badge-live'
                            }
                          >
                            {invoice.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadInvoice(invoice.id)}
                            className="text-white/60 hover:text-white hover:bg-white/[0.04]"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Methods Tab */}
        <TabsContent value="payment-methods">
          <Card className="dash-card border-white/[0.06]">
            <CardHeader>
              <CardTitle className="text-white">Moyens de paiement</CardTitle>
              <CardDescription className="text-white/60">
                Gérez vos méthodes de paiement
              </CardDescription>
            </CardHeader>
            <CardContent>
              {paymentMethods.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="mx-auto h-12 w-12 text-white/40 mb-4" />
                  <p className="text-white/60 mb-4">Aucune méthode de paiement</p>
                  <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border-0">
                    Ajouter une carte
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className="flex items-center justify-between p-4 border border-white/[0.06] rounded-xl bg-white/[0.03] backdrop-blur-sm"
                    >
                      <div className="flex items-center gap-4">
                        <CreditCard className="h-6 w-6 text-white/40" />
                        <div>
                          <div className="font-medium text-white flex items-center gap-2">
                            {method.type === 'card' ? 'Carte' : 'Compte bancaire'}
                            {method.isDefault && (
                              <span className="dash-badge dash-badge-new">Par défaut</span>
                            )}
                          </div>
                          {method.last4 && (
                            <div className="text-sm text-white/60">
                              •••• •••• •••• {method.last4}
                            </div>
                          )}
                          {method.expiryMonth && method.expiryYear && (
                            <div className="text-sm text-white/60">
                              Expire {method.expiryMonth}/{method.expiryYear}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!method.isDefault && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetDefaultPaymentMethod(method.id)}
                            disabled={setDefaultPaymentMethodMutation.isPending}
                            className="border-white/[0.12] text-white/80 hover:bg-white/[0.04]"
                          >
                            {setDefaultPaymentMethodMutation.isPending ? '...' : 'Définir par défaut'}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemovePaymentMethod(method.id)}
                          disabled={removePaymentMethodMutation.isPending}
                          className="text-white/60 hover:text-white hover:bg-white/[0.04]"
                        >
                          {removePaymentMethodMutation.isPending ? '...' : 'Supprimer'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ========================================
// EXPORT
// ========================================

const BillingPage = memo(function BillingPage() {
  return (
    <ErrorBoundary>
      <BillingPageContent />
    </ErrorBoundary>
  );
});

export default BillingPage;
