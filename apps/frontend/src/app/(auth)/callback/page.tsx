'use client';

/**
 * OAuth Callback Handler
 * Handles redirect from backend after Google/GitHub OAuth authentication.
 * Backend sets httpOnly cookies with tokens and redirects here with ?next=/overview
 */

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { logger } from '@/lib/logger';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const next = searchParams.get('next') || '/overview';
        const errorParam = searchParams.get('error');

        if (errorParam) {
          logger.error('OAuth callback error', { error: errorParam });
          setError(
            errorParam === 'oauth_failed'
              ? 'La connexion a echoue. Veuillez reessayer.'
              : `Erreur: ${errorParam}`
          );
          setTimeout(() => router.push('/login?error=oauth_failed'), 3000);
          return;
        }

        // Tokens are in httpOnly cookies (set by backend before redirect).
        // Verify authentication by calling /auth/me via Vercel proxy (same-origin)
        const meResp = await fetch('/api/v1/auth/me', {
          method: 'GET',
          credentials: 'include',
        });
        const meData = meResp.ok ? await meResp.json() : null;
        const user = meData?.data || meData;

        if (user && user.id) {
          // Redirect to the intended page (user data fetched via React Query on next page)
          router.push(next);
          router.refresh();
        } else {
          throw new Error('User verification failed');
        }
      } catch (err) {
        logger.error('OAuth callback verification failed', err instanceof Error ? err : undefined);
        setError('La verification du compte a echoue. Redirection...');
        setTimeout(() => router.push('/login?error=verification_failed'), 3000);
      }
    };

    handleCallback();
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Redirection en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-gray-700 font-medium">Connexion en cours...</p>
        <p className="text-sm text-gray-500 mt-1">Veuillez patienter</p>
      </div>
    </div>
  );
}
