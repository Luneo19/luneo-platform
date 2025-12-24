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
import { logger } from '@/lib/logger';
import { formatDate, formatPrice, formatBytes } from '@/lib/utils/formatters';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CreditCard, Download, AlertCircle, CheckCircle, TrendingUp, Package, Zap, Database } from 'lucide-react';

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
      const result = await trpc.billing.downloadInvoice.query({ id: invoiceId });
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

  if (subscriptionQuery.isLoading || usageQuery.isLoading || limitsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
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
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Facturation</h1>
        <p className="text-gray-600">Gérez votre abonnement et vos factures</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="invoices">Factures</TabsTrigger>
          <TabsTrigger value="payment-methods">Moyens de paiement</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Subscription Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Abonnement</CardTitle>
                  <CardDescription>
                    {subscription ? (
                      <>
                        Plan {subscription.plan.toUpperCase()}
                        {subscription.cancelAtPeriodEnd && (
                          <Badge variant="destructive" className="ml-2">
                            Annulé
                          </Badge>
                        )}
                      </>
                    ) : (
                      'Aucun abonnement actif'
                    )}
                  </CardDescription>
                </div>
                {subscription && (
                  <div className="flex gap-2">
                    {subscription.cancelAtPeriodEnd ? (
                      <Button onClick={handleReactivateSubscription}>
                        Réactiver
                      </Button>
                    ) : (
                      <Button variant="destructive" onClick={handleCancelSubscription}>
                        Annuler
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>
            {subscription && (
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Période actuelle</span>
                    <span className="text-sm font-medium">
                      {formatDate(subscription.currentPeriodStart)} -{' '}
                      {formatDate(subscription.currentPeriodEnd)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Statut</span>
                    <Badge
                      variant={
                        subscription.status === 'active' ? 'default' : 'secondary'
                      }
                    >
                      {subscription.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Usage Card */}
          <Card>
            <CardHeader>
              <CardTitle>Utilisation</CardTitle>
              <CardDescription>
                Utilisation pour la période en cours
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Customizations */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Personnalisations</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {usage?.customizations || 0} / {limits?.monthlyCustomizations || 0}
                  </span>
                </div>
                <Progress
                  value={usagePercentages.customizations || 0}
                  className="h-2"
                />
              </div>

              {/* Renders */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Rendus</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {usage?.renders || 0} / {limits?.monthlyRenders || 0}
                  </span>
                </div>
                <Progress value={usagePercentages.renders || 0} className="h-2" />
              </div>

              {/* API Calls */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Appels API</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {usage?.apiCalls || 0} / {limits?.monthlyApiCalls || 0}
                  </span>
                </div>
                <Progress value={usagePercentages.apiCalls || 0} className="h-2" />
              </div>

              {/* Storage */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Stockage</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {formatBytes(usage?.storageBytes || 0)} /{' '}
                    {formatBytes(limits?.storageBytes || 0)}
                  </span>
                </div>
                <Progress value={usagePercentages.storage || 0} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>Factures</CardTitle>
              <CardDescription>Historique de vos factures</CardDescription>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600">Aucune facture trouvée</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Numéro</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.number}</TableCell>
                        <TableCell>{formatDate(invoice.createdAt)}</TableCell>
                        <TableCell>
                          {formatPrice(invoice.amount, invoice.currency)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              invoice.status === 'paid'
                                ? 'default'
                                : invoice.status === 'open'
                                ? 'secondary'
                                : 'destructive'
                            }
                          >
                            {invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadInvoice(invoice.id)}
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
          <Card>
            <CardHeader>
              <CardTitle>Moyens de paiement</CardTitle>
              <CardDescription>
                Gérez vos méthodes de paiement
              </CardDescription>
            </CardHeader>
            <CardContent>
              {paymentMethods.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-4">Aucune méthode de paiement</p>
                  <Button>Ajouter une carte</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <CreditCard className="h-6 w-6 text-gray-500" />
                        <div>
                          <div className="font-medium">
                            {method.type === 'card' ? 'Carte' : 'Compte bancaire'}
                            {method.isDefault && (
                              <Badge variant="outline" className="ml-2">
                                Par défaut
                              </Badge>
                            )}
                          </div>
                          {method.last4 && (
                            <div className="text-sm text-gray-600">
                              •••• •••• •••• {method.last4}
                            </div>
                          )}
                          {method.expiryMonth && method.expiryYear && (
                            <div className="text-sm text-gray-600">
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
                          >
                            {setDefaultPaymentMethodMutation.isPending ? '...' : 'Définir par défaut'}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemovePaymentMethod(method.id)}
                          disabled={removePaymentMethodMutation.isPending}
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
