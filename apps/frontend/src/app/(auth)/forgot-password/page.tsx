'use client';

import React, { memo, useState, useCallback, useMemo } from 'react';
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

  const isValidEmail = useCallback((email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
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
        headers: {
          'Content-Type': 'application/json',
        },
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
  }, [email, isValidEmail]);

  const formContent = useMemo(() => {
    if (sent) {
      return (
        <FadeIn>
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Email envoyé !</h2>
            <p className="text-slate-300 mb-6">
              Vérifiez votre boîte mail pour réinitialiser votre mot de passe.
            </p>
            <Link href="/login">
              <Button variant="outline" className="border-gray-600 text-gray-300 hover:border-gray-500">
                Retour à la connexion
              </Button>
            </Link>
          </div>
        </FadeIn>
      );
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-5">
        <SlideUp delay={0.4}>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-slate-300">
              Adresse email
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:ring-cyan-500/20 h-12"
                required
                disabled={loading}
              />
            </div>
          </div>
        </SlideUp>

        {error && (
          <FadeIn>
            <div className="flex items-center gap-2 text-red-400 text-sm p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          </FadeIn>
        )}

        <SlideUp delay={0.5}>
          <Button type="submit" className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white h-12 shadow-lg shadow-cyan-500/25" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Mail className="w-5 h-5 mr-2" />
                Envoyer le lien de réinitialisation
              </>
            )}
          </Button>
        </SlideUp>
      </form>
    );
  }, [sent, email, loading, error, handleSubmit]);

  return (
    <motion
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <SlideUp delay={0.1}>
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl mb-6 shadow-lg shadow-cyan-500/25 lg:hidden">
            <KeyRound className="w-8 h-8 text-white" />
          </div>
        </SlideUp>
        <SlideUp delay={0.2}>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Mot de passe oublié ?
          </h1>
        </SlideUp>
        <FadeIn delay={0.3}>
          <p className="text-slate-400">
            Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
          </p>
        </FadeIn>
      </div>

      {formContent}

      {/* Back to login */}
      <FadeIn delay={0.6}>
        <div className="mt-8 text-center">
          <Link href="/login" className="inline-flex items-center text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à la connexion
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
