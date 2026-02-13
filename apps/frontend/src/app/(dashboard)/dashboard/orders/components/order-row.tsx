'use client';

/**
 * Ligne de commande dans la liste
 * Client Component minimal
 */

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, ChevronRight } from 'lucide-react';
import { useI18n } from '@/i18n/useI18n';
import type { Order } from '../types';

interface OrderRowProps {
  order: Order;
  isSelected?: boolean;
  onSelect?: (orderId: string) => void;
  onViewOrder: (order: Order) => void;
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
    month: 'short',
    year: 'numeric',
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

export function OrderRow({
  order,
  isSelected = false,
  onSelect,
  onViewOrder,
}: OrderRowProps) {
  const { t } = useI18n();
  const statusConfig = getStatusConfig(order.status);
  const statusLabel = t(`orders.statuses.${order.status}` as string) || order.status;

  return (
    <Card
      className={`bg-white border-gray-200 hover:border-cyan-500/50 transition-all ${
        isSelected ? 'ring-2 ring-cyan-500 border-cyan-500' : ''
      }`}
    >
      <div className="p-4">
        <div className="flex items-center justify-between">
          {onSelect && (
            <div className="mr-4" onClick={(e) => e.stopPropagation()}>
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onSelect(order.id)}
              />
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-gray-900">{order.order_number}</h3>
              <Badge
                className={`bg-${statusConfig.bgColor} text-${statusConfig.color}-400 border-${statusConfig.color}-500/30`}
              >
                {statusLabel}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>{order.customer_name || order.customer_email}</span>
              <span>•</span>
              <span>{formatDate(order.created_at)}</span>
              {order.tracking_number && (
                <>
                  <span>•</span>
                  <span>Tracking: {order.tracking_number}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900">
                {formatPrice(order.total_amount, order.currency)}
              </p>
              <p className="text-xs text-gray-500">
                {order.payment_status === 'paid' ? t('orders.paid') : t('orders.unpaid')}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onViewOrder(order)}
              className="border-gray-200"
            >
              <Eye className="w-4 h-4 mr-2" />
              {t('orders.details')}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}




