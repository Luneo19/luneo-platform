/**
 * ★★★ PAGE - GESTION COMMANDES ★★★
 * Page Server Component pour la gestion des commandes. Cookie-based auth + NestJS backend.
 */

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { serverFetch } from '@/lib/api/server-fetch';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { OrdersPageClient } from './orders-page-client';
import { OrdersPageSkeleton } from './orders-page-skeleton';
import type { Order } from './types';

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
 * Server Component - Fetch les données depuis le backend
 */
export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const params = await searchParams;
  const cookieStore = await cookies();
  if (!cookieStore.get('accessToken')?.value) redirect('/login');

  try {
    await serverFetch('/api/v1/auth/me');
  } catch {
    redirect('/login');
  }

  const page = parseInt(params.page || '1', 10);
  const limit = 20;
  const searchParamsUrl = new URLSearchParams();
  searchParamsUrl.set('page', String(page));
  searchParamsUrl.set('limit', String(limit));
  if (params.status && params.status !== 'all') searchParamsUrl.set('status', params.status);
  if (params.startDate) searchParamsUrl.set('startDate', params.startDate);
  if (params.endDate) searchParamsUrl.set('endDate', params.endDate);
  if (params.search) searchParamsUrl.set('search', params.search);

  let orders: Order[] = [];
  let count = 0;

  try {
    const data = await serverFetch<{ data?: Order[]; orders?: Order[]; items?: Order[]; pagination?: { total?: number }; total?: number }>(`/api/v1/orders?${searchParamsUrl.toString()}`);
    const raw = Array.isArray(data.data) ? data.data : Array.isArray(data.orders) ? data.orders : data.items ?? [];
    orders = raw as Order[];
    count = data.pagination?.total ?? data.total ?? orders.length;
  } catch {
    // Fallback: show empty list
  }

  const stats = {
    total: count,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    totalRevenue: 0,
    avgOrderValue: 0,
  };

  orders.forEach((order) => {
    const status = (order.status || '').toLowerCase();
    switch (status) {
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
    stats.totalRevenue += Number(order.total_amount) || 0;
  });
  stats.avgOrderValue = stats.total > 0 ? stats.totalRevenue / stats.total : 0;

  const totalPages = Math.ceil(count / limit);

  return (
    <ErrorBoundary level="page" componentName="OrdersPage">
      <Suspense fallback={<OrdersPageSkeleton />}>
        <OrdersPageClient
          initialOrders={orders || []}
          initialStats={stats}
          pagination={{
            page,
            limit,
            total: count,
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
