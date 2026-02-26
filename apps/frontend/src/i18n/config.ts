export const SUPPORTED_LOCALES = ['en', 'fr'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = 'fr';
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
};

export const AVAILABLE_LOCALES = SUPPORTED_LOCALES.map((locale) => ({
  locale,
  ...LOCALE_METADATA[locale],
}));

