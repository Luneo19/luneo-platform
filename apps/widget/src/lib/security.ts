import { isBrowser, now } from './utils';

export interface WidgetRateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export interface WidgetSecurityOptions {
  allowedOrigins?: string[];
  trustedCdnUrls?: string[];
  sandboxAttributes?: string[];
  requestTimeoutMs?: number;
}

export const DEFAULT_RATE_LIMIT: WidgetRateLimitConfig = Object.freeze({
  maxRequests: 5,
  windowMs: 60_000,
});

export const DEFAULT_SANDBOX_ATTRIBUTES = Object.freeze([
  'allow-scripts',
  'allow-same-origin',
  'allow-popups',
  'allow-downloads',
  'allow-forms',
  'allow-pointer-lock',
]);

export const sanitizePrompt = (value: string, maxLength = 500): string => {
  if (!value) {
    return '';
  }

  const trimmed = value.trim().slice(0, maxLength);
  const withoutScripts = trimmed.replace(/<script[^>]*?>[\s\S]*?<\/script>/gi, '');
  const withoutTags = withoutScripts.replace(/<[^>]+>/g, '');
  const normalizedWhitespace = withoutTags.replace(/\s+/g, ' ');

  return normalizedWhitespace;
};

export const isOriginAllowed = (origin: string | null, allowedOrigins?: string[]): boolean => {
  if (!origin) {
    return true;
  }

  if (!allowedOrigins || allowedOrigins.length === 0) {
    return true;
  }

  return allowedOrigins.some((allowed) => {
    if (allowed === '*') {
      return true;
    }

    if (allowed.startsWith('*.')) {
      const domain = allowed.slice(2);
      return origin.endsWith(domain);
    }

    return origin === allowed;
  });
};

export interface CspOptions {
  apiUrl: string;
  cdnUrl?: string;
  imgUrl?: string;
  frameAncestors?: string[];
}

export const buildWidgetCsp = ({
  apiUrl,
  cdnUrl,
  imgUrl,
  frameAncestors = ["'self'"],
}: CspOptions): string => {
  const directives: Record<string, string[]> = {
    'default-src': ["'none'"],
    'base-uri': ["'none'"],
    'script-src': ["'self'", "'unsafe-inline'", cdnUrl ?? 'https://cdn.jsdelivr.net'],
    'style-src': ["'self'", "'unsafe-inline'", cdnUrl ?? 'https://cdn.jsdelivr.net'],
    'img-src': ["'self'", 'data:', imgUrl ?? apiUrl],
    'connect-src': ["'self'", apiUrl],
    'font-src': ["'self'", cdnUrl ?? 'https://fonts.gstatic.com'],
    'frame-ancestors': frameAncestors,
    'object-src': ["'none'"],
    'form-action': ["'none'"],
  };

  return Object.entries(directives)
    .map(([key, values]) => `${key} ${Array.from(new Set(values.filter(Boolean))).join(' ')}`)
    .join('; ');
};

export const buildSandboxAttribute = (custom?: string[]): string => {
  const attributes = new Set([...(custom ?? []), ...DEFAULT_SANDBOX_ATTRIBUTES]);
  return Array.from(attributes).join(' ');
};

export const getRuntimeOrigin = (): string | null => {
  if (!isBrowser) {
    return null;
  }
  try {
    return window.location.origin;
  } catch (error) {
    console.warn('Unable to resolve window origin', error);
    return null;
  }
};

export const createRateLimiter = ({
  maxRequests,
  windowMs,
}: WidgetRateLimitConfig) => {
  const timestamps: number[] = [];

  return {
    tryConsume(): boolean {
      const current = now();
      while (timestamps.length && current - timestamps[0] > windowMs) {
        timestamps.shift();
      }

      if (timestamps.length >= maxRequests) {
        return false;
      }

      timestamps.push(current);
      return true;
    },
    remaining(): number {
      const current = now();
      while (timestamps.length && current - timestamps[0] > windowMs) {
        timestamps.shift();
      }
      return Math.max(maxRequests - timestamps.length, 0);
    },
    reset(): void {
      timestamps.length = 0;
    },
  };
};


