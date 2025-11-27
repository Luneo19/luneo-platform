'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, Loader2, AlertCircle, Mail, ArrowRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { logger } from '@/lib/logger';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'resend'>('verifying');
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [email, setEmail] = useState<string>('');

  const token = searchParams.get('token');
  const type = searchParams.get('type'); // 'signup' | 'recovery' | 'invite'

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('resend');
        return;
      }

      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();

        // Vérifier le token via Supabase Auth
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

          // Rediriger vers le dashboard après 3 secondes
          setTimeout(() => {
            router.push('/dashboard/overview');
          }, 3000);
        }
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur de vérification';
        logger.error('Email verification failed', { error: err, token: token?.substring(0, 10) });
        
        if (errorMessage.includes('expired')) {
          setError('Ce lien a expiré. Veuillez demander un nouveau lien de vérification.');
        } else if (errorMessage.includes('invalid')) {
          setError('Ce lien n\'est pas valide. Veuillez vérifier votre email.');
        } else {
          setError(errorMessage);
        }
        setStatus('error');
      }
    };

    verifyEmail();
  }, [token, type, router]);

  const handleResendEmail = async () => {
    const emailInput = document.getElementById('resend-email') as HTMLInputElement;
    const emailValue = emailInput?.value;

    if (!emailValue) {
      setError('Veuillez entrer votre email');
      return;
    }

    setResending(true);
    setError(null);

    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: emailValue,
        options: {
          emailRedirectTo: `${window.location.origin}/verify-email`,
        },
      });

      if (resendError) throw resendError;

      setEmail(emailValue);
      setStatus('success');
      setError(null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'envoi';
      setError(errorMessage);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-cyan-900/20 to-gray-900 flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-gray-800/50 backdrop-blur-xl rounded-2xl p-8 border border-gray-700"
      >
        {status === 'verifying' && (
          <div className="text-center py-8">
            <Loader2 className="w-16 h-16 text-cyan-400 animate-spin mx-auto mb-6" />
            <h1 className="text-2xl font-bold text-white mb-2">Vérification en cours...</h1>
            <p className="text-gray-400">Nous vérifions votre email</p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-20 h-20 bg-gradient-to-br from-green-400 to-cyan-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-500/25"
            >
              <CheckCircle className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold text-white mb-4">Email vérifié ! 🎉</h1>
            <p className="text-gray-400 mb-6">
              {email ? (
                <>Votre email <span className="text-white">{email}</span> a été vérifié avec succès.</>
              ) : (
                'Un email de vérification a été envoyé.'
              )}
            </p>
            <p className="text-sm text-gray-500 mb-6">Redirection automatique dans quelques secondes...</p>
            <Link href="/dashboard/overview">
              <Button className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500">
                Accéder au dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">Erreur de vérification</h1>
            <p className="text-red-300 mb-6">{error}</p>
            <div className="space-y-3">
              <Button
                onClick={() => setStatus('resend')}
                className="w-full bg-cyan-600 hover:bg-cyan-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Renvoyer l'email
              </Button>
              <Link href="/login" className="block">
                <Button variant="outline" className="w-full border-gray-600">
                  Retour à la connexion
                </Button>
              </Link>
            </div>
          </div>
        )}

        {status === 'resend' && (
          <div className="text-center">
            <div className="w-16 h-16 bg-cyan-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Mail className="w-8 h-8 text-cyan-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Vérifier votre email</h1>
            <p className="text-gray-400 mb-6">
              Entrez votre email pour recevoir un nouveau lien de vérification
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-sm text-red-300">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <input
                id="resend-email"
                type="email"
                placeholder="votre@email.com"
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder:text-gray-500 focus:border-cyan-500 focus:outline-none"
              />
              <Button
                onClick={handleResendEmail}
                disabled={resending}
                className="w-full bg-cyan-600 hover:bg-cyan-700"
              >
                {resending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Envoyer le lien
                  </>
                )}
              </Button>
              <Link href="/login" className="block">
                <Button variant="outline" className="w-full border-gray-600">
                  Retour à la connexion
                </Button>
              </Link>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

