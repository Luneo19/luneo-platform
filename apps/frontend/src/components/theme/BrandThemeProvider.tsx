'use client';

import { useEffect } from 'react';

// Use relative URLs in production (HTTPS) to go through Vercel proxy and avoid CORS.
// Only use absolute backend URL in local development.
const API_BASE = typeof window !== 'undefined' && window.location.protocol === 'http:'
  ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001')
  : '';

interface BrandTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily?: string;
  borderRadius?: string;
  logoUrl?: string;
  faviconUrl?: string;
  customCss?: string;
}

/**
 * Loads brand theme when the app is served on a custom domain (white-label).
 * Fetches GET /api/v1/white-label/theme-by-domain?domain=hostname and applies CSS variables.
 */
export function BrandThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hostname = window.location.hostname;
    const skipDomains = ['localhost', '127.0.0.1', 'luneo.app', 'www.luneo.app'];
    const isVercelPreview = hostname.endsWith('.vercel.app');
    if (!hostname || skipDomains.includes(hostname) || isVercelPreview) return;
    fetch(
      `${API_BASE}/api/v1/white-label/theme-by-domain?domain=${encodeURIComponent(hostname)}`,
      { credentials: 'include' }
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((theme: BrandTheme | null) => {
        if (theme && typeof theme === 'object') {
          const root = document.documentElement;
          root.style.setProperty('--brand-primary', theme.primaryColor);
          root.style.setProperty('--brand-secondary', theme.secondaryColor ?? theme.primaryColor);
          root.style.setProperty('--brand-accent', theme.accentColor ?? theme.primaryColor);
          root.style.setProperty('--brand-background', theme.backgroundColor);
          root.style.setProperty('--brand-foreground', theme.textColor);
          if (theme.fontFamily) root.style.setProperty('--brand-font', theme.fontFamily);
          if (theme.borderRadius) root.style.setProperty('--brand-radius', theme.borderRadius);
          if (theme.logoUrl) root.style.setProperty('--brand-logo-url', `url(${theme.logoUrl})`);
        }
      })
      .catch(() => undefined);
  }, []);

  return <>{children}</>;
}
