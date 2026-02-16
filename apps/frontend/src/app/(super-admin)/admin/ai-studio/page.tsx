import { Suspense } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AIAdminDashboardClient } from './AIAdminDashboardClient';

export const metadata = {
  title: 'AI Studio | Admin | Luneo',
  description: 'Tableau de bord administrateur AI Studio - coûts, providers, utilisateurs',
};

export default async function AdminAIStudioPage() {
  return (
    <ErrorBoundary level="page" componentName="AdminAIStudioPage">
      <Suspense fallback={<div className="space-y-6"><div className="dash-card h-16 rounded-2xl animate-pulse border-white/[0.06] bg-white/[0.03]" /></div>}>
        <AIAdminDashboardClient />
      </Suspense>
    </ErrorBoundary>
  );
}
