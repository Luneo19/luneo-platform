'use client';

import React, { memo, useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
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
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: type === 'recovery' ? 'recovery' : 'signup',
      });

      if (verifyError) {
        throw verifyError;
      }

      if (data.user) {
        setEmail(data.user.email || '');
        setStatus('success');
        logger.info('Email verified successfully', { userId: data.user.id });

        setTimeout(() => {
          router.push('/overview');
        }, 3000);
      }
    } catch (err) {
      logger.error('Email verification error', err);
      setError(err instanceof Error ? err.message : 'Verification failed');
      setStatus('error');
    }
  }, [token, type, router]);

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
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Vérification en cours...</h2>
            <p className="text-gray-600">Veuillez patienter</p>
          </div>
        );
      case 'success':
        return (
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Email vérifié !</h2>
            <p className="text-gray-600 mb-4">Redirection en cours...</p>
            <Link href="/overview">
              <Button>
                Aller au dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        );
      case 'error':
        return (
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Erreur de vérification</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={handleResend} disabled={resending}>
              {resending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Renvoyer l'email
            </Button>
          </div>
        );
      default:
        return null;
    }
  }, [status, error, resending, handleResend]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-xl shadow-lg p-8"
      >
        {statusContent}
      </motion.div>
    </div>
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
