/**
 * i18n Core — Pure utility functions and locale data.
 * This file MUST NOT import from ./useI18n to avoid circular dependencies.
 */

import en from './locales/en';
import { fr } from './locales/fr';

export type Locale = 'fr' | 'en';

// PRODUCTION FIX: Aligned with config.ts - default to 'fr' (primary market is francophone/Swiss)
export const DEFAULT_LOCALE: Locale = 'fr';

export const SUPPORTED_LOCALES: Locale[] = ['en', 'fr'];

export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  fr: 'Français',
};

export const LOCALE_FLAGS: Record<Locale, string> = {
  en: '🇬🇧',
  fr: '🇫🇷',
};

/** Shape of centralized translations (fr/en); de/es/it JSON cast to this for fallback. */
type TranslationDict = typeof fr;

const translations: Record<string, TranslationDict> = {
  en: en as unknown as TranslationDict,
  fr,
};

/**
 * Get nested translation value by path
 */
function getNestedValue(obj: Record<string, unknown>, path: string): string | undefined {
  const keys = path.split('.');
  let result = obj;

  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key] as Record<string, unknown>;
    } else {
      return undefined;
    }
  }

  return typeof result === 'string' ? result : undefined;
}

/**
 * Replace template variables in translation string
 */
function replaceVariables(text: string, variables?: Record<string, string | number>): string {
  if (!variables) return text;

  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key]?.toString() ?? match;
  });
}

function formatMissingKeyFallback(key: string): string {
  const lastSegment = key.split('.').pop() || key;
  return lastSegment
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Get translation function for a locale
 */
export function createTranslator(locale: Locale = DEFAULT_LOCALE) {
  const dict = translations[locale] || translations[DEFAULT_LOCALE];

  return function t(
    key: string,
    variables?: Record<string, string | number>,
    fallback?: string
  ): string {
    const value = getNestedValue(dict, key);

    if (value === undefined) {
      const defaultValue = getNestedValue(translations[DEFAULT_LOCALE], key);
      if (defaultValue !== undefined) {
        return replaceVariables(defaultValue, variables);
      }
      return fallback ?? formatMissingKeyFallback(key);
    }

    return replaceVariables(value, variables);
  };
}

/**
 * Format date according to locale
 */
export function formatDate(date: Date | number, locale: Locale = DEFAULT_LOCALE): string {
  const d = typeof date === 'number' ? new Date(date) : date;
  return d.toLocaleDateString(locale === 'en' ? 'en-US' : `${locale}-${locale.toUpperCase()}`, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format currency according to locale
 */
export function formatCurrency(
  amount: number,
  currency: string = 'EUR',
  locale: Locale = DEFAULT_LOCALE
): string {
  return new Intl.NumberFormat(locale === 'en' ? 'en-US' : `${locale}-${locale.toUpperCase()}`, {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Format number according to locale
 */
export function formatNumber(number: number, locale: Locale = DEFAULT_LOCALE): string {
  return new Intl.NumberFormat(locale === 'en' ? 'en-US' : `${locale}-${locale.toUpperCase()}`).format(number);
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | number, locale: Locale = DEFAULT_LOCALE): string {
  const d = typeof date === 'number' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (diffDays > 0) return rtf.format(-diffDays, 'day');
  if (diffHours > 0) return rtf.format(-diffHours, 'hour');
  if (diffMins > 0) return rtf.format(-diffMins, 'minute');
  return rtf.format(-diffSecs, 'second');
}

/**
 * Detect browser locale
 */
export function detectBrowserLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;

  const browserLang = navigator.language.split('-')[0] as Locale;
  return SUPPORTED_LOCALES.includes(browserLang) ? browserLang : DEFAULT_LOCALE;
}

export { en, fr };
export type { TranslationDict };
