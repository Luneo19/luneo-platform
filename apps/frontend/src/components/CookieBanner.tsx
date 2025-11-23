'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X, Settings, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { useTranslations } from '@/i18n/useI18n';
import { logger } from '@/lib/logger';

interface CookiePreferences {
  essential: boolean; // Toujours true
  analytics: boolean;
  marketing: boolean;
}

export function CookieBanner() {
  const t = useTranslations('cookieBanner');
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Vérifier si l'utilisateur a déjà fait son choix
    const savedPreferences = localStorage.getItem('cookie-preferences');
    
    if (!savedPreferences) {
      // Afficher le banner après 1 seconde
      setTimeout(() => setShowBanner(true), 1000);
    } else {
      try {
        const parsed = JSON.parse(savedPreferences);
        setPreferences(parsed);
      } catch (e) {
        setShowBanner(true);
      }
    }
  }, []);

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem('cookie-preferences', JSON.stringify(prefs));
    localStorage.setItem('cookie-consent-date', new Date().toISOString());
    
    // Implémenter les préférences
    if (prefs.analytics) {
      // Activer Google Analytics / Vercel Analytics
      if (typeof window !== 'undefined' && (window as any).va) {
        (window as any).va('event', 'cookie-consent', { analytics: true });
      }
    }

    if (prefs.marketing) {
      // Activer marketing pixels si nécessaire
      logger.info('Marketing cookies enabled', {
        preferences: prefs,
      });
    }

    setShowBanner(false);
    setShowSettings(false);
  };

  const acceptAll = () => {
    savePreferences({
      essential: true,
      analytics: true,
      marketing: true,
    });
  };

  const acceptEssential = () => {
    savePreferences({
      essential: true,
      analytics: false,
      marketing: false,
    });
  };

  const acceptCustom = () => {
    savePreferences(preferences);
  };

  if (!showBanner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
        data-testid="cookie-banner"
      >
        <Card className="max-w-4xl mx-auto bg-white shadow-2xl border-2 border-slate-200">
          {/* Simple Banner */}
          {!showSettings && (
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 rounded-xl flex-shrink-0">
                  <Cookie className="w-6 h-6 text-blue-600" />
                </div>

                <div className="flex-1">
                  <h3
                    className="text-lg font-bold text-slate-900 mb-2"
                    data-testid="cookie-banner-title"
                  >
                    {t('title')}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {t('description')}
                  </p>
                  <p className="text-slate-500 text-xs mt-2">
                    {t('learnMore')}{' '}
                    <Link href="/legal/privacy" className="text-blue-600 hover:underline">
                      {t('privacyLink')}
                    </Link>
                  </p>
                </div>

                <button
                  onClick={() => setShowBanner(false)}
                  className="text-slate-400 hover:text-slate-600 flex-shrink-0"
                  aria-label={t('closeAria')}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-wrap gap-3 mt-6">
                <Button
                  onClick={acceptAll}
                  className="bg-blue-600 hover:bg-blue-700 text-white flex-1 md:flex-none"
                  data-testid="cookie-banner-accept-all"
                >
                  <Check className="w-4 h-4 mr-2" />
                  {t('buttons.acceptAll')}
                </Button>

                <Button
                  onClick={acceptEssential}
                  variant="outline"
                  className="flex-1 md:flex-none"
                  data-testid="cookie-banner-accept-essential"
                >
                  {t('buttons.essentialOnly')}
                </Button>

                <Button
                  onClick={() => setShowSettings(true)}
                  variant="outline"
                  className="flex-1 md:flex-none"
                  data-testid="cookie-banner-customize"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  {t('buttons.customize')}
                </Button>
              </div>
            </div>
          )}

          {/* Advanced Settings */}
          {showSettings && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900">
                  {t('settingsTitle')}
                </h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Essential cookies */}
                <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                  <input
                    type="checkbox"
                    checked={true}
                    disabled
                    className="mt-1 w-5 h-5 rounded border-slate-300"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-slate-800">{t('essential.title')}</h4>
                      <span className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded">
                        {t('essential.badge')}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">
                      {t('essential.description')}
                    </p>
                  </div>
                </div>

                {/* Analytics cookies */}
                <div className="flex items-start gap-4 p-4 bg-white border-2 border-slate-200 rounded-lg">
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                    className="mt-1 w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-800">{t('analytics.title')}</h4>
                    <p className="text-sm text-slate-600 mt-1">
                      {t('analytics.description')}
                    </p>
                  </div>
                </div>

                {/* Marketing cookies */}
                <div className="flex items-start gap-4 p-4 bg-white border-2 border-slate-200 rounded-lg">
                  <input
                    type="checkbox"
                    checked={preferences.marketing}
                    onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                    className="mt-1 w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-800">{t('marketing.title')}</h4>
                    <p className="text-sm text-slate-600 mt-1">
                      {t('marketing.description')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mt-6">
                <Button
                  onClick={acceptCustom}
                  className="bg-blue-600 hover:bg-blue-700 text-white flex-1 md:flex-none"
                  data-testid="cookie-banner-save-preferences"
                >
                  {t('buttons.save')}
                </Button>

                <Button
                  onClick={acceptAll}
                  variant="outline"
                  className="flex-1 md:flex-none"
                  data-testid="cookie-banner-settings-accept-all"
                >
                  {t('buttons.acceptAll')}
                </Button>

                <Button
                  onClick={() => setShowSettings(false)}
                  variant="ghost"
                  className="flex-1 md:flex-none"
                  data-testid="cookie-banner-settings-cancel"
                >
                  {t('buttons.cancel')}
                </Button>
              </div>

              <p className="text-xs text-slate-500 mt-4 text-center">
                {t('footer')}
              </p>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Overlay */}
      {showBanner && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={() => setShowBanner(false)}
        />
      )}
    </AnimatePresence>
  );
}

