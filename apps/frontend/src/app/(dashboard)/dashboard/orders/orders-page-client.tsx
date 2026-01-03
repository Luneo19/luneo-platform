'use client';

/**
 * Client Component minimal pour les interactions
 * Responsabilité: Gérer l'état local et les interactions utilisateur
 */

import { useState } from 'react';
import { OrdersHeader } from './components/orders-header';
import { OrdersStats } from './components/orders-stats';
import { OrdersFilters } from './components/orders-filters';
import { OrdersList } from './components/orders-list';
import { OrderDetailDialog } from './components/order-detail-dialog';
import type { Order, OrderStats, OrderPagination, OrderFilters } from './types';

interface OrdersPageClientProps {
  initialOrders: Order[];
  initialStats: OrderStats;
  pagination: OrderPagination;
  filters: OrderFilters;
}

export function OrdersPageClient({
  initialOrders,
  initialStats,
  pagination: initialPagination,
  filters: initialFilters,
}: OrdersPageClientProps) {
  const [orders] = useState<Order[]>(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [filters, setFilters] = useState<OrderFilters>(initialFilters);

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetail(true);
  };

  const handleCloseOrderDetail = () => {
    setShowOrderDetail(false);
    setSelectedOrder(null);
  };

  return (
    <div className="space-y-6 pb-10">
      <OrdersHeader stats={initialStats} />
      <OrdersStats stats={initialStats} />
      <OrdersFilters filters={filters} onFiltersChange={setFilters} />
      <OrdersList
        orders={orders}
        pagination={initialPagination}
        onViewOrder={handleViewOrder}
      />
      {selectedOrder && (
        <OrderDetailDialog
          order={selectedOrder}
          open={showOrderDetail}
          onOpenChange={handleCloseOrderDetail}
        />
      )}
    </div>
  );
}

