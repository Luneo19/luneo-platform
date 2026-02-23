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
import { useQuery, useMutation } from '@tanstack/react-query';
import { useI18n } from '@/i18n/useI18n';

interface PaymentMethod {
  id: string;
  type: string;
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault?: boolean;
}

interface Subscription {
  plan: string;
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodStart: string;
  currentPeriodEnd: string;
}
import { endpoints, api } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import { formatDate, formatPrice, formatBytes } from '@/lib/utils/formatters';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CreditCard, Download, AlertCircle, Zap, Database, MessageSquare, FileText, Bot, HardDrive } from 'lucide-react';

// ========================================
// COMPONENT
// ========================================

function BillingPageContent() {
  const { t } = useI18n();
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);

  // Queries
  const subscriptionQuery = useQuery({
    queryKey: ['billing', 'subscription'],
    queryFn: () => endpoints.billing.subscription(),
  });
  const usageQuery = useQuery({
    queryKey: ['billing', 'usage'],
    queryFn: () => api.get<{ messagesAi: number; conversations: number; documentsIndexed: number; activeAgents: number; storageBytes: number }>('/api/v1/billing/usage'),
  });
  const limitsQuery = useQuery({
    queryKey: ['billing', 'limits'],
    queryFn: () => api.get<{ monthlyMessagesAi: number; monthlyConversations: number; monthlyDocumentsIndexed: number; maxActiveAgents: number; storageBytes: number }>('/api/v1/billing/limits'),
  });
  const invoicesQuery = useQuery({
    queryKey: ['billing', 'invoices'],
    queryFn: () => endpoints.billing.invoices(),
  });
  const paymentMethodsQuery = useQuery({
    queryKey: ['billing', 'paymentMethods'],
    queryFn: () => endpoints.billing.paymentMethods(),
  });

  // Mutations
  const cancelMutation = useMutation({
    mutationFn: (params: { cancelAtPeriodEnd: boolean }) =>
      endpoints.billing.cancelSubscription(!params.cancelAtPeriodEnd),
    onSuccess: () => {
      subscriptionQuery.refetch();
      logger.info('Subscription cancelled');
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: () => api.post('/api/v1/billing/reactivate'),
    onSuccess: () => {
      subscriptionQuery.refetch();
      logger.info('Subscription reactivated');
    },
  });

  const setDefaultPaymentMethodMutation = useMutation({
    mutationFn: (params: { paymentMethodId: string }) =>
      api.post('/api/v1/billing/set-default-payment-method', params),
    onSuccess: () => {
      paymentMethodsQuery.refetch();
      logger.info('Default payment method set');
    },
  });

  const removePaymentMethodMutation = useMutation({
    mutationFn: (_params: { paymentMethodId: string }) =>
      endpoints.billing.removePaymentMethod(),
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
      messagesAi: Math.min(
        (usageQuery.data.messagesAi / limitsQuery.data.monthlyMessagesAi) * 100,
        100
      ),
      conversations: Math.min(
        (usageQuery.data.conversations / limitsQuery.data.monthlyConversations) * 100,
        100
      ),
      documentsIndexed: Math.min(
        (usageQuery.data.documentsIndexed / limitsQuery.data.monthlyDocumentsIndexed) * 100,
        100
      ),
      activeAgents: Math.min(
        (usageQuery.data.activeAgents / limitsQuery.data.maxActiveAgents) * 100,
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
    if (!confirm(t('billing.confirmCancel'))) {
      return;
    }

    cancelMutation.mutate({ cancelAtPeriodEnd: true });
  }, [cancelMutation, t]);

  const handleReactivateSubscription = useCallback(() => {
    reactivateMutation.mutate();
  }, [reactivateMutation]);

  const handleDownloadInvoice = useCallback(async (invoiceId: string) => {
    try {
      const result = await api.get<{ url?: string }>(`/api/v1/billing/invoices/${invoiceId}/download`);
      if (result.url) {
        window.open(result.url, '_blank');
      }
    } catch (error) {
      logger.error('Error downloading invoice', { error });
      alert(t('billing.invoiceDownloadError'));
    }
  }, [t]);

  const handleSetDefaultPaymentMethod = useCallback(
    (paymentMethodId: string) => {
      if (!confirm(t('billing.confirmSetDefault'))) {
        return;
      }

      setDefaultPaymentMethodMutation.mutate({ paymentMethodId });
    },
    [setDefaultPaymentMethodMutation, t]
  );

  const handleRemovePaymentMethod = useCallback(
    (paymentMethodId: string) => {
      if (!confirm(t('billing.confirmRemovePayment'))) {
        return;
      }

      removePaymentMethodMutation.mutate({ paymentMethodId });
    },
    [removePaymentMethodMutation, t]
  );

  // ========================================
  // RENDER
  // ========================================

  if (subscriptionQuery.isPending || usageQuery.isPending || limitsQuery.isPending || invoicesQuery.isPending || paymentMethodsQuery.isPending) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] dash-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-white/10 border-t-purple-500 mx-auto" />
          <p className="mt-4 text-white/60">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  const subscription = subscriptionQuery.data as Subscription | undefined;
  const usage = usageQuery.data;
  const limits = limitsQuery.data;
  const rawInvoices = (invoicesQuery.data as { invoices?: unknown[] } | undefined)?.invoices ?? invoicesQuery.data;
  const invoices = Array.isArray(rawInvoices) ? rawInvoices : [];
  const rawPaymentMethods = (paymentMethodsQuery.data as { paymentMethods?: PaymentMethod[] } | undefined)?.paymentMethods ?? paymentMethodsQuery.data;
  const paymentMethods: PaymentMethod[] = Array.isArray(rawPaymentMethods) ? rawPaymentMethods as PaymentMethod[] : [];

  return (
    <div className="container mx-auto py-8 px-4 dash-bg min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-white">{t('billing.title')}</h1>
        <p className="text-white/60">{t('billing.subtitle')}</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-white/[0.04] border border-white/[0.06] p-1 rounded-xl">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=inactive]:text-white/60 rounded-lg"
          >
            {t('billing.tabs.overview')}
          </TabsTrigger>
          <TabsTrigger
            value="invoices"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=inactive]:text-white/60 rounded-lg"
          >
            {t('billing.tabs.invoices')}
          </TabsTrigger>
          <TabsTrigger
            value="payment-methods"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=inactive]:text-white/60 rounded-lg"
          >
            {t('billing.tabs.paymentMethods')}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Subscription Card - glow */}
          <Card className="dash-card-glow border-white/[0.06]">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">{t('billing.subscription')}</CardTitle>
                  <CardDescription className="text-white/60">
                    {subscription ? (
                      <>
                        {t('billing.plan', { name: subscription.plan.toUpperCase() })}
                        {subscription.cancelAtPeriodEnd && (
                          <span className="dash-badge dash-badge-live ml-2">{t('billing.cancelled')}</span>
                        )}
                      </>
                    ) : (
                      t('billing.noSubscription')
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
                    {t('billing.managePayments')}
                  </Button>
                  {subscription && (
                    <>
                      {subscription.cancelAtPeriodEnd ? (
                        <Button
                          onClick={handleReactivateSubscription}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border-0"
                        >
                          {t('billing.reactivate')}
                        </Button>
                      ) : (
                        <Button variant="destructive" onClick={handleCancelSubscription} className="bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30">
                          {t('common.cancel')}
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
                    <span className="text-sm text-white/60">{t('billing.currentPeriod')}</span>
                    <span className="text-sm font-medium text-white">
                      {formatDate(subscription.currentPeriodStart)} -{' '}
                      {formatDate(subscription.currentPeriodEnd)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-white/60">{t('billing.status')}</span>
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
              <CardTitle className="text-white">{t('billing.usage')}</CardTitle>
              <CardDescription className="text-white/60">
                {t('billing.usageDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Messages IA */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-white/40" />
                    <span className="text-sm font-medium text-white">{t('billing.messagesAi')}</span>
                  </div>
                  <span className="text-sm text-white/60">
                    {usage?.messagesAi || 0} / {limits?.monthlyMessagesAi || 0}
                  </span>
                </div>
                <Progress
                  value={usagePercentages.messagesAi || 0}
                  className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-purple-600 [&>div]:to-pink-600 bg-white/[0.06]"
                />
              </div>

              {/* Conversations */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-white/40" />
                    <span className="text-sm font-medium text-white">{t('billing.conversations')}</span>
                  </div>
                  <span className="text-sm text-white/60">
                    {usage?.conversations || 0} / {limits?.monthlyConversations || 0}
                  </span>
                </div>
                <Progress
                  value={usagePercentages.conversations || 0}
                  className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-purple-600 [&>div]:to-pink-600 bg-white/[0.06]"
                />
              </div>

              {/* Documents indexés */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-white/40" />
                    <span className="text-sm font-medium text-white">{t('billing.documentsIndexed')}</span>
                  </div>
                  <span className="text-sm text-white/60">
                    {usage?.documentsIndexed || 0} / {limits?.monthlyDocumentsIndexed || 0}
                  </span>
                </div>
                <Progress
                  value={usagePercentages.documentsIndexed || 0}
                  className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-purple-600 [&>div]:to-pink-600 bg-white/[0.06]"
                />
              </div>

              {/* Agents actifs */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-white/40" />
                    <span className="text-sm font-medium text-white">{t('billing.activeAgents')}</span>
                  </div>
                  <span className="text-sm text-white/60">
                    {usage?.activeAgents || 0} / {limits?.maxActiveAgents || 0}
                  </span>
                </div>
                <Progress
                  value={usagePercentages.activeAgents || 0}
                  className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-purple-600 [&>div]:to-pink-600 bg-white/[0.06]"
                />
              </div>

              {/* Stockage */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-white/40" />
                    <span className="text-sm font-medium text-white">{t('billing.storage')}</span>
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
              <CardTitle className="text-white">{t('billing.tabs.invoices')}</CardTitle>
              <CardDescription className="text-white/60">{t('billing.invoiceHistory')}</CardDescription>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="mx-auto h-12 w-12 text-white/40 mb-4" />
                  <p className="text-white/60">{t('billing.noInvoices')}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/[0.06] hover:bg-transparent">
                      <TableHead className="text-white/60">{t('billing.invoiceNumber')}</TableHead>
                      <TableHead className="text-white/60">{t('billing.date')}</TableHead>
                      <TableHead className="text-white/60">{t('billing.amount')}</TableHead>
                      <TableHead className="text-white/60">{t('billing.status')}</TableHead>
                      <TableHead className="text-white/60">{t('common.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id} className="border-white/[0.06] hover:bg-white/[0.04]">
                        <TableCell className="font-medium text-white">{invoice.number ?? '-'}</TableCell>
                        <TableCell className="text-white/60">{invoice.createdAt ? formatDate(invoice.createdAt) : '-'}</TableCell>
                        <TableCell className="text-white">{formatPrice(invoice.amount ?? 0, invoice.currency ?? 'EUR')}</TableCell>
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
              <CardTitle className="text-white">{t('billing.tabs.paymentMethods')}</CardTitle>
              <CardDescription className="text-white/60">
                {t('billing.managePaymentMethods')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {paymentMethods.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="mx-auto h-12 w-12 text-white/40 mb-4" />
                  <p className="text-white/60 mb-4">{t('billing.noPaymentMethods')}</p>
                  <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border-0">
                    {t('billing.addCard')}
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
                            {method.type === 'card' ? t('billing.card') : t('billing.bankAccount')}
                            {method.isDefault && (
                              <span className="dash-badge dash-badge-new">{t('billing.default')}</span>
                            )}
                          </div>
                          {method.last4 && (
                            <div className="text-sm text-white/60">
                              •••• •••• •••• {method.last4}
                            </div>
                          )}
                          {method.expiryMonth && method.expiryYear && (
                            <div className="text-sm text-white/60">
                              {t('billing.expires')} {method.expiryMonth}/{method.expiryYear}
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
                            {setDefaultPaymentMethodMutation.isPending ? '...' : t('billing.setDefault')}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemovePaymentMethod(method.id)}
                          disabled={removePaymentMethodMutation.isPending}
                          className="text-white/60 hover:text-white hover:bg-white/[0.04]"
                        >
                          {removePaymentMethodMutation.isPending ? '...' : t('common.delete')}
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
