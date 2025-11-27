'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, CheckCircle, Loader2, AlertCircle, ArrowLeft, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { logger } from '@/lib/logger';

export default function UnsubscribePage() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  
  const [isUnsubscribing, setIsUnsubscribing] = useState(false);
  const [isUnsubscribed, setIsUnsubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState<string>('');

  const reasons = [
    { id: 'too_many', label: 'Je reçois trop d\'emails' },
    { id: 'not_relevant', label: 'Le contenu n\'est pas pertinent pour moi' },
    { id: 'never_subscribed', label: 'Je ne me suis jamais inscrit' },
    { id: 'other', label: 'Autre raison' },
  ];

  const handleUnsubscribe = useCallback(async () => {
    if (!email) {
      setError('Email non spécifié');
      return;
    }

    setIsUnsubscribing(true);
    setError(null);

    try {
      const response = await fetch('/api/newsletter/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, reason }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erreur lors du désabonnement');
      }

      setIsUnsubscribed(true);
      logger.info('Newsletter unsubscribe', { email: email.replace(/(.{2}).*@/, '$1***@') });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(errorMessage);
      logger.error('Unsubscribe error', { error: err });
    } finally {
      setIsUnsubscribing(false);
    }
  }, [email, reason]);

  if (!email) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-white mb-4">Lien invalide</h1>
          <p className="text-gray-400 mb-6">
            Ce lien de désabonnement n'est pas valide. Veuillez utiliser le lien dans votre email.
          </p>
          <Link href="/">
            <Button className="bg-cyan-600 hover:bg-cyan-700">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à l'accueil
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-gray-800/50 backdrop-blur-xl rounded-2xl p-8 border border-gray-700"
      >
        {isUnsubscribed ? (
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="w-10 h-10 text-green-400" />
            </motion.div>
            <h1 className="text-2xl font-bold text-white mb-4">Désabonnement confirmé</h1>
            <p className="text-gray-400 mb-6">
              Vous ne recevrez plus nos emails à l'adresse <span className="text-white">{email}</span>.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Vous nous manquerez ! 💔
            </p>
            <div className="space-y-3">
              <Link href="/newsletter" className="block">
                <Button variant="outline" className="w-full border-gray-600">
                  <Heart className="w-4 h-4 mr-2" />
                  Se réabonner
                </Button>
              </Link>
              <Link href="/" className="block">
                <Button className="w-full bg-cyan-600 hover:bg-cyan-700">
                  Retour à l'accueil
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-gray-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Se désabonner</h1>
              <p className="text-gray-400">
                Êtes-vous sûr de vouloir vous désabonner ?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Email : <span className="text-white">{email}</span>
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {/* Reason selection */}
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-3">Dites-nous pourquoi (optionnel) :</p>
              <div className="space-y-2">
                {reasons.map((r) => (
                  <label
                    key={r.id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      reason === r.id
                        ? 'bg-cyan-500/20 border border-cyan-500/50'
                        : 'bg-gray-900/50 border border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={r.id}
                      checked={reason === r.id}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-4 h-4 text-cyan-500 bg-gray-800 border-gray-600"
                    />
                    <span className="text-sm text-gray-300">{r.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleUnsubscribe}
                disabled={isUnsubscribing}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                {isUnsubscribing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Désabonnement...
                  </>
                ) : (
                  'Confirmer le désabonnement'
                )}
              </Button>
              <Link href="/" className="block">
                <Button variant="outline" className="w-full border-gray-600">
                  Annuler
                </Button>
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

