/**
 * useI18n Hook
 * I-001 à I-015: Hook React pour l'internationalisation
 */

'use client';

import { useState, useCallback, useEffect, createContext } from 'react';
import { useRouter } from 'next/navigation';
import {
  createTranslator,
  formatDate as formatDateFn,
  formatCurrency as formatCurrencyFn,
  formatNumber as formatNumberFn,
  formatRelativeTime as formatRelativeTimeFn,
  detectBrowserLocale,
  type Locale,
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  LOCALE_NAMES,
  LOCALE_FLAGS,
} from './_core';
import { useI18nContextOptional } from './provider';

interface AvailableLocale {
  locale: Locale;
  label: string;
  region: string;
  flag: string;
}

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: ReturnType<typeof createTranslator>;
  formatDate: (date: Date | number) => string;
  formatCurrency: (amount: number, currency?: string) => string;
  formatNumber: (number: number) => string;
  formatRelativeTime: (date: Date | number) => string;
  supportedLocales: typeof SUPPORTED_LOCALES;
  availableLocales: AvailableLocale[];
  localeNames: typeof LOCALE_NAMES;
  localeFlags: typeof LOCALE_FLAGS;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const LOCALE_STORAGE_KEY = 'luneo_locale';

/**
 * Get stored locale from localStorage
 */
function getStoredLocale(): Locale | null {
  const stored = typeof window !== 'undefined' ? localStorage.getItem(LOCALE_STORAGE_KEY) : null;
  if (stored && SUPPORTED_LOCALES.includes(stored as Locale)) {
    return stored as Locale;
  }
  return null;
}

/** Persist locale to cookie and localStorage; update document.lang. */
function persistLocale(locale: Locale): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  document.cookie = `${LOCALE_STORAGE_KEY}=${locale}; path=/; max-age=31536000; SameSite=Lax`;
  document.documentElement.lang = locale;
}

/**
 * useI18n hook
 * - t(key): use nested keys, e.g. t('common.error'), t('auth.login'). Falls back to key if missing.
 * - t(key, { max: 10 }): replace {{max}} in the translation string.
 * - locale / setLocale: current locale and setter (persisted in localStorage).
 */
export function useI18n() {
  const providerContext = useI18nContextOptional();
  const router = useRouter();
  const [fallbackLocale, setFallbackLocale] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    if (!providerContext) {
      const stored = getStoredLocale();
      if (stored) setFallbackLocale(stored);
      else setFallbackLocale(detectBrowserLocale());
    }
  }, [providerContext]);

  const setLocale = useCallback(
    (newLocale: Locale) => {
      persistLocale(newLocale);
      if (!providerContext) setFallbackLocale(newLocale);
      router.refresh();
    },
    [providerContext, router],
  );

  if (providerContext) {
    const locale = providerContext.locale as Locale;
    return {
      locale,
      setLocale,
      t: (key: string, variables?: Record<string, string | number>) =>
        providerContext.t(key, variables as Record<string, string | number | boolean | null | undefined>),
      formatDate: (date: Date | number) =>
        providerContext.formatDateTime(date, { dateStyle: 'long', timeStyle: undefined }),
      formatCurrency: (amount: number, currency?: string) => providerContext.formatCurrency(amount, { currency }),
      formatNumber: (number: number) => providerContext.formatNumber(number),
      formatRelativeTime: (date: Date | number) => formatRelativeTimeFn(date, locale),
      supportedLocales: SUPPORTED_LOCALES,
      availableLocales: providerContext.availableLocales as AvailableLocale[],
      localeNames: LOCALE_NAMES,
      localeFlags: LOCALE_FLAGS,
    };
  }

  const locale = fallbackLocale;
  const t = createTranslator(locale);
  const availableLocales: AvailableLocale[] = SUPPORTED_LOCALES.map((loc) => ({
    locale: loc,
    label: LOCALE_NAMES[loc],
    region: loc === 'en' ? 'US' : loc.toUpperCase(),
    flag: LOCALE_FLAGS[loc],
  }));

  return {
    locale,
    setLocale,
    t,
    formatDate: (date: Date | number) => formatDateFn(date, locale),
    formatCurrency: (amount: number, currency?: string) => formatCurrencyFn(amount, currency, locale),
    formatNumber: (number: number) => formatNumberFn(number, locale),
    formatRelativeTime: (date: Date | number) => formatRelativeTimeFn(date, locale),
    supportedLocales: SUPPORTED_LOCALES,
    availableLocales,
    localeNames: LOCALE_NAMES,
    localeFlags: LOCALE_FLAGS,
  };
}

// useTranslations hook with namespace support
export function useTranslations(namespace?: string) {
  const i18n = useI18n();
  
  if (namespace) {
    // Return a translator scoped to the namespace
    return (key: string, params?: Record<string, string | number>) => {
      return i18n.t(`${namespace}.${key}`, params);
    };
  }
  
  // Return the full translator
  return i18n.t;
}

export { I18nContext };
export type { I18nContextValue };
