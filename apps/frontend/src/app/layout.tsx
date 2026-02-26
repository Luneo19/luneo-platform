import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter, Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";

// Optimisation des fonts: preload et display swap
const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  preload: true,
  variable: '--font-inter',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: 'swap',
  preload: false,
  variable: '--font-display',
  weight: ['400', '500', '600', '700', '800'],
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  display: 'swap',
  preload: false,
  variable: '--font-editorial',
  weight: ['400', '500', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
});
import "./globals.css";
import { Providers } from "./providers";
import { CookieBanner } from "@/components/CookieBanner";
import { WebVitalsReporter } from "@/components/WebVitalsReporter";
import { LazyAnalytics } from "@/components/LazyAnalytics";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";

// Initialize Sentry monitoring
if (typeof window !== 'undefined') {
  import('@/lib/monitoring/sentry-init').catch(() => {
    // Sentry initialization failed, continue without it
  });
}

import { loadI18nConfig, type SupportedLocale, type TranslationMessages } from "@/i18n/server";
import { loadFeatureFlags } from "@/lib/feature-flags/loadFeatureFlags";
import { getDefaultOrganizationSchema, getDefaultWebSiteSchema } from '@/lib/seo/schema';
import { SEO_BASE_URL } from '@/lib/seo/constants';
import { serverLogger } from "@/lib/logger-server";

export const metadata: Metadata = {
  metadataBase: new URL(SEO_BASE_URL),
  title: {
    default: 'Luneo - Agents IA autonomes pour votre entreprise',
    template: '%s | Luneo',
  },
  description: 'Luneo est la plateforme d\'agents IA pour automatiser votre service client, vos ventes et votre support. Déployez des agents conversationnels entraînés sur vos données en 15 minutes, sans code.',
  keywords: [
    'agents IA',
    'chatbot IA',
    'service client automatisé',
    'support client IA',
    'agent conversationnel',
    'RAG',
    'base de connaissances',
    'automatisation support',
    'IA entreprise',
    'agent virtuel',
    'NLP',
    'intelligence artificielle',
    'SaaS IA',
  ],
  authors: [{ name: 'Luneo Team' }],
  creator: 'Luneo',
  publisher: 'Luneo',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: SEO_BASE_URL,
    siteName: 'Luneo',
    title: 'Luneo - Agents IA autonomes pour votre entreprise',
    description: 'Déployez des agents IA qui résolvent 80% des demandes clients automatiquement. Service client, ventes, support — en 15 minutes, sans code.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Luneo - Plateforme d\'Agents IA',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Luneo - Agents IA autonomes pour votre entreprise',
    description: 'Déployez des agents IA qui résolvent 80% des demandes clients automatiquement. Service client, ventes, support — en 15 minutes, sans code.',
    images: ['/og-image.png'],
    creator: '@luneo_app',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
  manifest: '/manifest.webmanifest',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Gestion d'erreur pour éviter les 500 (default fr for French platform)
  let locale: SupportedLocale = 'fr';
  let messages: TranslationMessages = {} as TranslationMessages;
  let currency = 'EUR';
  let timezone = 'Europe/Paris';
  let availableLocales: Array<{
    locale: SupportedLocale;
    label: string;
    region: string;
    flag: string;
  }> = [];
  let featureFlags: { flags: Record<string, boolean>; updatedAt: string | null } = { flags: {}, updatedAt: null };

  try {
    const i18nConfig = await loadI18nConfig();
    locale = i18nConfig.locale;
    messages = i18nConfig.messages;
    currency = i18nConfig.currency;
    timezone = i18nConfig.timezone;
    availableLocales = i18nConfig.availableLocales;
  } catch (error) {
    serverLogger.error('[Layout] Failed to load i18n config', error);
    locale = 'fr';
    messages = {} as TranslationMessages;
    currency = 'EUR';
    timezone = 'Europe/Paris';
    availableLocales = [
      { locale: 'en', label: 'English', region: 'United States', flag: '🇺🇸' },
      { locale: 'fr', label: 'Français', region: 'France', flag: '🇫🇷' },
    ];
  }

  try {
    featureFlags = await loadFeatureFlags();
  } catch (error) {
    serverLogger.error('[Layout] Failed to load feature flags', error);
    // Utiliser les valeurs par défaut
    featureFlags = {
      flags: {
        enableVisualBuilder: false,
        enableEmailChannel: false,
        enableAdvancedAnalytics: false,
        enableWhiteLabel: false,
        enableApiAccess: false,
        enableAgentTemplates: true,
        enableKnowledgeBase: true,
        enableWidgetChat: true,
      },
      updatedAt: null,
    };
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* Preconnect to Google Fonts for faster font loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="theme-color" content="#7c3aed" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Luneo" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        
        {/* Structured Data (Schema.org) for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: getDefaultOrganizationSchema(),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: getDefaultWebSiteSchema(),
          }}
        />
      </head>
      <body className={`${inter.className} ${inter.variable} ${jakarta.variable} ${playfair.variable} overflow-x-hidden`} suppressHydrationWarning>
        <a href="#main-content" className="skip-link">
          Aller au contenu
        </a>
        <Providers
          locale={locale}
          messages={messages}
          currency={currency}
          timezone={timezone}
          availableLocales={availableLocales}
          featureFlags={featureFlags.flags}
          featureFlagsUpdatedAt={featureFlags.updatedAt}
        >
          <AnalyticsProvider>
            {children}
            <Toaster />
            <SonnerToaster position="top-right" richColors closeButton />
            {/* Suspense boundaries isolate dynamic({ssr:false}) bailouts
                so they don't propagate to the root loading.tsx Suspense */}
            <Suspense fallback={null}>
              <CookieBanner />
            </Suspense>
            <Suspense fallback={null}>
              <LazyAnalytics />
            </Suspense>
            <Suspense fallback={null}>
              <WebVitalsReporter />
            </Suspense>
          </AnalyticsProvider>
        </Providers>
      </body>
    </html>
  );
}