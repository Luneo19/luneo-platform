'use client';

/**
 * Checkout Success Page
 * Shown after successful Stripe payment (order or subscription).
 * Handles both orderId (order checkout) and session_id (subscription checkout).
 */

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Package, ArrowRight, Loader2, CreditCard } from 'lucide-react';
import { useI18n } from '@/i18n/useI18n';

export default function CheckoutSuccessPage() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const sessionId = searchParams.get('session_id');
  const [order, setOrder] = useState<{ id?: string; orderNumber?: string; totalCents?: number; status?: string } | null>(null);
  const [loading, setLoading] = useState(!!orderId);

  const isSubscriptionSuccess = Boolean(sessionId);
  const isOrderSuccess = Boolean(orderId);

  useEffect(() => {
    if (orderId) {
      fetch(`/api/orders/${orderId}`)
        .then((res) => res.json())
        .then(setOrder)
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [orderId]);

  if (isSubscriptionSuccess) {
    return (
      <div className="container max-w-2xl mx-auto py-16 px-4">
        <Card>
          <CardContent className="pt-8 pb-8 text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mx-auto">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">{t('public.checkout.success.subscriptionTitle')}</h1>
              <p className="text-muted-foreground text-lg">
                {t('public.checkout.success.subscriptionThanks')}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('public.checkout.success.manageSubscription')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Link href="/dashboard/billing">
                <Button variant="outline">
                  <CreditCard className="w-4 h-4 mr-2" />
                  {t('public.checkout.success.viewSubscription')}
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button>
                  {t('public.checkout.success.continueToDashboard')}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-16 px-4">
      <Card>
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mx-auto">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>

          <div>
            <h1 className="text-3xl font-bold mb-2">{t('public.checkout.success.orderTitle')}</h1>
            <p className="text-muted-foreground text-lg">
              {t('public.checkout.success.orderThanks')}
            </p>
          </div>

          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
          ) : order ? (
            <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t('public.checkout.success.orderNumber')}</span>
                <span className="font-mono font-medium">{order.orderNumber || order.id}</span>
              </div>
              {order.totalCents != null && order.totalCents > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">{t('public.checkout.success.total')}</span>
                  <span className="font-medium">
                    {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(
                      order.totalCents / 100
                    )}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t('public.checkout.success.status')}</span>
                <span className="inline-flex items-center gap-1.5 text-green-600 font-medium">
                  <Package className="w-4 h-4" />
                  {order.status === 'PAID' ? t('public.checkout.success.paid') : t('public.checkout.success.processing')}
                </span>
              </div>
            </div>
          ) : orderId ? (
            <p className="text-sm text-muted-foreground">Commande #{orderId}</p>
          ) : null}

          <p className="text-sm text-muted-foreground">
            {t('public.checkout.success.confirmationEmail')}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            {isOrderSuccess && (
              <Link href="/dashboard/orders">
                <Button variant="outline">
                  <Package className="w-4 h-4 mr-2" />
                  {t('public.checkout.success.trackOrder')}
                </Button>
              </Link>
            )}
            <Link href="/">
              <Button>
                {t('public.checkout.success.continueShopping')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
