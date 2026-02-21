/**
 * Section de gestion des factures
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Receipt, Download } from 'lucide-react';
import { useInvoices } from '../hooks/useInvoices';
import { formatDate } from '@/lib/utils/formatters';
import { useI18n } from '@/i18n/useI18n';

export function InvoicesSection() {
  const { t } = useI18n();
  const { invoices, isLoading, rateLimitMessage, downloadInvoice } = useInvoices();

  if (isLoading && !rateLimitMessage) {
    return (
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900">{t('dashboard.billing.invoices')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">{t('dashboard.common.loading')}</p>
        </CardContent>
      </Card>
    );
  }

  if (rateLimitMessage) {
    return (
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900">{t('dashboard.billing.invoices')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-amber-600">{rateLimitMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader>
        <CardTitle className="text-gray-900 flex items-center gap-2">
          <Receipt className="w-5 h-5 text-cyan-400" />
          {t('dashboard.billing.invoices')}
        </CardTitle>
        <CardDescription className="text-gray-600">
          {t('dashboard.billing.invoicesDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <p className="text-gray-600">{t('dashboard.billing.noInvoices')}</p>
        ) : (
          <div className="space-y-3">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center gap-4">
                  <Receipt className="w-5 h-5 text-cyan-400" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-gray-900 font-medium">{t('dashboard.billing.invoiceLabel')} {invoice.number}</p>
                      <Badge
                        variant="outline"
                        className={
                          invoice.status === 'paid'
                            ? 'border-green-500/50 text-green-400'
                            : 'border-yellow-500/50 text-yellow-400'
                        }
                      >
                        {invoice.status === 'paid' ? t('dashboard.billing.invoicePaid') : t('dashboard.billing.invoicePending')}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {formatDate(new Date(invoice.date))} • {invoice.amount}€ {invoice.currency.toUpperCase()}
                    </p>
                  </div>
                </div>
                {invoice.pdfUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadInvoice(invoice.id)}
                    className="border-gray-200"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {t('dashboard.billing.download')}
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



