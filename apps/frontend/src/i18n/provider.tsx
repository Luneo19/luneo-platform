'use client';

import { createContext, useContext, useMemo } from 'react';
import type { TranslationMessages, SupportedLocale } from './server';

type Primitive = string | number | boolean | null | undefined;

interface TranslationValues {
  [key: string]: Primitive;
}

interface AvailableLocale {
  locale: SupportedLocale;
  label: string;
  region: string;
  flag: string;
}

export interface I18nContextValue {
  locale: SupportedLocale;
  messages: TranslationMessages;
  currency: string;
  timezone: string;
  availableLocales: AvailableLocale[];
  t: (key: string, values?: TranslationValues) => string;
  formatCurrency: (value: number, options?: Intl.NumberFormatOptions & { currency?: string }) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatDateTime: (
    value: Date | string | number,
    options?: Intl.DateTimeFormatOptions & { timeZone?: string },
  ) => string;
}

export const I18nContext = createContext<I18nContextValue | null>(null);

interface I18nProviderProps {
  locale: SupportedLocale;
  messages: TranslationMessages;
  currency: string;
  timezone: string;
  availableLocales: AvailableLocale[];
  children: React.ReactNode;
}

export function I18nProvider({
  locale,
  messages,
  currency,
  timezone,
  availableLocales,
  children,
}: I18nProviderProps) {
  const value = useMemo<I18nContextValue>(() => {
    const numberFormatter = new Intl.NumberFormat(locale);
    const currencyFormatter = (overrideCurrency?: string) =>
      new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: overrideCurrency ?? currency,
      });
    const dateFormatter = (options?: Intl.DateTimeFormatOptions) =>
      new Intl.DateTimeFormat(locale, {
        timeZone: timezone,
        ...options,
      });

    return {
      locale,
      messages,
      currency,
      timezone,
      availableLocales,
      t: (key, values) => translate(messages, key, values),
      formatCurrency: (value, options) => currencyFormatter(options?.currency).format(value),
      formatNumber: (value, options) =>
        options ? new Intl.NumberFormat(locale, options).format(value) : numberFormatter.format(value),
      formatDateTime: (value, options) => {
        const date =
          typeof value === 'string' || typeof value === 'number'
            ? new Date(value)
            : value;
        return dateFormatter(options).format(date);
      },
    };
  }, [locale, messages, currency, timezone, availableLocales]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

function translate(messages: TranslationMessages, key: string, values?: TranslationValues): string {
  const resolveValue = (inputKey: string): unknown => {
    const segments = inputKey.split('.');
    let current: unknown = messages;

    for (const segment of segments) {
      if (current && typeof current === 'object' && segment in (current as Record<string, unknown>)) {
        current = (current as Record<string, unknown>)[segment];
      } else {
        return undefined;
      }
    }

    return current;
  };

  const toReadableFallback = (missingKey: string): string => {
    const token = missingKey.split('.').pop() || missingKey;
    const normalized = token.replace(/[-_]/g, ' ').trim();
    if (!normalized) return missingKey;
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  };

  const aliasKey = key.replace('pricing.plans.pro.', 'pricing.plans.professional.');

  const segments = key.split('.');
  let current: unknown = messages;

  for (const segment of segments) {
    if (current && typeof current === 'object' && segment in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[segment];
    } else {
      current = resolveValue(aliasKey);
      break;
    }
  }

  if (typeof current !== 'string') {
    return toReadableFallback(key);
  }

  if (!values) {
    return current;
  }

  return current.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, token: string) => {
    const replacement = values[token];
    return replacement === undefined || replacement === null ? '' : String(replacement);
  });
}

export function useI18nContext(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18nContext must be used within an I18nProvider');
  }
  return context;
}

/** Returns context or null when not inside I18nProvider (for useI18n unification). */
export function useI18nContextOptional(): I18nContextValue | null {
  return useContext(I18nContext);
}
