'use client';

import React, { useEffect, useState, memo } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import { logger } from '@/lib/logger';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Button } from '@/components/ui/button';
import { endpoints } from '@/lib/api/client';

function BillingPortalPageContent() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const openPortal = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get portal URL from NestJS backend (auth via httpOnly cookies)
        const data = (await endpoints.billing.customerPortal()) as { success?: boolean; url?: string; error?: string };
        if (!data?.success || !data?.url) {
          setError(data?.error || 'Aucun abonnement actif trouvé. Souscrivez d\'abord à un plan.');
          setIsLoading(false);
          return;
        }
        window.location.href = data.url;
      } catch (err: unknown) {
        if ((err as { response?: { status?: number } })?.response?.status === 401) {
          router.push('/login');
          return;
        }
        const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
        logger.error('Billing portal error', { error: err });
        setError(errorMessage);
        setIsLoading(false);
      }
    };

    openPortal();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-6">
      <div className="text-center max-w-md w-full">
        {error ? (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Erreur</h1>
            <p className="text-gray-400 mb-6">{error}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard/billing')}
                className="border-gray-600"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour à la facturation
              </Button>
              {error.includes('abonnement') && (
                <Button
                  onClick={() => router.push('/dashboard/billing')}
                  className="bg-cyan-600 hover:bg-cyan-700"
                >
                  Voir les plans
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto" />
            <div>
              <h1 className="text-xl font-bold text-white mb-2">Ouverture du portail</h1>
              <p className="text-gray-400">Redirection vers le portail de gestion Stripe...</p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/billing')}
              className="border-gray-600 mt-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Annuler
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

const MemoizedBillingPortalPageContent = memo(BillingPortalPageContent);

export default function BillingPortalPage() {
  return (
    <ErrorBoundary level="page" componentName="BillingPortalPage">
      <MemoizedBillingPortalPageContent />
    </ErrorBoundary>
  );
}

