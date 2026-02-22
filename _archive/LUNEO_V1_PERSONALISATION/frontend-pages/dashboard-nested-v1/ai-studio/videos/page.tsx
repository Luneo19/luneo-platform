import { Suspense } from 'react';
import { getServerUser } from '@/lib/auth/get-user';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { NotAuthenticatedMessage } from '../../components/NotAuthenticatedMessage';
import { VideoPageClient } from './VideoPageClient';

export const metadata = {
  title: 'Vidéos IA | AI Studio | Luneo',
  description: 'Générez des vidéos à partir d\'images avec l\'IA',
};

export default async function VideoGenerationPage() {
  const user = await getServerUser();
  if (!user) {
    return (
      <ErrorBoundary level="page" componentName="VideoGenerationPage">
        <div className="p-6"><NotAuthenticatedMessage /></div>
      </ErrorBoundary>
    );
  }
  return (
    <ErrorBoundary level="page" componentName="VideoGenerationPage">
      <Suspense fallback={<div className="space-y-6 pb-10"><div className="dash-card h-16 rounded-2xl animate-pulse border-white/[0.06] bg-white/[0.03]" /></div>}>
        <VideoPageClient />
      </Suspense>
    </ErrorBoundary>
  );
}
