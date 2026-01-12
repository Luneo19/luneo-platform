export const SUPPORTED_LOCALES = ['en', 'fr', 'de', 'es', 'it'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = 'en';
export const LOCALE_COOKIE = 'luneo_locale';

export const LOCALE_METADATA: Record<
  SupportedLocale,
  { label: string; region: string; flag: string; currency: string; timezone: string }
> = {
  en: {
    label: 'English',
    region: 'United States',
    flag: '🇺🇸',
    currency: 'USD',
    timezone: 'America/New_York',
  },
  fr: {
    label: 'Français',
    region: 'France',
    flag: '🇫🇷',
    currency: 'EUR',
    timezone: 'Europe/Paris',
  },
  de: {
    label: 'Deutsch',
    region: 'Deutschland',
    flag: '🇩🇪',
    currency: 'EUR',
    timezone: 'Europe/Berlin',
  },
  es: {
    label: 'Español',
    region: 'España',
    flag: '🇪🇸',
    currency: 'EUR',
    timezone: 'Europe/Madrid',
  },
  it: {
    label: 'Italiano',
    region: 'Italia',
    flag: '🇮🇹',
    currency: 'EUR',
    timezone: 'Europe/Rome',
  },
};

export const AVAILABLE_LOCALES = SUPPORTED_LOCALES.map((locale) => ({
  locale,
  ...LOCALE_METADATA[locale],
}));

