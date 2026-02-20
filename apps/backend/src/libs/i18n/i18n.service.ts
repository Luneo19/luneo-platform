import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';

export interface Translation {
  key: string;
  locale: string;
  value: string;
  context?: string;
  category?: string;
}

export interface LocaleInfo {
  code: string;
  name: string;
  nativeName: string;
  isActive: boolean;
  isDefault: boolean;
}

@Injectable()
export class I18nService {
  private readonly logger = new Logger(I18nService.name);
  private readonly defaultLocale = 'en';
  private readonly supportedLocales = ['en', 'fr', 'es', 'de', 'it'];

  constructor(
    @Optional() private readonly prisma: PrismaService | null,
    @Optional() private readonly cache: SmartCacheService | null,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Get translation for a key in a specific locale
   */
  async translate(key: string, locale: string = this.defaultLocale, params?: Record<string, string | number>): Promise<string> {
    const cacheKey = `translation:${locale}:${key}`;
    
    // Use cache if available, otherwise direct DB query
    if (this.cache) {
      try {
        const translation = await this.cache.get<string>(
          cacheKey,
          'translation',
          async () => {
            const translation = await this.getTranslationFromDB(key, locale);
            return translation || key;
          },
          { ttl: 3600, tags: [`locale:${locale}`, `key:${key}`] }
        );
        
        const result = translation || key;
        return this.replaceParams(result, params);
      } catch (error) {
        this.logger.warn(`Cache error for translation ${key}, using fallback`, error);
        // Fallback to direct DB query
      }
    }
    
    // Fallback without cache
    const translation = await this.getTranslationFromDB(key, locale);
    const result = translation || key;
    return this.replaceParams(result, params);
  }

  /**
   * Get all translations for a locale
   */
  async getTranslations(locale: string = this.defaultLocale): Promise<Record<string, string>> {
    const cacheKey = `translations:${locale}`;
    
    if (this.cache) {
      try {
        const translations = await this.cache.get<Record<string, string>>(
          cacheKey,
          'translation',
          async () => {
            // In a real implementation, this would query all translations for a locale
            return {};
          },
          { ttl: 3600, tags: [`locale:${locale}`] }
        );
        return translations || {};
      } catch (error) {
        this.logger.warn(`Cache error for translations ${locale}, using fallback`, error);
        return {};
      }
    }
    
    return {};
  }

  /**
   * Get supported locales
   */
  getSupportedLocales(): string[] {
    return this.supportedLocales;
  }

  /**
   * Get default locale
   */
  getDefaultLocale(): string {
    return this.defaultLocale;
  }

  /**
   * Detect locale from Accept-Language header
   */
  detectLocale(acceptLanguage?: string): string {
    if (!acceptLanguage) {
      return this.defaultLocale;
    }

    const languages = acceptLanguage
      .split(',')
      .map(lang => {
        const [code, q = '1'] = lang.trim().split(';q=');
        return { code: code.split('-')[0].toLowerCase(), quality: parseFloat(q) };
      })
      .sort((a, b) => b.quality - a.quality);

    for (const lang of languages) {
      if (this.supportedLocales.includes(lang.code)) {
        return lang.code;
      }
    }

    return this.defaultLocale;
  }

  /**
   * Format date according to locale
   */
  formatDate(date: Date, locale: string = this.defaultLocale, options?: Intl.DateTimeFormatOptions): string {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options,
    }).format(date);
  }

  /**
   * Format number according to locale
   */
  formatNumber(value: number, locale: string = this.defaultLocale, options?: Intl.NumberFormatOptions): string {
    return new Intl.NumberFormat(locale, {
      ...options,
    }).format(value);
  }

  /**
   * Format currency according to locale
   */
  formatCurrency(value: number, currency: string, locale: string = this.defaultLocale): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(value);
  }

  /**
   * Private helper to get translation from database.
   * When a Translation model is added to the Prisma schema, implement the query here
   * (e.g. prisma.translation.findUnique({ where: { key_locale: { key, locale } } }))
   * and return translation?.value ?? null. Until then, returns null so that
   * in-memory/fallback translations are used.
   */
  private async getTranslationFromDB(_key: string, _locale: string): Promise<string | null> {
    if (!this.prisma) {
      return null;
    }
    return null;
  }

  /**
   * Private helper to replace parameters in translation
   */
  private replaceParams(text: string, params?: Record<string, string | number>): string {
    if (!params || Object.keys(params).length === 0) {
      return text;
    }
    
    let result = text;
    for (const [key, value] of Object.entries(params)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, String(value));
    }
    return result;
  }
}

