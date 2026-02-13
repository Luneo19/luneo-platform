'use client';

/**
 * Checkout Cancel Page
 * Shown when user cancels Stripe payment
 */

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft, ShoppingBag } from 'lucide-react';
import { useI18n } from '@/i18n/useI18n';

export default function CheckoutCancelPage() {
  const { t } = useI18n();

  return (
    <div className="container max-w-2xl mx-auto py-16 px-4">
      <Card>
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-orange-100 mx-auto">
            <XCircle className="w-10 h-10 text-orange-600" />
          </div>

          <div>
            <h1 className="text-3xl font-bold mb-2">{t('public.checkout.cancel.title')}</h1>
            <p className="text-muted-foreground text-lg">
              {t('public.checkout.cancel.message')}
            </p>
          </div>

          <p className="text-sm text-muted-foreground">
            {t('public.checkout.cancel.itemsInCart')}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link href="/checkout">
              <Button>
                <ShoppingBag className="w-4 h-4 mr-2" />
                {t('public.checkout.cancel.resume')}
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('public.checkout.cancel.backToStore')}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
