'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Clock, Mail, Twitter, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

export default function MaintenancePage() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState({ hours: 2, minutes: 30, seconds: 0 });

  // Countdown timer (simulation)
  useEffect(() => {
    const timer = setInterval(() => {
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

    return () => clearInterval(timer);
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'maintenance' }),
      });
      setSubscribed(true);
    } catch (error) {
      console.error('Subscription error', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-cyan-900/10 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        {/* Animated Gear */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-32 h-32 mx-auto mb-8"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0"
          >
            <Settings className="w-full h-full text-cyan-500/30" />
          </motion.div>
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-4"
          >
            <Settings className="w-full h-full text-cyan-400/50" />
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-4xl md:text-5xl font-bold text-white mb-4"
        >
          Maintenance en cours
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-xl text-gray-400 mb-8 max-w-lg mx-auto"
        >
          Nous mettons à jour Luneo pour vous offrir une meilleure expérience.
          Nous serons de retour très bientôt !
        </motion.p>

        {/* Countdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex justify-center gap-4 mb-12"
        >
          {[
            { value: countdown.hours, label: 'Heures' },
            { value: countdown.minutes, label: 'Minutes' },
            { value: countdown.seconds, label: 'Secondes' },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-4 min-w-[80px]"
            >
              <span className="text-3xl md:text-4xl font-bold text-white">
                {item.value.toString().padStart(2, '0')}
              </span>
              <p className="text-xs text-gray-500 mt-1">{item.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Notification Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 mb-8"
        >
          {subscribed ? (
            <div className="py-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-green-400" />
              </div>
              <p className="text-green-400 font-medium">Parfait !</p>
              <p className="text-gray-400 text-sm">Nous vous préviendrons dès que nous serons de retour.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 text-gray-300 mb-4">
                <Clock className="w-5 h-5 text-cyan-400" />
                <span>Être notifié quand Luneo sera disponible</span>
              </div>
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Votre email"
                  className="flex-1 bg-gray-900/50 border-gray-600 text-white"
                  required
                />
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-cyan-600 hover:bg-cyan-700"
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
              </form>
            </>
          )}
        </motion.div>

        {/* Status Updates */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-gray-400 text-sm"
        >
          <p className="mb-4">Suivez les mises à jour en temps réel :</p>
          <div className="flex justify-center gap-4">
            <a
              href="https://twitter.com/luneo_app"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Twitter className="w-4 h-4 text-cyan-400" />
              @luneo_app
            </a>
            <a
              href="https://status.luneo.app"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Settings className="w-4 h-4 text-cyan-400" />
              Page statut
            </a>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 text-gray-500 text-sm"
        >
          <p>Besoin d'aide urgente ?</p>
          <a href="mailto:support@luneo.app" className="text-cyan-400 hover:underline">
            support@luneo.app
          </a>
        </motion.div>
      </div>
    </div>
  );
}

