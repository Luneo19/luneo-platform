'use client';

import React, { useEffect, useState, memo } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import { logger } from '@/lib/logger';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Button } from '@/components/ui/button';
import { endpoints } from '@/lib/api/client';
import { appRoutes } from '@/lib/routes';

function BillingPortalPageContent() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const openPortal = async () => {
      try {
        setError(null);

        const data = (await endpoints.billing.customerPortal()) as { success?: boolean; url?: string; error?: string };
        if (!data?.success || !data?.url) {
          setError(data?.error || 'Aucun abonnement actif trouvé. Souscrivez d\'abord à un plan.');
          return;
        }
        window.location.href = data.url;
      } catch (err: unknown) {
        if ((err as { response?: { status?: number } })?.response?.status === 401) {
          router.push(appRoutes.login);
          return;
        }
        const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
        logger.error('Billing portal error', { error: err });
        setError(errorMessage);
      }
    };

    openPortal();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center dash-bg p-6">
      <div className="text-center max-w-md w-full">
        {error ? (
          <div className="dash-card p-8 border-white/[0.06] space-y-4">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto border border-red-500/30">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Erreur</h1>
            <p className="text-white/60 mb-6">{error}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => router.push(appRoutes.billing)}
                className="border-white/[0.12] text-white/80 hover:bg-white/[0.04]"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour à la facturation
              </Button>
              {error.includes('abonnement') && (
                <Button
                  onClick={() => router.push(appRoutes.billing)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border-0"
                >
                  Voir les plans
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="dash-card p-8 border-white/[0.06] space-y-4">
            <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto" />
            <div>
              <h1 className="text-xl font-bold text-white mb-2">Ouverture du portail</h1>
              <p className="text-white/60">Redirection vers le portail de gestion Stripe...</p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push(appRoutes.billing)}
              className="border-white/[0.12] text-white/80 hover:bg-white/[0.04] mt-4"
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
