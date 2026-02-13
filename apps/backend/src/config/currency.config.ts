import { Logger } from '@nestjs/common';
import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const logger = new Logger('CurrencyConfig');

/**
 * Currency Configuration - Support multi-devises
 * 
 * Variables d'environnement :
 * - DEFAULT_CURRENCY : Devise par défaut (EUR, USD, GBP, etc.)
 * - SUPPORTED_CURRENCIES : Liste des devises supportées (comma-separated)
 * - CURRENCY_EXCHANGE_RATE_USD : Taux de change EUR -> USD (optionnel)
 * - CURRENCY_EXCHANGE_RATE_GBP : Taux de change EUR -> GBP (optionnel)
 */

// Devises supportées par le système
export const SUPPORTED_CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'CAD'] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

// Schéma de validation
const currencyEnvSchema = z.object({
  DEFAULT_CURRENCY: z.enum(SUPPORTED_CURRENCIES).default('EUR'),
  SUPPORTED_CURRENCIES: z.string().optional().transform((val) => {
    if (!val) return SUPPORTED_CURRENCIES as readonly string[];
    const currencies = val.split(',').map(c => c.trim().toUpperCase());
    return currencies.filter(c => SUPPORTED_CURRENCIES.includes(c as SupportedCurrency));
  }),
  CURRENCY_EXCHANGE_RATE_USD: z.string().transform(Number).optional().default('1.10'),
  CURRENCY_EXCHANGE_RATE_GBP: z.string().transform(Number).optional().default('0.85'),
  CURRENCY_EXCHANGE_RATE_CHF: z.string().transform(Number).optional().default('0.97'),
  CURRENCY_EXCHANGE_RATE_CAD: z.string().transform(Number).optional().default('1.50'),
});

/**
 * Symboles de devises
 */
export const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  CHF: 'CHF',
  CAD: 'C$',
};

/**
 * Locales par devise pour le formatage
 */
export const CURRENCY_LOCALES: Record<SupportedCurrency, string> = {
  EUR: 'fr-FR',
  USD: 'en-US',
  GBP: 'en-GB',
  CHF: 'de-CH',
  CAD: 'en-CA',
};

/**
 * Devise Stripe compatible
 */
export const STRIPE_CURRENCIES: Record<SupportedCurrency, string> = {
  EUR: 'eur',
  USD: 'usd',
  GBP: 'gbp',
  CHF: 'chf',
  CAD: 'cad',
};

/**
 * Configuration exportée pour NestJS
 */
export const currencyConfig = registerAs('currency', () => {
  const parsed = currencyEnvSchema.safeParse(process.env);
  
  if (!parsed.success) {
    logger.warn('⚠️ Configuration de devise invalide, utilisation des valeurs par défaut');
    return {
      defaultCurrency: 'EUR' as SupportedCurrency,
      supportedCurrencies: SUPPORTED_CURRENCIES as readonly string[],
      exchangeRates: {
        EUR: 1,
        USD: 1.10,
        GBP: 0.85,
        CHF: 0.97,
        CAD: 1.50,
      },
    };
  }
  
  const config = parsed.data;
  
  logger.log(`💱 Devise par défaut: ${config.DEFAULT_CURRENCY}`);
  logger.log(`💱 Devises supportées: ${config.SUPPORTED_CURRENCIES}`);
  
  return {
    defaultCurrency: config.DEFAULT_CURRENCY as SupportedCurrency,
    supportedCurrencies: config.SUPPORTED_CURRENCIES as readonly string[],
    exchangeRates: {
      EUR: 1,
      USD: Number(config.CURRENCY_EXCHANGE_RATE_USD),
      GBP: Number(config.CURRENCY_EXCHANGE_RATE_GBP),
      CHF: Number(config.CURRENCY_EXCHANGE_RATE_CHF),
      CAD: Number(config.CURRENCY_EXCHANGE_RATE_CAD),
    } as Record<SupportedCurrency, number>,
  };
});

/**
 * Detect currency from user locale/region for checkout and display.
 * CH -> chf, European countries -> eur, else usd (Stripe lowercase).
 */
