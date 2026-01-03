'use client';

/**
 * Ligne de commande dans la liste
 * Client Component minimal
 */

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, ChevronRight } from 'lucide-react';
import type { Order } from '../types';

interface OrderRowProps {
  order: Order;
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

export function OrderRow({ order, onViewOrder }: OrderRowProps) {
  const statusConfig = getStatusConfig(order.status);

  return (
    <Card className="bg-gray-800/50 border-gray-700 hover:border-cyan-500/50 transition-all">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-white">{order.order_number}</h3>
              <Badge
                className={`bg-${statusConfig.bgColor} text-${statusConfig.color}-400 border-${statusConfig.color}-500/30`}
              >
                {statusConfig.label}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-400">
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
              <p className="text-lg font-bold text-white">
                {formatPrice(order.total_amount, order.currency)}
              </p>
              <p className="text-xs text-gray-500">
                {order.payment_status === 'paid' ? 'Payé' : 'Non payé'}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onViewOrder(order)}
              className="border-gray-600"
            >
              <Eye className="w-4 h-4 mr-2" />
              Voir
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

