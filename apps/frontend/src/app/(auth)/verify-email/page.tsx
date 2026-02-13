'use client';

import React, { memo, useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useI18n } from '@/i18n/useI18n';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { FadeIn, SlideUp } from '@/components/animations';
import { CheckCircle, Loader2, AlertCircle, Mail, ArrowRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { logger } from '@/lib/logger';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function VerifyEmailPageContent() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'resend'>('verifying');
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [email, setEmail] = useState<string>('');

  const token = useMemo(() => searchParams.get('token'), [searchParams]);
  const emailParam = useMemo(() => searchParams.get('email'), [searchParams]);
  const type = useMemo(() => searchParams.get('type'), [searchParams]);

  const verifyEmail = useCallback(async () => {
    if (!token) {
      setStatus('resend');
      return;
    }

    try {
      // ✅ Migré vers API backend NestJS
      const { endpoints } = await import('@/lib/api/client');
      
      const response = await endpoints.auth.verifyEmail(token);

      if (response.verified) {
        setEmail(''); // Email disponible dans le token JWT si nécessaire
        setStatus('success');
        logger.info('Email verified successfully');

        setTimeout(() => {
          router.push('/onboarding');
        }, 3000);
      }
    } catch (err) {
      logger.error('Email verification error', {
        error: err,
        message: err instanceof Error ? err.message : 'Unknown error',
      });
      setError(err instanceof Error ? err.message : t('auth.verifyEmail.error'));
      setStatus('error');
    }
  }, [token, router]);

  useEffect(() => {
    if (emailParam) setEmail(emailParam);
  }, [emailParam]);

  useEffect(() => {
    verifyEmail();
  }, [verifyEmail]);

  const handleResend = useCallback(async () => {
    setResending(true);
    setError(null);
    try {
      const { endpoints } = await import('@/lib/api/client');
      if (email) {
        await endpoints.auth.resendVerification(email);
        setError(null);
        setStatus('verifying');
        logger.info('Verification email resent', { email });
      } else if (token) {
        // Re-attempt verification with existing token
        setStatus('verifying');
        await verifyEmail();
      } else {
        setError(t('auth.verifyEmail.enterEmailForResend'));
        setStatus('error');
      }
    } catch (err) {
      logger.error('Resend error', err);
      setError(t('auth.verifyEmail.resendFailed'));
      setStatus('error');
    } finally {
      setResending(false);
    }
  }, [email, token, verifyEmail, t]);

  const statusContent = useMemo(() => {
    switch (status) {
      case 'verifying':
        return (
          <FadeIn className="text-center">
            <SlideUp delay={0.1}>
              <Loader2 className="w-16 h-16 text-cyan-400 animate-spin mx-auto mb-4" />
            </SlideUp>
            <SlideUp delay={0.2}>
              <h2 className="text-2xl font-bold text-white mb-2">{t('auth.verifyEmail.verifyingTitle')}</h2>
            </SlideUp>
            <FadeIn delay={0.3}>
              <p className="text-slate-400">{t('auth.verifyEmail.pleaseWait')}</p>
            </FadeIn>
          </FadeIn>
        );
      case 'success':
        return (
          <FadeIn className="text-center">
            <SlideUp delay={0.1}>
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            </SlideUp>
            <SlideUp delay={0.2}>
              <h2 className="text-2xl font-bold text-white mb-2">{t('auth.verifyEmail.successTitle')}</h2>
            </SlideUp>
            <FadeIn delay={0.3}>
              <p className="text-slate-400 mb-6">{t('auth.verifyEmail.redirecting')}</p>
            </FadeIn>
            <SlideUp delay={0.4}>
              <Link href="/onboarding">
                <Button className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white">
                  {t('auth.verifyEmail.goToOnboarding')}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </SlideUp>
          </FadeIn>
        );
      case 'error':
        return (
          <FadeIn className="text-center">
            <SlideUp delay={0.1}>
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            </SlideUp>
            <SlideUp delay={0.2}>
              <h2 className="text-2xl font-bold text-white mb-2">{t('auth.verifyEmail.errorTitle')}</h2>
            </SlideUp>
            <FadeIn delay={0.3}>
              <p className="text-slate-400 mb-4">{error}</p>
            </FadeIn>
            {!token && !email && (
              <FadeIn delay={0.35}>
                <input
                  type="email"
                  placeholder={t('auth.verifyEmail.enterEmail')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full max-w-sm mx-auto mb-4 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </FadeIn>
            )}
            <SlideUp delay={0.4}>
              <Button 
                onClick={handleResend} 
                disabled={resending}
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white"
              >
                {resending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                {t('auth.verifyEmail.resend')}
              </Button>
            </SlideUp>
          </FadeIn>
        );
      default:
        return null;
    }
  }, [status, error, resending, handleResend, t]);

  return (
    <motion
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-md"
    >
      {statusContent}
    </motion>
  );
}

const VerifyEmailPageMemo = memo(VerifyEmailPageContent);

export default function VerifyEmailPage() {
  return (
    <ErrorBoundary componentName="VerifyEmailPage">
      <VerifyEmailPageMemo />
    </ErrorBoundary>
  );
}
