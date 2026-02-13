/**
 * Section de gestion des méthodes de paiement
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Plus, Trash2 } from 'lucide-react';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import { useI18n } from '@/i18n/useI18n';

export function PaymentMethodsSection() {
  const { t } = useI18n();
  const { paymentMethods, isLoading, addPaymentMethod, deletePaymentMethod } = usePaymentMethods();

  if (isLoading) {
    return (
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900">{t('dashboard.billing.paymentMethods')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">{t('dashboard.common.loading')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-gray-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-cyan-400" />
              {t('dashboard.billing.paymentMethods')}
            </CardTitle>
            <CardDescription className="text-gray-600 mt-1">
              {t('dashboard.billing.paymentMethodsDescription')}
            </CardDescription>
          </div>
          <Button onClick={() => addPaymentMethod()} className="bg-cyan-600 hover:bg-cyan-700">
            <Plus className="w-4 h-4 mr-2" />
            {t('dashboard.billing.addCard')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {paymentMethods.length === 0 ? (
          <p className="text-gray-600">{t('dashboard.billing.noPaymentMethods')}</p>
        ) : (
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center gap-4">
                  <CreditCard className="w-5 h-5 text-cyan-400" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-gray-900 font-medium">
                        {method.card.brand.toUpperCase()} •••• {method.card.last4}
                      </p>
                      {method.isDefault && (
                        <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded">
                          {t('dashboard.billing.default')}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {t('dashboard.billing.expire')} {String(method.card.expMonth).padStart(2, '0')}/{method.card.expYear}
                    </p>
                  </div>
                </div>
                {!method.isDefault && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deletePaymentMethod(method.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}



