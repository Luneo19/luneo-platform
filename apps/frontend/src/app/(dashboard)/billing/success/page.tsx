'use client';

import React, { useEffect, useState, memo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { CheckCircle, Loader2, ArrowRight, Sparkles, Crown, Gift, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { api } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface SessionData {
  planName: string;
  amount: number;
  currency: string;
  customerEmail: string;
  subscriptionId: string;
  trialEnd?: string;
}

function BillingSuccessPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      setError('Session de paiement non trouvée');
      setLoading(false);
      return;
    }

    const verifySession = async () => {
      try {
        const data = await api.get<{ success?: boolean; error?: string; data?: SessionData }>(
          '/api/v1/billing/verify-session',
          { params: { session_id: sessionId } }
        );

        if (!data?.success || !data.data) {
          throw new Error(data?.error || 'Impossible de vérifier le paiement');
        }

        setSessionData(data.data);

        logger.info('Payment success page loaded', { sessionId, plan: data.data?.planName });
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
        logger.error('Payment verification failed', { error: err, sessionId });
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center dash-bg">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-white/60">Vérification de votre paiement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center dash-bg px-4">
        <Card className="dash-card max-w-md w-full p-8 border-white/[0.06] text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/30">
            <Shield className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Erreur de vérification</h1>
          <p className="text-white/60 mb-6">{error}</p>
          <div className="space-y-3">
            <Link href="/dashboard/billing" className="block">
              <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border-0">
                Voir ma facturation
              </Button>
            </Link>
            <Link href="/contact" className="block">
              <Button variant="outline" className="w-full border-white/[0.12] text-white/80 hover:bg-white/[0.04]">
                Contacter le support
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen dash-bg dash-gradient-mesh py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <motion
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="dash-card-glow p-8 md:p-12 border-white/[0.06] text-center">
            {/* Success Icon */}
            <motion
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-24 h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-8"
            >
              <CheckCircle className="w-12 h-12 text-white" />
            </motion>

            {/* Title */}
            <motion
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Bienvenue chez Luneo ! 🎉
              </h1>
              <p className="text-xl text-white/60 mb-8">
                Votre abonnement <span className="text-purple-400 font-semibold">{sessionData?.planName || 'Premium'}</span> est maintenant actif
              </p>
            </motion>

            {/* Subscription Details */}
            {sessionData && (
              <motion
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white/[0.04] rounded-xl p-6 mb-8 border border-white/[0.06]"
              >
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-left">
                    <p className="text-white/40">Plan</p>
                    <p className="text-white font-semibold">{sessionData.planName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/40">Montant</p>
                    <p className="text-white font-semibold">
                      {(sessionData.amount / 100).toFixed(2)}€/{sessionData.currency === 'eur' ? 'mois' : sessionData.currency}
                    </p>
                  </div>
                  {sessionData.trialEnd && (
                    <>
                      <div className="text-left col-span-2 pt-4 border-t border-white/[0.06]">
                        <p className="text-white/40">Période d'essai gratuite</p>
                        <p className="text-[#4ade80] font-semibold flex items-center gap-2">
                          <Gift className="w-4 h-4" />
                          14 jours jusqu'au {new Date(sessionData.trialEnd).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </motion>
            )}

            {/* What's Next */}
            <motion
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mb-8"
            >
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-[#fbbf24]" />
                Ce qui vous attend
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 dash-card rounded-xl border-white/[0.06]">
                  <Crown className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                  <p className="text-sm text-white/60">Accès à toutes les fonctionnalités premium</p>
                </div>
                <div className="p-4 dash-card rounded-xl border-white/[0.06]">
                  <Shield className="w-6 h-6 text-[#4ade80] mx-auto mb-2" />
                  <p className="text-sm text-white/60">Support prioritaire inclus</p>
                </div>
                <div className="p-4 dash-card rounded-xl border-white/[0.06]">
                  <Sparkles className="w-6 h-6 text-pink-400 mx-auto mb-2" />
                  <p className="text-sm text-white/60">Mises à jour automatiques</p>
                </div>
              </div>
            </motion>

            {/* CTA Buttons */}
            <motion
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-3"
            >
              <Link href="/overview" className="block">
                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border-0"
                >
                  Accéder à mon dashboard
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/help/documentation/quickstart" className="block">
                <Button variant="outline" size="lg" className="w-full border-white/[0.12] text-white/60 hover:bg-white/[0.04]">
                  Guide de démarrage rapide
                </Button>
              </Link>
            </motion>

            {/* Confirmation email notice */}
            <motion
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-sm text-white/40 mt-8"
              as="p"
            >
              Un email de confirmation a été envoyé à <span className="text-white/60">{sessionData?.customerEmail}</span>
            </motion>
          </Card>
        </motion>
      </div>
    </div>
  );
}

export default function BillingSuccessPage() {
  return (
    <ErrorBoundary>
      <BillingSuccessPageContent />
    </ErrorBoundary>
  );
}
