'use client';

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { LazyMotionDiv as motion, LazyAnimatePresence as AnimatePresence } from '@/lib/performance/dynamic-motion';
import { Cookie, X, Settings, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { useTranslations } from '@/i18n/useI18n';
import { logger } from '@/lib/logger';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface CookiePreferences {
  essential: boolean; // Toujours true
  analytics: boolean;
  marketing: boolean;
}

function CookieBannerContent() {
  const t = useTranslations('cookieBanner');
  const [showBanner, setShowBanner] = useState(false);
  
  // Fallback translations if i18n not loaded
  const getTranslation = useCallback((key: string): string => {
    try {
      const translation = t(key);
      // If translation returns the key itself, use fallback
      if (translation === `cookieBanner.${key}` || translation.startsWith('cookieBanner.')) {
        return getFallbackTranslation(key);
      }
      return translation;
    } catch (e) {
      return getFallbackTranslation(key);
    }
  }, [t]);
  
  const getFallbackTranslation = useCallback((key: string): string => {
    const fallbacks: Record<string, string> = {
      'title': '🍪 Nous utilisons des cookies',
      'description': 'Nous utilisons des cookies pour améliorer votre expérience, analyser notre trafic et personnaliser le contenu. Les cookies essentiels sont nécessaires au fonctionnement du site.',
      'learnMore': 'En savoir plus dans notre',
      'privacyLink': 'Politique de Confidentialité',
      'buttons.acceptAll': 'Tout Accepter',
      'buttons.essentialOnly': 'Essentiels Uniquement',
      'buttons.customize': 'Personnaliser',
      'buttons.save': 'Enregistrer mes Préférences',
      'buttons.cancel': 'Annuler',
      'settingsTitle': 'Préférences de cookies',
      'essential.title': 'Cookies Essentiels',
      'essential.badge': 'Obligatoire',
      'essential.description': 'Nécessaires au fonctionnement du site (authentification, sécurité, préférences).',
      'analytics.title': 'Cookies Analytics',
      'analytics.description': 'Nous aident à comprendre comment vous utilisez le site pour améliorer votre expérience.',
      'marketing.title': 'Cookies Marketing',
      'marketing.description': 'Utilisés pour personnaliser les publicités et mesurer l\'efficacité de nos campagnes.',
      'footer': 'Vous pouvez modifier vos préférences à tout moment',
      'closeAria': 'Fermer la bannière cookies',
    };
    return fallbacks[key] || key;
  }, []);
  
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

  const savePreferences = useCallback((prefs: CookiePreferences) => {
    localStorage.setItem('cookie-preferences', JSON.stringify(prefs));
    localStorage.setItem('cookie-consent-date', new Date().toISOString());
    
    // Implémenter les préférences
    if (prefs.analytics) {
      // Activer Google Analytics / Vercel Analytics
      if (typeof window !== 'undefined' && (window as Window & { va?: (action: string, name: string, opts?: object) => void }).va) {
        (window as Window & { va: (action: string, name: string, opts?: object) => void }).va('event', 'cookie-consent', { analytics: true });
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
  }, []);

  const acceptAll = useCallback(() => {
    savePreferences({
      essential: true,
      analytics: true,
      marketing: true,
    });
  }, [savePreferences]);

  const acceptEssential = useCallback(() => {
    savePreferences({
      essential: true,
      analytics: false,
      marketing: false,
    });
  }, [savePreferences]);

  const acceptCustom = useCallback(() => {
    savePreferences(preferences);
  }, [savePreferences, preferences]);

  const toggleSettings = useCallback(() => {
    setShowSettings((prev) => !prev);
  }, []);

  const handlePreferenceChange = useCallback((key: keyof CookiePreferences, value: boolean) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  }, []);

  if (!showBanner) return null;

  return (
    <AnimatePresence>
      <motion
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
                    {getTranslation('title')}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {getTranslation('description')}
                  </p>
                  <p className="text-slate-500 text-xs mt-2">
                    {getTranslation('learnMore')}{' '}
                    <Link href="/legal/privacy" className="text-blue-600 hover:underline">
                      {getTranslation('privacyLink')}
                    </Link>
                  </p>
                </div>

                <button
                  onClick={() => setShowBanner(false)}
                  className="text-slate-400 hover:text-slate-600 flex-shrink-0"
                  aria-label={getTranslation('closeAria')}
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
                  {getTranslation('buttons.acceptAll')}
                </Button>

                <Button
                  onClick={acceptEssential}
                  variant="outline"
                  className="flex-1 md:flex-none"
                  data-testid="cookie-banner-accept-essential"
                >
                  {getTranslation('buttons.essentialOnly')}
                </Button>

                <Button
                  onClick={toggleSettings}
                  variant="outline"
                  className="flex-1 md:flex-none"
                  data-testid="cookie-banner-customize"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  {getTranslation('buttons.customize')}
                </Button>
              </div>
            </div>
          )}

          {/* Advanced Settings */}
          {showSettings && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900">
                  {getTranslation('settingsTitle')}
                </h3>
                <button
                  onClick={toggleSettings}
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
                      <h4 className="font-semibold text-slate-800">{getTranslation('essential.title')}</h4>
                      <span className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded">
                        {getTranslation('essential.badge')}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">
                      {getTranslation('essential.description')}
                    </p>
                  </div>
                </div>

                {/* Analytics cookies */}
                <div className="flex items-start gap-4 p-4 bg-white border-2 border-slate-200 rounded-lg">
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) => handlePreferenceChange('analytics', e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-800">{getTranslation('analytics.title')}</h4>
                    <p className="text-sm text-slate-600 mt-1">
                      {getTranslation('analytics.description')}
                    </p>
                  </div>
                </div>

                {/* Marketing cookies */}
                <div className="flex items-start gap-4 p-4 bg-white border-2 border-slate-200 rounded-lg">
                  <input
                    type="checkbox"
                    checked={preferences.marketing}
                    onChange={(e) => handlePreferenceChange('marketing', e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-800">{getTranslation('marketing.title')}</h4>
                    <p className="text-sm text-slate-600 mt-1">
                      {getTranslation('marketing.description')}
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
                  {getTranslation('buttons.save')}
                </Button>

                <Button
                  onClick={acceptAll}
                  variant="outline"
                  className="flex-1 md:flex-none"
                  data-testid="cookie-banner-settings-accept-all"
                >
                  {getTranslation('buttons.acceptAll')}
                </Button>

                <Button
                  onClick={toggleSettings}
                  variant="ghost"
                  className="flex-1 md:flex-none"
                  data-testid="cookie-banner-settings-cancel"
                >
                  {getTranslation('buttons.cancel')}
                </Button>
              </div>

              <p className="text-xs text-slate-500 mt-4 text-center">
                {getTranslation('footer')}
              </p>
            </div>
          )}
        </Card>
      </motion>

      {/* Overlay - Non-blocking backdrop for visual effect only */}
      {showBanner && (
        <motion
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 pointer-events-none"
        />
      )}
    </AnimatePresence>
  );
}

const CookieBannerContentMemo = memo(CookieBannerContent);

export function CookieBanner() {
  return (
    <ErrorBoundary componentName="CookieBanner">
      <CookieBannerContentMemo />
    </ErrorBoundary>
  );
}

