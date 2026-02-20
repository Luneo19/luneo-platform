'use client';

/**
 * Dialog de détail d'une commande
 * Client Component minimal
 */

import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { XCircle, Package, Factory, ArrowRight } from 'lucide-react';
import { useI18n } from '@/i18n/useI18n';
import type { Order } from '../types';

interface OrderDetailDialogProps {
  order: Order;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateStatus?: () => void;
  onCancel?: () => void;
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

function getStatusConfig(status: string): { color: string; bgColor: string } {
  const configs: Record<string, { color: string; bgColor: string }> = {
    pending: { color: 'yellow', bgColor: 'yellow-500/20' },
    processing: { color: 'blue', bgColor: 'blue-500/20' },
    shipped: { color: 'cyan', bgColor: 'cyan-500/20' },
    delivered: { color: 'green', bgColor: 'green-500/20' },
    cancelled: { color: 'red', bgColor: 'red-500/20' },
  };
  return configs[status] || configs.pending;
}

export function OrderDetailDialog({
  order,
  open,
  onOpenChange,
  onUpdateStatus,
  onCancel,
}: OrderDetailDialogProps) {
  const { t } = useI18n();
  const statusConfig = getStatusConfig(order.status);
  const statusLabel = t(`orders.statuses.${order.status}` as string) || order.status;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-gray-200 text-gray-900 max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{t('orders.orderNumberTitle', { number: order.order_number })}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Status et Informations principales */}
          <Card className="bg-gray-50 border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg">{t('orders.information')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">{t('orders.status')}</p>
                  <Badge
                    className={`bg-${statusConfig.bgColor} text-${statusConfig.color}-400 border-${statusConfig.color}-500/30 mt-1`}
                  >
                    {statusLabel}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('orders.payment')}</p>
                  <p className="text-gray-900 mt-1">
                    {order.payment_status === 'paid' ? t('orders.paid') : t('orders.unpaid')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('orders.createdAt')}</p>
                  <p className="text-gray-900 mt-1">{formatDate(order.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{t('orders.totalAmount')}</p>
                  <p className="text-gray-900 font-bold mt-1">
                    {formatPrice(order.total_amount, order.currency)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Client */}
          <Card className="bg-gray-50 border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg">{t('orders.customer')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-gray-900">{order.customer_name || t('orders.notProvided')}</p>
                <p className="text-gray-600">{order.customer_email}</p>
              </div>
            </CardContent>
          </Card>

          {/* Adresse de livraison */}
          {order.shipping_address && (
            <Card className="bg-gray-50 border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg">{t('orders.shippingAddress')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-gray-700">
                  <p>{order.shipping_address.name}</p>
                  <p>{order.shipping_address.street}</p>
                  <p>
                    {order.shipping_address.postal_code} {order.shipping_address.city}
                  </p>
                  <p>{order.shipping_address.country}</p>
                  {order.shipping_address.phone && (
                    <p className="mt-2">{order.shipping_address.phone}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Articles */}
          {order.items && order.items.length > 0 && (
            <Card className="bg-gray-50 border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg">{t('orders.items')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div>
                        {item.product_id ? (
                          <Link href={`/dashboard/products/${item.product_id}`} className="text-gray-900 font-medium hover:text-cyan-600 transition-colors">
                            {item.product_name}
                          </Link>
                        ) : (
                          <p className="text-gray-900 font-medium">{item.product_name}</p>
                        )}
                        {item.design_name && (
                          <p className="text-sm text-gray-600">{item.design_name}</p>
                        )}
                        <p className="text-sm text-gray-600">
                          {t('orders.quantity')}: {item.quantity}
                        </p>
                      </div>
                      <p className="text-gray-900 font-bold">
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
            <Card className="bg-gray-50 border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg">{t('orders.tracking')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-900">{t('orders.trackingNumber')}: {order.tracking_number}</p>
                {order.shipping_method && (
                  <p className="text-gray-600 mt-1">
                    {t('orders.carrier')}: {order.shipping_method}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Cross-links */}
          <div className="flex flex-wrap gap-2">
            {order.items?.[0]?.product_id && (
              <Button asChild variant="outline" size="sm" className="border-gray-200 text-gray-700">
                <Link href={`/dashboard/products/${order.items[0].product_id}`}>
                  <Package className="w-3.5 h-3.5 mr-1.5" />
                  Voir le produit
                  <ArrowRight className="w-3 h-3 ml-1.5" />
                </Link>
              </Button>
            )}
            <Button asChild variant="outline" size="sm" className="border-gray-200 text-gray-700">
              <Link href="/dashboard/production">
                <Factory className="w-3.5 h-3.5 mr-1.5" />
                Production
                <ArrowRight className="w-3 h-3 ml-1.5" />
              </Link>
            </Button>
          </div>

          <Separator className="bg-gray-200" />

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-gray-200"
            >
              {t('orders.close')}
            </Button>
            {onUpdateStatus && (
              <Button
                variant="outline"
                onClick={onUpdateStatus}
                className="border-gray-200"
              >
                {t('orders.modifyStatus')}
              </Button>
            )}
            {onCancel &&
              order.status !== 'cancelled' &&
              order.status !== 'delivered' && (
                <Button variant="destructive" onClick={onCancel}>
                  <XCircle className="w-4 h-4 mr-2" />
                  {t('orders.cancel')}
                </Button>
              )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}




