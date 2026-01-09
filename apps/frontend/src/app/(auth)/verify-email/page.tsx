'use client';

import React, { memo, useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { FadeIn, SlideUp } from '@/components/animations';
import { CheckCircle, Loader2, AlertCircle, Mail, ArrowRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { logger } from '@/lib/logger';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function VerifyEmailPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'resend'>('verifying');
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [email, setEmail] = useState<string>('');

  const token = useMemo(() => searchParams.get('token'), [searchParams]);
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
          router.push('/overview');
        }, 3000);
      }
    } catch (err) {
      logger.error('Email verification error', {
        error: err,
        message: err instanceof Error ? err.message : 'Unknown error',
      });
      setError(err instanceof Error ? err.message : 'Verification failed');
      setStatus('error');
    }
  }, [token, router]);

  useEffect(() => {
    verifyEmail();
  }, [verifyEmail]);

  const handleResend = useCallback(async () => {
    setResending(true);
    setError(null);
    try {
      // Resend verification email logic
      logger.info('Resending verification email');
      setStatus('verifying');
    } catch (err) {
      logger.error('Resend error', err);
      setError('Failed to resend email');
    } finally {
      setResending(false);
    }
  }, []);

  const statusContent = useMemo(() => {
    switch (status) {
      case 'verifying':
        return (
          <FadeIn className="text-center">
            <SlideUp delay={0.1}>
              <Loader2 className="w-16 h-16 text-cyan-400 animate-spin mx-auto mb-4" />
            </SlideUp>
            <SlideUp delay={0.2}>
              <h2 className="text-2xl font-bold text-white mb-2">Vérification en cours...</h2>
            </SlideUp>
            <FadeIn delay={0.3}>
              <p className="text-slate-400">Veuillez patienter</p>
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
              <h2 className="text-2xl font-bold text-white mb-2">Email vérifié !</h2>
            </SlideUp>
            <FadeIn delay={0.3}>
              <p className="text-slate-400 mb-6">Redirection en cours...</p>
            </FadeIn>
            <SlideUp delay={0.4}>
              <Link href="/overview">
                <Button className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white">
                  Aller au dashboard
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
              <h2 className="text-2xl font-bold text-white mb-2">Erreur de vérification</h2>
            </SlideUp>
            <FadeIn delay={0.3}>
              <p className="text-slate-400 mb-6">{error}</p>
            </FadeIn>
            <SlideUp delay={0.4}>
              <Button 
                onClick={handleResend} 
                disabled={resending}
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white"
              >
                {resending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Renvoyer l'email
              </Button>
            </SlideUp>
          </FadeIn>
        );
      default:
        return null;
    }
  }, [status, error, resending, handleResend]);

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
