'use client';

import React, { memo, useState, useCallback } from 'react';
import Link from 'next/link';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { FadeIn, SlideUp } from '@/components/animations';
import {
  ArrowLeft,
  Mail,
  Loader2,
  CheckCircle,
  AlertCircle,
  KeyRound,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getBackendUrl } from '@/lib/api/server-url';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function ForgotPasswordPageContent() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const isValidEmail = useCallback((e: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError('');

      if (!isValidEmail(email)) {
        setError('Veuillez entrer une adresse email valide');
        setLoading(false);
        return;
      }

      try {
        const apiUrl = getBackendUrl();
        const response = await fetch(`${apiUrl}/api/v1/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Une erreur est survenue');
        }

        setSent(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    },
    [email, isValidEmail],
  );

  // Success state
  if (sent) {
    return (
      <motion
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full text-center"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-2xl mb-5">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            <Send className="w-7 h-7 text-green-400" />
          </motion.div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2 font-display">Email envoye !</h2>
        <p className="text-slate-500 mb-8 leading-relaxed">
          Verifiez votre boite mail <span className="font-medium text-white">{email}</span> pour
          reinitialiser votre mot de passe.
        </p>
        <Link href="/login">
          <Button
            variant="outline"
            className="border-white/[0.08] text-slate-300 hover:bg-white/[0.04] h-11 px-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour a la connexion
          </Button>
        </Link>
      </motion>
    );
  }

  return (
    <motion
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <FadeIn delay={0.1}>
          <div className="inline-flex items-center justify-center w-14 h-14 bg-purple-500/10 border border-purple-500/20 rounded-2xl mb-5 lg:hidden">
            <KeyRound className="w-6 h-6 text-purple-400" />
          </div>
        </FadeIn>
        <SlideUp delay={0.2}>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 font-display">
            Mot de passe oublie ?
          </h1>
        </SlideUp>
        <FadeIn delay={0.3}>
          <p className="text-slate-500">
            Entrez votre email et nous vous enverrons un lien de reinitialisation.
          </p>
        </FadeIn>
      </div>

      {/* Error */}
      {error && (
        <FadeIn>
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        </FadeIn>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <SlideUp delay={0.4}>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-slate-300">
              Adresse email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-600 w-5 h-5" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className="pl-10 bg-dark-surface border-dark-border text-white placeholder:text-slate-600 focus:border-purple-500/50 focus:ring-purple-500/20 h-12"
                required
                disabled={loading}
              />
              {email && isValidEmail(email) && (
                <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 w-5 h-5" />
              )}
            </div>
          </div>
        </SlideUp>

        <SlideUp delay={0.5}>
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white h-12 font-bold shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-200"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Mail className="w-5 h-5 mr-2" />
                Envoyer le lien
              </>
            )}
          </Button>
        </SlideUp>
      </form>

      {/* Back */}
      <FadeIn delay={0.6}>
        <div className="mt-8 text-center">
          <Link
            href="/login"
            className="inline-flex items-center text-sm text-slate-500 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour a la connexion
          </Link>
        </div>
      </FadeIn>
    </motion>
  );
}

const ForgotPasswordPageMemo = memo(ForgotPasswordPageContent);

export default function ForgotPasswordPage() {
  return (
    <ErrorBoundary componentName="ForgotPasswordPage">
      <ForgotPasswordPageMemo />
    </ErrorBoundary>
  );
}
