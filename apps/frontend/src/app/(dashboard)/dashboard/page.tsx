/**
 * ★★★ PAGE - DASHBOARD PRINCIPAL ★★★
 * Page Server Component pour le dashboard principal
 * 
 * Architecture:
 * - Server Component qui fetch les données initiales
 * - Client Components minimaux pour les interactions
 * - Composants < 300 lignes
 * - Types stricts (pas de any)
 */

import { Suspense } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DashboardPageClient } from './components/DashboardPageClient';
import { DashboardSkeleton } from './components/DashboardSkeleton';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Dashboard | Luneo',
  description: 'Tableau de bord principal avec KPIs et analytics',
};

/**
 * Server Component - Fetch les données initiales
 */
export default async function DashboardPage() {
  const supabase = await createClient();

  // Vérifier l'authentification
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return (
      <ErrorBoundary level="page" componentName="DashboardPage">
        <div className="container mx-auto py-6">
          <p className="text-red-400">Non authentifié</p>
        </div>
      </ErrorBoundary>
    );
  }

  // Analytics data will be fetched client-side via tRPC
  // This allows for better caching and real-time updates

  // Fetch recent notifications (limit 5)
  const { data: notifications } = await supabase
    .from('notifications')
    .select('id, type, title, message, read, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

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

