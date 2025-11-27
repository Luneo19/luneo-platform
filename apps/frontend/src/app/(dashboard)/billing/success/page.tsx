'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, Loader2, ArrowRight, Sparkles, Crown, Gift, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
// Confetti sera chargé dynamiquement
import { logger } from '@/lib/logger';

interface SessionData {
  planName: string;
  amount: number;
  currency: string;
  customerEmail: string;
  subscriptionId: string;
  trialEnd?: string;
}

export default function BillingSuccessPage() {
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
        const response = await fetch(`/api/billing/verify-session?session_id=${sessionId}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Impossible de vérifier le paiement');
        }

        setSessionData(data.data);
        
        // Trigger confetti celebration! 🎉
        if (typeof window !== 'undefined') {
          import('canvas-confetti').then((confettiModule) => {
            confettiModule.default({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 }
            });
          }).catch(() => {
            // Confetti not available, that's ok
          });
        }

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
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Vérification de votre paiement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
        <Card className="max-w-md w-full p-8 bg-gray-800/50 border-gray-700 text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Erreur de vérification</h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <div className="space-y-3">
            <Link href="/dashboard/billing" className="block">
              <Button className="w-full bg-cyan-600 hover:bg-cyan-700">
                Voir ma facturation
              </Button>
            </Link>
            <Link href="/contact" className="block">
              <Button variant="outline" className="w-full border-gray-600">
                Contacter le support
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-cyan-900/20 to-gray-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="p-8 md:p-12 bg-gray-800/50 border-gray-700 text-center">
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-24 h-24 bg-gradient-to-br from-green-400 to-cyan-400 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-cyan-500/25"
            >
              <CheckCircle className="w-12 h-12 text-white" />
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Bienvenue chez Luneo ! 🎉
              </h1>
              <p className="text-xl text-gray-300 mb-8">
                Votre abonnement <span className="text-cyan-400 font-semibold">{sessionData?.planName || 'Premium'}</span> est maintenant actif
              </p>
            </motion.div>

            {/* Subscription Details */}
            {sessionData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gray-900/50 rounded-xl p-6 mb-8"
              >
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-left">
                    <p className="text-gray-500">Plan</p>
                    <p className="text-white font-semibold">{sessionData.planName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-500">Montant</p>
                    <p className="text-white font-semibold">
                      {(sessionData.amount / 100).toFixed(2)}€/{sessionData.currency === 'eur' ? 'mois' : sessionData.currency}
                    </p>
                  </div>
                  {sessionData.trialEnd && (
                    <>
                      <div className="text-left col-span-2 pt-4 border-t border-gray-700">
                        <p className="text-gray-500">Période d'essai gratuite</p>
                        <p className="text-green-400 font-semibold flex items-center gap-2">
                          <Gift className="w-4 h-4" />
                          14 jours jusqu'au {new Date(sessionData.trialEnd).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {/* What's Next */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mb-8"
            >
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-400" />
                Ce qui vous attend
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-900/30 rounded-lg">
                  <Crown className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-300">Accès à toutes les fonctionnalités premium</p>
                </div>
                <div className="p-4 bg-gray-900/30 rounded-lg">
                  <Shield className="w-6 h-6 text-green-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-300">Support prioritaire inclus</p>
                </div>
                <div className="p-4 bg-gray-900/30 rounded-lg">
                  <Sparkles className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-300">Mises à jour automatiques</p>
                </div>
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-3"
            >
              <Link href="/dashboard/overview" className="block">
                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white"
                >
                  Accéder à mon dashboard
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/help/documentation/quickstart" className="block">
                <Button variant="outline" size="lg" className="w-full border-gray-600 text-gray-300">
                  Guide de démarrage rapide
                </Button>
              </Link>
            </motion.div>

            {/* Confirmation email notice */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-sm text-gray-500 mt-8"
            >
              Un email de confirmation a été envoyé à <span className="text-gray-300">{sessionData?.customerEmail}</span>
            </motion.p>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