export function detectCurrency(country?: string, locale?: string): string {
  const code = (country ?? locale ?? '').toUpperCase().trim();
  if (!code) return 'usd';

  // Country code: from locale (e.g. fr-CH -> CH), or single code (e.g. CH, DE)
  const parts = code.split(/[-_]/);
  const countryPart =
    parts.length > 1 && parts[1]!.length === 2
      ? parts[1]
      : code.length === 2
        ? code
        : parts[0]?.toUpperCase().slice(0, 2) ?? '';
  if (countryPart === 'CH') return 'chf';
  const eurCountries = ['DE', 'FR', 'IT', 'ES', 'AT', 'BE', 'NL', 'PT', 'IE', 'FI', 'GR', 'LU'];
  if (eurCountries.includes(countryPart)) return 'eur';
  return 'usd';
}

/**
 * Utilitaires pour la gestion des devises
 */
export class CurrencyUtils {
  /**
   * Obtient la devise par défaut depuis l'environnement
   */
  static getDefaultCurrency(): SupportedCurrency {
    const currency = (process.env.DEFAULT_CURRENCY || 'EUR').toUpperCase();
    if (SUPPORTED_CURRENCIES.includes(currency as SupportedCurrency)) {
      return currency as SupportedCurrency;
    }
    return 'EUR';
  }
  
  /**
   * Obtient la devise Stripe (minuscule)
   */
  static getStripeCurrency(currency?: string): string {
    const cur = (currency || this.getDefaultCurrency()).toUpperCase() as SupportedCurrency;
    return STRIPE_CURRENCIES[cur] || 'eur';
  }
  
  /**
   * Vérifie si une devise est supportée
   */
  static isSupported(currency: string): currency is SupportedCurrency {
    return SUPPORTED_CURRENCIES.includes(currency.toUpperCase() as SupportedCurrency);
  }
  
  /**
   * Normalise une devise (majuscule)
   */
  static normalize(currency: string): SupportedCurrency {
    const upper = currency.toUpperCase();
    if (this.isSupported(upper)) {
      return upper as SupportedCurrency;
    }
    return this.getDefaultCurrency();
  }
  
  /**
   * Obtient le symbole d'une devise
   */
  static getSymbol(currency: string): string {
    const normalized = this.normalize(currency);
    return CURRENCY_SYMBOLS[normalized];
  }
  
  /**
   * Formate un montant dans une devise
   */
  static format(amount: number, currency: string, options?: Intl.NumberFormatOptions): string {
    const normalized = this.normalize(currency);
    const locale = CURRENCY_LOCALES[normalized];
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: normalized,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      ...options,
    }).format(amount);
  }
  
  /**
   * Formate un montant en centimes vers une devise
   */
  static formatCents(amountCents: number, currency: string): string {
    return this.format(amountCents / 100, currency);
  }
  
  /**
   * Convertit un montant d'une devise à une autre
   */
  static convert(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    exchangeRates?: Record<string, number>
  ): number {
    const from = this.normalize(fromCurrency);
    const to = this.normalize(toCurrency);
    
    if (from === to) return amount;
    
    // Taux de change par défaut (basés sur EUR)
    const defaultRates: Record<SupportedCurrency, number> = {
      EUR: 1,
      USD: Number(process.env.CURRENCY_EXCHANGE_RATE_USD || '1.10'),
      GBP: Number(process.env.CURRENCY_EXCHANGE_RATE_GBP || '0.85'),
      CHF: Number(process.env.CURRENCY_EXCHANGE_RATE_CHF || '0.97'),
      CAD: Number(process.env.CURRENCY_EXCHANGE_RATE_CAD || '1.50'),
    };
    
    const rates = exchangeRates || defaultRates;
    
    // Convertir vers EUR d'abord, puis vers la devise cible
    const amountInEur = amount / (rates[from] || 1);
    const convertedAmount = amountInEur * (rates[to] || 1);
    
    // Arrondir à 2 décimales
    return Math.round(convertedAmount * 100) / 100;
  }
  
  /**
   * Convertit des centimes d'une devise à une autre
   */
  static convertCents(
    amountCents: number,
    fromCurrency: string,
    toCurrency: string,
    exchangeRates?: Record<string, number>
  ): number {
    const convertedAmount = this.convert(amountCents / 100, fromCurrency, toCurrency, exchangeRates);
    return Math.round(convertedAmount * 100);
  }
}

export default currencyConfig;
