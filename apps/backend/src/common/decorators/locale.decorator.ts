import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator to extract locale from request headers
 * Usage: @Locale() locale: string
 */
export const Locale = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const acceptLanguage = request.headers['accept-language'];
    
    // Simple locale detection from Accept-Language header
    if (acceptLanguage) {
      const languages = acceptLanguage.split(',');
      const primaryLang = languages[0]?.split(';')[0]?.split('-')[0]?.toLowerCase();
      const supportedLocales = ['en', 'fr', 'es', 'de', 'it'];
      if (primaryLang && supportedLocales.includes(primaryLang)) {
        return primaryLang;
      }
    }
    
    return request.headers['x-locale'] || 'en';
  },
);

