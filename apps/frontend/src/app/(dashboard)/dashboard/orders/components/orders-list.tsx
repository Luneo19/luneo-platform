'use client';

/**
 * Liste des commandes
 * Client Component minimal
 */

import { OrderRow } from './order-row';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Order, OrderPagination } from '../types';

interface OrdersListProps {
  orders: Order[];
  pagination: OrderPagination;
  onViewOrder: (order: Order) => void;
  selectedOrders?: Set<string>;
  onSelectOrder?: (orderId: string) => void;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function OrdersList({
  orders,
  pagination,
  onViewOrder,
  selectedOrders,
  onSelectOrder,
}: OrdersListProps) {
  const router = useRouter();

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set('page', newPage.toString());
    router.push(`/dashboard/orders?${params.toString()}`);
  };

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Aucune commande trouvée</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {orders.map((order) => (
          <OrderRow
            key={order.id}
            order={order}
            isSelected={selectedOrders?.has(order.id)}
            onSelect={onSelectOrder}
            onViewOrder={onViewOrder}
          />
        ))}
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-gray-400">
            Page {pagination.page} sur {pagination.totalPages} ({pagination.total}{' '}
            commandes)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.hasPrev}
              className="border-gray-600"
            >
              <ChevronLeft className="w-4 h-4" />
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasNext}
              className="border-gray-600"
            >
              Suivant
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}




