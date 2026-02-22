/**
 * ★★★ PAGE - DASHBOARD PRINCIPAL ★★★
 * Page Server Component pour le dashboard principal
 * 
 * Architecture:
 * - Server Component qui fetch les données initiales
 * - Cookie-based auth with NestJS backend
 * - Client Components minimaux pour les interactions
 */

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { serverFetch } from '@/lib/api/server-fetch';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DashboardPageClient } from './components/DashboardPageClient';
import { DashboardSkeleton } from './components/DashboardSkeleton';

export const metadata = {
  title: 'Dashboard | Luneo',
  description: 'Tableau de bord principal avec KPIs et analytics',
};

/**
 * Server Component - Fetch les données initiales
 */
export default async function DashboardPage() {
  const cookieStore = await cookies();
  if (!cookieStore.get('accessToken')?.value) redirect('/login');

  let user: unknown;
  try {
    user = await serverFetch('/api/v1/auth/me');
  } catch {
    redirect('/login');
  }
  if (!user) redirect('/login');

  // Fetch recent notifications from backend (limit 5)
  let notifications: Array<{ id: string; type: string; title: string; message: string; read: boolean; created_at: string }> = [];
  try {
    const data = await serverFetch<{ notifications?: unknown[]; data?: { notifications?: unknown[] } }>('/api/v1/notifications?limit=5');
    const list = data.notifications ?? data.data?.notifications ?? [];
    notifications = (Array.isArray(list) ? list : []).map((n: unknown) => {
      const x = n as { id: string; type?: string; title?: string; message?: string; read?: boolean; createdAt?: string; created_at?: string };
      return {
      id: x.id,
      type: x.type ?? 'info',
      title: x.title ?? '',
      message: x.message ?? '',
      read: x.read ?? false,
      created_at: typeof x.createdAt === 'string' ? x.createdAt : x.created_at ?? new Date().toISOString(),
    };
    });
  } catch {
    // Non-blocking: show dashboard without notifications
  }

  return (
    <ErrorBoundary level="page" componentName="DashboardPage">
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardPageClient
          initialNotifications={notifications || []}
        />
      </Suspense>
    </ErrorBoundary>
  );
}

