'use client';

/**
 * Composant Activité Récente
 * Affiche l'activité récente sur les produits et commandes
 */

import { memo, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Package, ShoppingCart } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { formatRelativeDate } from '@/lib/utils/formatters';
import { logger } from '@/lib/logger';
import { endpoints } from '@/lib/api/client';

interface RecentActivityProps {
  period: '7d' | '30d' | '90d';
}

function RecentActivityContent({ period }: RecentActivityProps) {
  // Fetch recent products
  const productsQuery = trpc.product.list.useQuery({
    limit: 5,
    offset: 0,
  });

  const isLoading = productsQuery.isLoading;
  const recentProducts = productsQuery.data?.products || [];

  interface OrderItem {
    id?: string;
    order_number?: string;
    orderNumber?: string;
    created_at?: string;
    createdAt?: string;
  }
  // Fetch recent orders via backend API
  const [recentOrders, setRecentOrders] = useState<OrderItem[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const result = await endpoints.orders.list({ limit: 5 });
        const raw = result as { data?: { orders?: OrderItem[] }; orders?: OrderItem[] };
        setRecentOrders(raw?.data?.orders ?? raw?.orders ?? []);
      } catch (error) {
        logger.error('[RecentActivity] Error fetching orders', {
          error: error instanceof Error ? error.message : String(error),
        });
      } finally {
        setOrdersLoading(false);
      }
    }
    fetchOrders();
  }, []);

  if (isLoading || ordersLoading) {
    return (
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activité récente
          </CardTitle>
          <CardDescription>Chargement...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-50 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasActivity = recentProducts.length > 0 || recentOrders.length > 0;

  if (!hasActivity) {
    return (
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activité récente
          </CardTitle>
          <CardDescription>Aucune activité récente</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Activité récente
        </CardTitle>
        <CardDescription>
          Derniers produits et commandes sur {period === '7d' ? '7 jours' : period === '30d' ? '30 jours' : '90 jours'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Recent Products */}
          {recentProducts.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Produits récents
              </h4>
              <div className="space-y-2">
                {recentProducts.slice(0, 3).map((product: { id: string; name?: string; createdAt?: string }) => (
                  <div
                    key={product.id}
                    className="p-3 rounded-lg bg-gray-50 border border-gray-200"
                  >
                    <p className="text-sm font-medium text-gray-900">
                      {product.name || 'Produit sans nom'}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {product.createdAt
                        ? formatRelativeDate(new Date(product.createdAt))
                        : 'Date inconnue'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Orders */}
          {recentOrders.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Commandes récentes
              </h4>
              <div className="space-y-2">
                {recentOrders.slice(0, 3).map((order: OrderItem) => (
                  <div
                    key={order.id}
                    className="p-3 rounded-lg bg-gray-50 border border-gray-200"
                  >
                    <p className="text-sm font-medium text-gray-900">
                      Commande #{order.order_number || order.orderNumber || order.id?.slice(0, 8) || 'N/A'}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {order.created_at || order.createdAt
                        ? formatRelativeDate(new Date((order.created_at || order.createdAt) ?? ''))
                        : 'Date inconnue'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export const RecentActivity = memo(RecentActivityContent);

