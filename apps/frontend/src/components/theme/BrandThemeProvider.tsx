'use client';

import { useEffect, useState } from 'react';

const API_BASE = typeof window !== 'undefined'
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
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    if (!API_BASE || typeof window === 'undefined') {
      setApplied(true);
      return;
    }
    const hostname = window.location.hostname;
    // Skip white-label theme fetch on localhost/dev — no backend running locally
    if (!hostname || hostname === 'localhost' || hostname === '127.0.0.1') {
      setApplied(true);
      return;
    }
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
        setApplied(true);
      })
      .catch(() => setApplied(true));
  }, []);

  return <>{children}</>;
}
