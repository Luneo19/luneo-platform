/**
 * ★★★ PAGE - GESTION COMMANDES ★★★
 * Page complète pour gérer les commandes
 * - Liste commandes
 * - Filtres et recherche
 * - Actions (voir, modifier, annuler)
 * - Génération fichiers production
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { memo } from 'react';
import { trpc } from '@/lib/trpc/client';
import { logger } from '@/lib/logger';
import { orderService } from '@/lib/services/OrderService';
import { formatDate, formatPrice, formatRelativeDate } from '@/lib/utils/formatters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { OrderStatus, type Order } from '@/lib/types/order';
import { Search, Filter, Download, Eye, X, Package, Truck, CheckCircle } from 'lucide-react';

// ========================================
// COMPONENT
// ========================================

function OrdersPageContent() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Queries
  const ordersQuery = trpc.order.list.useQuery({
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
    limit: 50,
  });

  // Mutations
  const cancelMutation = trpc.order.cancel.useMutation({
    onSuccess: () => {
      ordersQuery.refetch();
      setIsDetailOpen(false);
      logger.info('Order cancelled');
    },
  });

  const updateTrackingMutation = trpc.order.updateTracking.useMutation({
    onSuccess: () => {
      ordersQuery.refetch();
      logger.info('Tracking updated');
    },
  });

  // ========================================
  // FILTERED ORDERS
  // ========================================

  const filteredOrders = useMemo(() => {
    if (!ordersQuery.data?.orders) return [];

    let filtered = ordersQuery.data.orders;

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.orderNumber.toLowerCase().includes(searchLower) ||
          order.shippingAddress.name.toLowerCase().includes(searchLower) ||
          order.shippingAddress.city.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [ordersQuery.data?.orders, search]);

  // ========================================
  // HANDLERS
  // ========================================

  const handleViewOrder = useCallback((order: Order) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  }, []);

  const handleCancelOrder = useCallback(
    async (orderId: string, reason?: string) => {
      if (!confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) {
        return;
      }

      try {
        await cancelMutation.mutateAsync({ id: orderId, reason });
      } catch (error) {
        logger.error('Error cancelling order', { error });
      }
    },
    [cancelMutation]
  );

  const handleGenerateProduction = useCallback(
    async (orderId: string) => {
      try {
        const result = await orderService.generateProductionFiles(orderId, {
          formats: ['pdf', 'png'],
          quality: 'print-ready',
          cmyk: true,
        });

        logger.info('Production files generation started', {
          orderId,
          jobId: result.jobId,
        });

        alert(`Génération démarrée. Job ID: ${result.jobId}`);
      } catch (error) {
        logger.error('Error generating production files', { error });
        alert('Erreur lors de la génération des fichiers');
      }
    },
    []
  );

  const getStatusBadge = useCallback((status: OrderStatus) => {
    const variants: Record<OrderStatus, { variant: any; label: string }> = {
      [OrderStatus.PENDING]: { variant: 'secondary', label: 'En attente' },
      [OrderStatus.CONFIRMED]: { variant: 'default', label: 'Confirmée' },
      [OrderStatus.PROCESSING]: { variant: 'default', label: 'En traitement' },
      [OrderStatus.PRODUCTION]: { variant: 'default', label: 'En production' },
      [OrderStatus.SHIPPED]: { variant: 'default', label: 'Expédiée' },
      [OrderStatus.DELIVERED]: { variant: 'default', label: 'Livrée' },
      [OrderStatus.CANCELLED]: { variant: 'destructive', label: 'Annulée' },
      [OrderStatus.REFUNDED]: { variant: 'destructive', label: 'Remboursée' },
    };

    const config = variants[status] || { variant: 'secondary', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  }, []);

  // ========================================
  // RENDER
  // ========================================

  if (ordersQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des commandes...</p>
        </div>
      </div>
    );
  }

  if (ordersQuery.error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">Erreur lors du chargement des commandes</p>
          <Button onClick={() => ordersQuery.refetch()} className="mt-4">
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Commandes</h1>
        <p className="text-gray-600">Gérez toutes vos commandes</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Rechercher par numéro, nom, ville..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les statuts</SelectItem>
                <SelectItem value={OrderStatus.PENDING}>En attente</SelectItem>
                <SelectItem value={OrderStatus.CONFIRMED}>Confirmée</SelectItem>
                <SelectItem value={OrderStatus.PROCESSING}>En traitement</SelectItem>
                <SelectItem value={OrderStatus.PRODUCTION}>En production</SelectItem>
                <SelectItem value={OrderStatus.SHIPPED}>Expédiée</SelectItem>
                <SelectItem value={OrderStatus.DELIVERED}>Livrée</SelectItem>
                <SelectItem value={OrderStatus.CANCELLED}>Annulée</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Commandes ({filteredOrders.length} / {ordersQuery.data?.total || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600">Aucune commande trouvée</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.orderNumber}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{order.shippingAddress.name}</div>
                        <div className="text-sm text-gray-500">{order.shippingAddress.city}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{formatDate(order.createdAt)}</div>
                      <div className="text-xs text-gray-500">{formatRelativeDate(order.createdAt)}</div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatPrice(order.totalAmount, order.currency)}
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewOrder(order)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {order.status === OrderStatus.PRODUCTION && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleGenerateProduction(order.id)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        {[OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(order.status) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancelOrder(order.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle>Commande {selectedOrder.orderNumber}</DialogTitle>
                <DialogDescription>
                  Détails de la commande du {formatDate(selectedOrder.createdAt)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Status */}
                <div>
                  <h3 className="font-semibold mb-2">Statut</h3>
                  <div className="flex gap-4">
                    {getStatusBadge(selectedOrder.status)}
                    {selectedOrder.trackingNumber && (
                      <Badge variant="outline">
                        <Truck className="h-3 w-3 mr-1" />
                        {selectedOrder.trackingNumber}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h3 className="font-semibold mb-2">Articles</h3>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium">{item.productName}</div>
                          <div className="text-sm text-gray-500">Quantité: {item.quantity}</div>
                        </div>
                        <div className="font-medium">
                          {formatPrice(item.totalPrice, selectedOrder.currency)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className="border-t pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Sous-total</span>
                      <span>{formatPrice(selectedOrder.subtotal, selectedOrder.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Livraison</span>
                      <span>{formatPrice(selectedOrder.shippingCost, selectedOrder.currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxe</span>
                      <span>{formatPrice(selectedOrder.tax, selectedOrder.currency)}</span>
                    </div>
                    {selectedOrder.discount > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Remise</span>
                        <span>-{formatPrice(selectedOrder.discount, selectedOrder.currency)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total</span>
                      <span>{formatPrice(selectedOrder.totalAmount, selectedOrder.currency)}</span>
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div>
                  <h3 className="font-semibold mb-2">Adresse de livraison</h3>
                  <div className="text-sm">
                    <div>{selectedOrder.shippingAddress.name}</div>
                    <div>{selectedOrder.shippingAddress.street}</div>
                    <div>
                      {selectedOrder.shippingAddress.postalCode} {selectedOrder.shippingAddress.city}
                    </div>
                    <div>{selectedOrder.shippingAddress.country}</div>
                    {selectedOrder.shippingAddress.phone && (
                      <div className="mt-2">Tél: {selectedOrder.shippingAddress.phone}</div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  {selectedOrder.status === OrderStatus.PRODUCTION && (
                    <Button onClick={() => handleGenerateProduction(selectedOrder.id)}>
                      <Download className="h-4 w-4 mr-2" />
                      Générer fichiers production
                    </Button>
                  )}
                  {[OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(selectedOrder.status) && (
                    <Button
                      variant="destructive"
                      onClick={() => handleCancelOrder(selectedOrder.id)}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Annuler la commande
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ========================================
// EXPORT
// ========================================

const OrdersPage = memo(function OrdersPage() {
  return (
    <ErrorBoundary>
      <OrdersPageContent />
    </ErrorBoundary>
  );
});

export default OrdersPage;
