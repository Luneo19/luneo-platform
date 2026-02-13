'use client';

import React, { memo, useState, useEffect, useCallback, useMemo } from 'react';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { Settings, Clock, Mail, Twitter, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { api } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useI18n } from '@/i18n/useI18n';

function MaintenancePageContent() {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState({ hours: 2, minutes: 30, seconds: 0 });

  const countdownTimer = useMemo(() => {
    return setInterval(() => {
      setCountdown((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    const timer = countdownTimer;
    return () => clearInterval(timer);
  }, [countdownTimer]);

  const handleSubscribe = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      await api.post('/api/v1/newsletter/subscribe', { email, source: 'maintenance' });
      setSubscribed(true);
      logger.info('Subscribed to maintenance updates', { email });
    } catch (error) {
      logger.error('Subscription error', error);
    } finally {
      setLoading(false);
    }
  }, [email]);

  const formattedTime = useMemo(() => {
    const h = String(countdown.hours).padStart(2, '0');
    const m = String(countdown.minutes).padStart(2, '0');
    const s = String(countdown.seconds).padStart(2, '0');
    return `${h}:${m}:${s}`;
  }, [countdown]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <motion
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full text-center"
      >
        <motion
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="mx-auto mb-8 w-24 h-24"
        >
          <Settings className="w-full h-full text-blue-400" />
        </motion>

        <h1 className="text-5xl font-bold text-white mb-4">Maintenance en cours</h1>
        <p className="text-xl text-gray-400 mb-8">
          Nous améliorons Luneo pour vous offrir une meilleure expérience
        </p>

        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Clock className="w-6 h-6 text-yellow-400" />
            <span className="text-gray-300">Retour prévu dans</span>
          </div>
          <div className="text-4xl font-mono font-bold text-white mb-2">{formattedTime}</div>
        </div>

        {!subscribed ? (
          <form onSubmit={handleSubscribe} className="mb-8">
            <div className="flex gap-2 max-w-md mx-auto">
              <Input
                type="email"
                placeholder={t('common.yourEmail')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-gray-800 border-gray-700 text-white"
                required
              />
              <Button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Notifier
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Nous vous enverrons un email dès que tout sera prêt
            </p>
          </form>
        ) : (
          <div className="mb-8 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
            <p className="text-green-400 flex items-center justify-center gap-2">
              <Mail className="w-5 h-5" />
              Vous serez notifié par email
            </p>
          </div>
        )}

        <div className="flex justify-center gap-4">
          <Link
            href="https://twitter.com/luneo"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Twitter className="w-5 h-5 text-blue-400" />
          </Link>
          <Link
            href="mailto:support@luneo.app"
            className="p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Mail className="w-5 h-5 text-blue-400" />
          </Link>
        </div>
      </motion>
    </div>
  );
}

const MaintenancePageMemo = memo(MaintenancePageContent);

export default function MaintenancePage() {
  return (
    <ErrorBoundary componentName="MaintenancePage">
      <MaintenancePageMemo />
    </ErrorBoundary>
  );
}
