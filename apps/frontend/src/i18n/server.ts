import { cookies, headers } from 'next/headers';
import {
  AVAILABLE_LOCALES,
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_METADATA,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from './config';

type Messages = typeof import('./locales/en').default;

const MESSAGE_LOADERS: Record<SupportedLocale, () => Promise<Messages>> = {
  en: () => import('./locales/en').then((m) => m.default as unknown as Messages),
  fr: () => import('./locales/fr').then((m) => m.default as unknown as Messages),
  de: () => import('./locales/de').then((m) => m.default as unknown as Messages),
  es: () => import('./locales/es').then((m) => m.default as unknown as Messages),
  it: () => import('./locales/it').then((m) => m.default as unknown as Messages),
};

const SUPPORTED_SET = new Set<SupportedLocale>(SUPPORTED_LOCALES);

interface I18nConfig {
  locale: SupportedLocale;
  messages: Messages;
  currency: string;
  timezone: string;
  availableLocales: Array<{
    locale: SupportedLocale;
    label: string;
    region: string;
    flag: string;
  }>;
}

export async function loadI18nConfig(): Promise<I18nConfig> {
  const detectedLocale = await detectLocale();
  const fallbackMessages = await MESSAGE_LOADERS.en();
  const loaded =
    detectedLocale === 'en' ? fallbackMessages : await MESSAGE_LOADERS[detectedLocale]();
  const messages =
    detectedLocale === 'en' || loaded == null
      ? fallbackMessages
      : deepMerge(fallbackMessages, loaded);

  const meta = LOCALE_METADATA[detectedLocale];

  return {
    locale: detectedLocale,
    messages,
    currency: meta.currency,
    timezone: meta.timezone,
    availableLocales: AVAILABLE_LOCALES.map(({ locale, label, region, flag }) => ({
      locale,
      label,
      region,
      flag,
    })),
  };
}

async function detectLocale(): Promise<SupportedLocale> {
  const cookieStore = await cookies();
  const requestedLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  if (requestedLocale && isSupportedLocale(requestedLocale)) {
    return requestedLocale;
  }

  const headerStore = await headers();
  const acceptLanguage = headerStore.get('accept-language') ?? '';
  const candidates = parseAcceptLanguage(acceptLanguage);
  for (const candidate of candidates) {
    if (isSupportedLocale(candidate)) {
      return candidate;
    }
    const [base] = candidate.split('-');
    if (isSupportedLocale(base)) {
      return base;
    }
  }

  return DEFAULT_LOCALE;
}

function isSupportedLocale(locale: string | undefined | null): locale is SupportedLocale {
  if (!locale) return false;
  return SUPPORTED_SET.has(locale.toLowerCase() as SupportedLocale);
}

function parseAcceptLanguage(header: string): string[] {
  return header
    .split(',')
    .map((part) => {
      const [lang, qValue] = part.trim().split(';q=');
      const quality = qValue ? Number.parseFloat(qValue) : 1;
      return { lang: lang.toLowerCase(), quality };
    })
    .filter(({ lang }) => Boolean(lang))
    .sort((a, b) => b.quality - a.quality)
    .map(({ lang }) => lang);
}

function deepMerge<T extends Record<string, unknown>>(base: T, addition: Partial<T>): T {
  const output: Record<string, unknown> = { ...base };

  for (const [key, value] of Object.entries(addition)) {
    if (value === undefined) {
      continue;
    }

    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      typeof output[key] === 'object' &&
      output[key] !== null &&
      !Array.isArray(output[key])
    ) {
      output[key] = deepMerge(output[key] as Record<string, unknown>, value as Record<string, unknown>);
    } else {
      output[key] = value;
    }
  }

  return output as T;
}

export type { Messages as TranslationMessages, SupportedLocale };

