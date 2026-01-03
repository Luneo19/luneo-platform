'use client';

/**
 * Dialog de détail d'une commande
 * Client Component minimal
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { XCircle } from 'lucide-react';
import type { Order } from '../types';

interface OrderDetailDialogProps {
  order: Order;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency || 'EUR',
  }).format(amount / 100);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStatusConfig(status: string) {
  const configs: Record<
    string,
    { label: string; color: string; bgColor: string }
  > = {
    pending: { label: 'En attente', color: 'yellow', bgColor: 'yellow-500/20' },
    processing: {
      label: 'En traitement',
      color: 'blue',
      bgColor: 'blue-500/20',
    },
    shipped: { label: 'Expédiée', color: 'cyan', bgColor: 'cyan-500/20' },
    delivered: { label: 'Livrée', color: 'green', bgColor: 'green-500/20' },
    cancelled: { label: 'Annulée', color: 'red', bgColor: 'red-500/20' },
  };
  return configs[status] || configs.pending;
}

export function OrderDetailDialog({
  order,
  open,
  onOpenChange,
}: OrderDetailDialogProps) {
  const statusConfig = getStatusConfig(order.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Commande {order.order_number}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Status et Informations principales */}
          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg">Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Statut</p>
                  <Badge
                    className={`bg-${statusConfig.bgColor} text-${statusConfig.color}-400 border-${statusConfig.color}-500/30 mt-1`}
                  >
                    {statusConfig.label}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Paiement</p>
                  <p className="text-white mt-1">
                    {order.payment_status === 'paid' ? 'Payé' : 'Non payé'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Date de création</p>
                  <p className="text-white mt-1">{formatDate(order.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Montant total</p>
                  <p className="text-white font-bold mt-1">
                    {formatPrice(order.total_amount, order.currency)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Client */}
          <Card className="bg-gray-900/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg">Client</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-white">{order.customer_name || 'Non renseigné'}</p>
                <p className="text-gray-400">{order.customer_email}</p>
              </div>
            </CardContent>
          </Card>

          {/* Adresse de livraison */}
          {order.shipping_address && (
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg">Adresse de livraison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-gray-300">
                  <p>{order.shipping_address.name}</p>
                  <p>{order.shipping_address.street}</p>
                  <p>
                    {order.shipping_address.postal_code} {order.shipping_address.city}
                  </p>
                  <p>{order.shipping_address.country}</p>
                  {order.shipping_address.phone && (
                    <p className="mt-2">Tél: {order.shipping_address.phone}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Articles */}
          {order.items && order.items.length > 0 && (
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg">Articles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">{item.product_name}</p>
                        {item.design_name && (
                          <p className="text-sm text-gray-400">{item.design_name}</p>
                        )}
                        <p className="text-sm text-gray-400">
                          Quantité: {item.quantity}
                        </p>
                      </div>
                      <p className="text-white font-bold">
                        {formatPrice(item.total_price, order.currency)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tracking */}
          {order.tracking_number && (
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg">Suivi</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white">Numéro: {order.tracking_number}</p>
                {order.shipping_method && (
                  <p className="text-gray-400 mt-1">
                    Transporteur: {order.shipping_method}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <Separator className="bg-gray-700" />

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-gray-600"
            >
              Fermer
            </Button>
            {order.status !== 'cancelled' && order.status !== 'delivered' && (
              <Button variant="destructive">
                <XCircle className="w-4 h-4 mr-2" />
                Annuler la commande
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

