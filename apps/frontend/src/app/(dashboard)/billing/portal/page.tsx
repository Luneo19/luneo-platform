'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { logger } from '@/lib/logger';

export default function BillingPortalPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const openPortal = async () => {
      try {
        // Récupérer l'utilisateur connecté
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push('/login');
          return;
        }

        // Récupérer le customer ID Stripe
        const { data: profile } = await supabase
          .from('profiles')
          .select('stripe_customer_id')
          .eq('id', user.id)
          .single();

        if (!profile?.stripe_customer_id) {
          setError('Aucun abonnement actif trouvé. Souscrivez d\'abord à un plan.');
          setTimeout(() => router.push('/pricing'), 3000);
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

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Erreur lors de l\'ouverture du portail');
        }

        // Rediriger vers le portail Stripe
        window.location.href = data.data.url;
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
        logger.error('Billing portal error', { error: err });
        setError(errorMessage);
      }
    };

    openPortal();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center">
        {error ? (
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-400 text-2xl">!</span>
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Erreur</h1>
            <p className="text-gray-400 mb-4">{error}</p>
            <p className="text-sm text-gray-500">Redirection en cours...</p>
          </div>
        ) : (
          <>
            <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Ouverture du portail de gestion...</p>
          </>
        )}
      </div>
    </div>
  );
}

