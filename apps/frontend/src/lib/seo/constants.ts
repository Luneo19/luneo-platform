/**
 * SEO constants - base URL and sitemap/robots defaults.
 * Set NEXT_PUBLIC_APP_URL in production (e.g. https://luneo.app).
 */
const rawBaseUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  'https://luneo.app';

function canonicalizeSeoBaseUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'app.luneo.app' || parsed.hostname === 'www.luneo.app') {
      parsed.hostname = 'luneo.app';
    }
    parsed.protocol = 'https:';
    return parsed.origin;
  } catch {
    return 'https://luneo.app';
  }
}

export const SEO_BASE_URL = canonicalizeSeoBaseUrl(rawBaseUrl);
