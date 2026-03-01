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
import { useI18n } from '@/i18n/useI18n';

export default function AuthCallbackPage() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const next = searchParams.get('next');
        const errorParam = searchParams.get('error');

        const isSafeInternalPath = (candidate: string | null): candidate is string => {
          if (!candidate) return false;
          if (!candidate.startsWith('/')) return false;
          if (candidate.startsWith('//')) return false;
          const lower = candidate.toLowerCase();
          if (lower.includes('javascript:')) return false;
          if (lower.includes('://')) return false;
          return true;
        };
        const redirectTarget = isSafeInternalPath(next) ? next : '/overview';

        if (errorParam) {
          logger.error('OAuth callback error', { error: errorParam });
          setError(
            errorParam === 'oauth_failed'
              ? t('auth.callback.oauthFailed')
              : `${t('auth.callback.errorPrefix')} ${errorParam}`
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
          router.push(redirectTarget);
          router.refresh();
        } else {
          throw new Error('User verification failed');
        }
      } catch (err) {
        logger.error('OAuth callback verification failed', err);
        setError(t('auth.callback.verificationFailed'));
        setTimeout(() => router.push('/login?error=verification_failed'), 3000);
      }
    };

    handleCallback();
  }, [router, searchParams, t]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg">
        <div className="text-center">
          <p className="text-red-400 mb-4" data-testid="callback-error">{error}</p>
          <p className="text-sm text-slate-500">{t('auth.callback.redirecting')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500 mx-auto mb-4" />
        <p className="text-white font-medium">{t('auth.callback.connecting')}</p>
        <p className="text-sm text-slate-500 mt-1">{t('auth.callback.pleaseWait')}</p>
      </div>
    </div>
  );
}
