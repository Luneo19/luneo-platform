import { Injectable, Logger } from '@nestjs/common';
import translate from '@vitalets/google-translate-api';

const ISO3_TO_LOCALE: Record<string, string> = {
  eng: 'en',
  fra: 'fr',
  fre: 'fr',
  deu: 'de',
  ger: 'de',
  spa: 'es',
  ita: 'it',
  por: 'pt',
  rus: 'ru',
  tur: 'tr',
  nld: 'nl',
  ara: 'ar',
  zho: 'zh',
  cmn: 'zh',
  jpn: 'ja',
  kor: 'ko',
  pol: 'pl',
};

export interface LocalizedPrompt {
  prompt: string;
  originalLocale: string | null;
  targetLocale: string;
  translated: boolean;
}

@Injectable()
export class PromptLocalizationService {
  private readonly logger = new Logger(PromptLocalizationService.name);
  private readonly cache = new Map<string, LocalizedPrompt>();
  private francModulePromise: Promise<typeof import('franc')> | null = null;

  async normalizePrompt(prompt: string, targetLocale = 'en'): Promise<LocalizedPrompt> {
    const trimmed = prompt.trim();
    if (!trimmed) {
      return {
        prompt,
        originalLocale: null,
        targetLocale,
        translated: false,
      };
    }

    const cacheKey = `${trimmed}__${targetLocale}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const detectedLocale = await this.detectLocale(trimmed);

    if (!detectedLocale || detectedLocale === targetLocale) {
      const result: LocalizedPrompt = {
        prompt: trimmed,
        originalLocale: detectedLocale,
        targetLocale,
        translated: false,
      };
      this.cache.set(cacheKey, result);
      return result;
    }

    if (process.env.ENABLE_PROMPT_TRANSLATION === 'false') {
      const result: LocalizedPrompt = {
        prompt: trimmed,
        originalLocale: detectedLocale,
        targetLocale,
        translated: false,
      };
      this.cache.set(cacheKey, result);
      return result;
    }

    try {
      const translation = await translate(trimmed, {
        from: detectedLocale,
        to: targetLocale,
      });

      const localized: LocalizedPrompt = {
        prompt: translation.text,
        originalLocale: detectedLocale,
        targetLocale,
        translated: true,
      };
      this.cache.set(cacheKey, localized);
      return localized;
    } catch (error) {
      this.logger.warn(
        `Échec de la traduction automatique (${detectedLocale} -> ${targetLocale}), utilisation du prompt original.`,
        error instanceof Error ? error.message : String(error),
      );

      const fallback: LocalizedPrompt = {
        prompt: trimmed,
        originalLocale: detectedLocale,
        targetLocale,
        translated: false,
      };
      this.cache.set(cacheKey, fallback);
      return fallback;
    }
  }

  private async detectLocale(prompt: string): Promise<string | null> {
    try {
      const { franc } = await this.loadFrancModule();
      const iso3 = franc(prompt, { minLength: 10 });

      if (!iso3 || iso3 === 'und') {
        return null;
      }

      if (ISO3_TO_LOCALE[iso3]) {
        return ISO3_TO_LOCALE[iso3];
      }

      return iso3.slice(0, 2);
    } catch (error) {
      this.logger.warn(
        `Impossible de détecter la langue du prompt`,
        error instanceof Error ? error.message : String(error),
      );
      return null;
    }
  }

  private loadFrancModule() {
    if (!this.francModulePromise) {
      this.francModulePromise = import('franc');
    }
    return this.francModulePromise;
  }
}

