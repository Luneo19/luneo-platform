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
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DashboardPageClient } from './components/DashboardPageClient';
import { DashboardSkeleton } from './components/DashboardSkeleton';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const metadata = {
  title: 'Dashboard | Luneo',
  description: 'Tableau de bord principal avec KPIs et analytics',
};

/**
 * Server Component - Fetch les données initiales
 */
export default async function DashboardPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('accessToken')?.value;
  if (!accessToken) redirect('/login');

  const userRes = await fetch(`${API_URL}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  const user = userRes.ok ? await userRes.json() : null;
  if (!user) redirect('/login');

  // Fetch recent notifications from backend (limit 5)
  let notifications: Array<{ id: string; type: string; title: string; message: string; read: boolean; created_at: string }> = [];
  try {
    const notifRes = await fetch(`${API_URL}/api/v1/notifications?limit=5`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });
    if (notifRes.ok) {
      const data = await notifRes.json();
      const list = data.notifications ?? data.data?.notifications ?? [];
      notifications = (Array.isArray(list) ? list : []).map((n: { id: string; type?: string; title?: string; message?: string; read?: boolean; createdAt?: string }) => ({
        id: n.id,
        type: n.type ?? 'info',
        title: n.title ?? '',
        message: n.message ?? '',
        read: n.read ?? false,
        created_at: typeof n.createdAt === 'string' ? n.createdAt : (n as { created_at?: string }).created_at ?? new Date().toISOString(),
      }));
    }
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

