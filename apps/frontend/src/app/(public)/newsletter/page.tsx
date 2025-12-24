'use client';

import React, { useState, useCallback, memo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { motion } from 'framer-motion';
import { Mail, CheckCircle, Loader2, AlertCircle, Sparkles, Gift, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { logger } from '@/lib/logger';

function NewsletterPageContent() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || 'Erreur lors de l\'inscription');
      }

      setIsSubscribed(true);
      setEmail('');
      logger.info('Newsletter subscription', { email: email.replace(/(.{2}).*@/, '$1***@') });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(errorMessage);
      logger.error('Newsletter subscription error', { error: err });
    } finally {
      setIsSubmitting(false);
    }
  }, [email]);

  const isValidEmail = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/30 to-gray-900 flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800/50 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-12 border border-gray-700"
        >
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-blue-500/25"
          >
            <Mail className="w-10 h-10 text-white" />
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Newsletter Luneo
            </h1>
            <p className="text-lg text-gray-300">
              Recevez nos dernières actualités, tutorials, et offres exclusives
            </p>
          </motion.div>

          {/* Benefits */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
          >
            <div className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-xl">
              <Sparkles className="w-5 h-5 text-yellow-400 flex-shrink-0" />
              <span className="text-sm text-gray-300">Nouveautés produit</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-xl">
              <Gift className="w-5 h-5 text-pink-400 flex-shrink-0" />
              <span className="text-sm text-gray-300">Offres exclusives</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-xl">
              <Bell className="w-5 h-5 text-cyan-400 flex-shrink-0" />
              <span className="text-sm text-gray-300">Tips & tutorials</span>
            </div>
          </motion.div>

          {/* Form */}
          {isSubscribed ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Merci ! 🎉</h2>
              <p className="text-gray-300 mb-6">
                Vous êtes maintenant inscrit à notre newsletter.
              </p>
              <Link href="/">
                <Button variant="outline" className="border-gray-600">
                  Retour à l'accueil
                </Button>
              </Link>
            </motion.div>
          ) : (
            <motion.form
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {/* Error message */}
              {error && (
                <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  className="flex-1 bg-gray-900/50 border-gray-600 text-white placeholder:text-gray-500 h-12 text-base"
                  required
                  disabled={isSubmitting}
                />
                <Button
                  type="submit"
                  disabled={isSubmitting || !isValidEmail}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-8 h-12 text-base font-semibold whitespace-nowrap disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Inscription...
                    </>
                  ) : (
                    "S'abonner"
                  )}
                </Button>
              </div>

              <p className="text-sm text-gray-500 text-center">
                Pas de spam. Désabonnement en 1 clic. Nous respectons votre vie privée.
              </p>
            </motion.form>
          )}

          {/* Footer links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 pt-6 border-t border-gray-700 text-center"
          >
            <p className="text-sm text-gray-500">
              En vous inscrivant, vous acceptez notre{' '}
              <Link href="/legal/privacy" className="text-blue-400 hover:underline">
                politique de confidentialité
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

const NewsletterPageMemo = memo(NewsletterPageContent);

export default function NewsletterPage() {
  return (
    <ErrorBoundary componentName="NewsletterPage">
      <NewsletterPageMemo />
    </ErrorBoundary>
  );
}
