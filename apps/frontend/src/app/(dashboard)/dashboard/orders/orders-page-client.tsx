'use client';

/**
 * Client Component minimal pour les interactions
 * Responsabilité: Gérer l'état local et les interactions utilisateur
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { OrdersHeader } from './components/orders-header';
import { OrdersStats } from './components/orders-stats';
import { OrdersFilters } from './components/orders-filters';
import { OrdersList } from './components/orders-list';
import { OrderDetailDialog } from './components/order-detail-dialog';
import { BulkActionsBar } from './components/BulkActionsBar';
import { CreateOrderModal } from './components/modals/CreateOrderModal';
import { UpdateOrderStatusModal } from './components/modals/UpdateOrderStatusModal';
import { ExportOrdersModal } from './components/modals/ExportOrdersModal';
import { useOrderActions } from './hooks/useOrderActions';
import { useOrderExport } from './hooks/useOrderExport';
import { trpc } from '@/lib/trpc/client';
import type { Order, OrderStats, OrderPagination, OrderFilters, OrderStatus, ShippingAddress } from './types';

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
  const router = useRouter();
  const [orders] = useState<Order[]>(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [filters, setFilters] = useState<OrderFilters>(initialFilters);

  const { handleUpdateStatus, handleCancelOrder, handleBulkUpdateStatus } = useOrderActions();
  const { exportOrders } = useOrderExport();
  const createMutation = trpc.order.create.useMutation();

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetail(true);
  };

  const handleCloseOrderDetail = () => {
    setShowOrderDetail(false);
    setSelectedOrder(null);
  };

  const handleCreateOrder = useCallback(
    async (data: {
      items: Array<{
        productId: string;
        productName: string;
        quantity: number;
        price: number;
        totalPrice: number;
        designId?: string;
      }>;
      shippingAddress: ShippingAddress;
      customerNotes?: string;
    }): Promise<{ success: boolean }> => {
      try {
        await createMutation.mutateAsync({
          items: data.items.map((item) => ({
            productId: item.productId || 'temp-id',
            productName: item.productName,
            quantity: item.quantity,
            price: item.price,
            totalPrice: item.totalPrice,
            designId: item.designId,
          })),
          shippingAddress: {
            ...data.shippingAddress,
            postalCode: data.shippingAddress.postal_code,
          },
          customerNotes: data.customerNotes,
        });
        router.refresh();
        return { success: true };
      } catch (error: any) {
        return { success: false };
      }
    },
    [createMutation, router]
  );

  const handleUpdateOrderStatus = useCallback(
    async (orderId: string, status: OrderStatus, notes?: string) => {
      return handleUpdateStatus(orderId, status, notes);
    },
    [handleUpdateStatus]
  );

  const handleBulkAction = useCallback(
    (action: 'updateStatus' | 'export') => {
      if (action === 'export') {
        setShowExportModal(true);
        return;
      }
      if (action === 'updateStatus') {
        setShowUpdateStatusModal(true);
      }
    },
    []
  );

  const handleUpdateStatusSubmit = useCallback(
    async (orderId: string, status: OrderStatus, notes?: string) => {
      if (orderId === 'bulk' && selectedOrders.size > 0) {
        const result = await handleBulkUpdateStatus(Array.from(selectedOrders), status);
        if (result.success) {
          setSelectedOrders(new Set());
          setShowUpdateStatusModal(false);
          setUpdatingOrderId(null);
        }
        return result;
      }
      return handleUpdateOrderStatus(orderId, status, notes);
    },
    [selectedOrders, handleBulkUpdateStatus, handleUpdateOrderStatus]
  );

  const handleExport = useCallback(async () => {
    const ordersToExport =
      selectedOrders.size > 0
        ? orders.filter((o) => selectedOrders.has(o.id))
        : orders;
    await exportOrders(ordersToExport, exportFormat);
    setShowExportModal(false);
    setSelectedOrders(new Set());
  }, [selectedOrders, orders, exportFormat, exportOrders]);

  const toggleOrderSelection = useCallback((orderId: string) => {
    setSelectedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  }, []);

  return (
    <div className="space-y-6 pb-10">
      <OrdersHeader
        stats={initialStats}
        onShowCreate={() => setShowCreateModal(true)}
        onShowExport={() => setShowExportModal(true)}
      />
      <OrdersStats stats={initialStats} />
      <OrdersFilters filters={filters} onFiltersChange={setFilters} />

      <BulkActionsBar
        selectedCount={selectedOrders.size}
        onClearSelection={() => setSelectedOrders(new Set())}
        onBulkAction={handleBulkAction}
      />

      <OrdersList
        orders={orders}
        pagination={initialPagination}
        onViewOrder={handleViewOrder}
        selectedOrders={selectedOrders}
        onSelectOrder={toggleOrderSelection}
      />

      {/* Modals */}
      {selectedOrder && (
        <OrderDetailDialog
          order={selectedOrder}
          open={showOrderDetail}
          onOpenChange={handleCloseOrderDetail}
          onUpdateStatus={() => {
            setUpdatingOrderId(selectedOrder.id);
            setShowUpdateStatusModal(true);
          }}
          onCancel={() => handleCancelOrder(selectedOrder.id)}
        />
      )}

      <CreateOrderModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onCreate={handleCreateOrder}
      />

      {showUpdateStatusModal && (updatingOrderId || selectedOrders.size > 0) ? (
        <UpdateOrderStatusModal
          open={showUpdateStatusModal}
          onOpenChange={(open) => {
            setShowUpdateStatusModal(open);
            if (!open) {
              setUpdatingOrderId(null);
              if (selectedOrders.size > 0 && !updatingOrderId) setSelectedOrders(new Set());
            }
          }}
          currentStatus={
            updatingOrderId && updatingOrderId !== 'bulk'
              ? orders.find((o) => o.id === updatingOrderId)?.status || 'pending'
              : 'pending'
          }
          orderId={updatingOrderId || (selectedOrders.size > 0 ? 'bulk' : '')}
          onUpdate={handleUpdateStatusSubmit}
        />
      ) : null}

      <ExportOrdersModal
        open={showExportModal}
        onOpenChange={setShowExportModal}
        exportFormat={exportFormat}
        onFormatChange={setExportFormat}
        onExport={handleExport}
        orderCount={selectedOrders.size > 0 ? selectedOrders.size : orders.length}
      />
    </div>
  );
}




