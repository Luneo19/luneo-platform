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

export function InvoicesSection() {
  const { invoices, isLoading, downloadInvoice } = useInvoices();

  if (isLoading) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Factures</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Receipt className="w-5 h-5 text-cyan-400" />
          Factures
        </CardTitle>
        <CardDescription className="text-gray-400">
          Historique de vos factures et reçus
        </CardDescription>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <p className="text-gray-400">Aucune facture disponible</p>
        ) : (
          <div className="space-y-3">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-700"
              >
                <div className="flex items-center gap-4">
                  <Receipt className="w-5 h-5 text-cyan-400" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium">Facture {invoice.number}</p>
                      <Badge
                        variant="outline"
                        className={
                          invoice.status === 'paid'
                            ? 'border-green-500/50 text-green-400'
                            : 'border-yellow-500/50 text-yellow-400'
                        }
                      >
                        {invoice.status === 'paid' ? 'Payée' : 'En attente'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-400">
                      {formatDate(new Date(invoice.date))} • {invoice.amount}€ {invoice.currency.toUpperCase()}
                    </p>
                  </div>
                </div>
                {invoice.pdfUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadInvoice(invoice.id)}
                    className="border-gray-600"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger
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


