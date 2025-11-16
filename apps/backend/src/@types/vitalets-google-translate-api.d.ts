declare module '@vitalets/google-translate-api' {
  export interface TranslateOptions {
    from?: string;
    to?: string;
    raw?: boolean;
    client?: 'dict-chrome-ex' | 'gtx';
  }

  export interface TranslateLanguage {
    iso: string;
  }

  export interface TranslateResult {
    text: string;
    raw?: unknown;
    from: {
      language: TranslateLanguage;
      text?: {
        autoCorrected?: boolean;
        value?: string;
        didYouMean?: boolean;
      };
    };
  }

  export default function translate(
    text: string,
    options?: TranslateOptions,
  ): Promise<TranslateResult>;
}

