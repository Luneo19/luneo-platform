/**
 * ★★★ PAGE - GESTION COMMANDES ★★★
 * Page Server Component pour la gestion des commandes
 * 
 * Architecture:
 * - Server Component qui fetch les données
 * - Client Components minimaux pour les interactions
 * - Composants < 300 lignes
 * - Types stricts (pas de any)
 */

import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { OrdersPageClient } from './orders-page-client';
import { OrdersPageSkeleton } from './orders-page-skeleton';

interface OrdersPageProps {
  searchParams: Promise<{
    page?: string;
    status?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }>;
}

/**
 * Server Component - Fetch les données
 */
export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  // Vérifier l'authentification
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return (
      <ErrorBoundary level="page" componentName="OrdersPage">
        <div className="p-6">
          <p className="text-red-400">Non authentifié</p>
        </div>
      </ErrorBoundary>
    );
  }

  // Préparer les paramètres de requête
  const page = parseInt(params.page || '1', 10);
  const limit = 20;
  const offset = (page - 1) * limit;

  // Construire la requête
  let query = supabase
    .from('orders')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id);

  // Appliquer les filtres
  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status);
  }

  if (params.startDate) {
    query = query.gte('created_at', params.startDate);
  }

  if (params.endDate) {
    query = query.lte('created_at', params.endDate);
  }

  if (params.search) {
    query = query.or(
      `order_number.ilike.%${params.search}%,customer_name.ilike.%${params.search}%,customer_email.ilike.%${params.search}%`
    );
  }

  // Appliquer le tri et la pagination
  query = query.order('created_at', { ascending: false });
  query = query.range(offset, offset + limit - 1);

  const { data: orders, error: ordersError, count } = await query;

  if (ordersError) {
    return (
      <ErrorBoundary level="page" componentName="OrdersPage">
        <div className="p-6">
          <p className="text-red-400">Erreur lors du chargement des commandes</p>
        </div>
      </ErrorBoundary>
    );
  }

  // Calculer les stats
  const stats = {
    total: count || 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    totalRevenue: 0,
    avgOrderValue: 0,
  };

  if (orders) {
    orders.forEach((order: { status: string; total_amount: number }) => {
      switch (order.status) {
        case 'pending':
          stats.pending++;
          break;
        case 'processing':
          stats.processing++;
          break;
        case 'shipped':
          stats.shipped++;
          break;
        case 'delivered':
          stats.delivered++;
          break;
        case 'cancelled':
          stats.cancelled++;
          break;
      }
      stats.totalRevenue += order.total_amount || 0;
    });
    stats.avgOrderValue = stats.total > 0 ? stats.totalRevenue / stats.total : 0;
  }

  const totalPages = Math.ceil((count || 0) / limit);

  return (
    <ErrorBoundary level="page" componentName="OrdersPage">
      <Suspense fallback={<OrdersPageSkeleton />}>
        <OrdersPageClient
          initialOrders={orders || []}
          initialStats={stats}
          pagination={{
            page,
            limit,
            total: count || 0,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          }}
          filters={{
            status: params.status || 'all',
            search: params.search || '',
            startDate: params.startDate || '',
            endDate: params.endDate || '',
          }}
        />
      </Suspense>
    </ErrorBoundary>
  );
}
