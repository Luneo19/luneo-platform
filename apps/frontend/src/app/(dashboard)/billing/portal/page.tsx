'use client';

import React, { useEffect, useState, memo } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
import { logger } from '@/lib/logger';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Button } from '@/components/ui/button';

function BillingPortalPageContent() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const openPortal = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Récupérer l'utilisateur connecté
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          router.push('/login');
          return;
        }

        // Récupérer le customer ID Stripe
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('stripe_customer_id')
          .eq('id', user.id)
          .single();

        if (profileError || !profile?.stripe_customer_id) {
          setError('Aucun abonnement actif trouvé. Souscrivez d\'abord à un plan.');
          setIsLoading(false);
          return;
        }

        // Créer la session du portail
        const response = await fetch('/api/billing/portal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerId: profile.stripe_customer_id,
            returnUrl: `${window.location.origin}/dashboard/billing`,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || data.error || 'Erreur lors de l\'ouverture du portail');
        }

        if (!data.data?.url) {
          throw new Error('URL du portail non disponible');
        }

        // Rediriger vers le portail Stripe
        window.location.href = data.data.url;
      } catch (err: unknown) {
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

