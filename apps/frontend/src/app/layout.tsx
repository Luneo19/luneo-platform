import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";

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
  preload: true,
  variable: '--font-display',
  weight: ['400', '500', '600', '700', '800'],
});
import "./globals.css";
import { Providers } from "./providers";
import { CookieBanner } from "@/components/CookieBanner";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
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
    default: 'Luneo - Plateforme de personnalisation produit IA',
    template: '%s | Luneo',
  },
  description: 'Luneo est la plateforme SaaS de personnalisation produit par IA : éditeur 2D/3D, Virtual Try-On AR, export print-ready, intégrations e-commerce (Shopify, WooCommerce).',
  keywords: [
    'personnalisation produits',
    'design 2D',
    'configurateur 3D',
    'virtual try-on',
    'AR',
    'print-ready',
    'CMYK',
    'Shopify',
    'WooCommerce',
    'customizer',
    'product configurator',
    'e-commerce',
    'print on demand',
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
    title: 'Luneo - Plateforme de personnalisation produit IA',
    description: 'Luneo est la plateforme SaaS de personnalisation produit par IA : éditeur 2D/3D, Virtual Try-On AR, export print-ready.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Luneo Platform - Product Customization',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Luneo - Plateforme de personnalisation produit IA',
    description: 'Luneo est la plateforme SaaS de personnalisation produit par IA : éditeur 2D/3D, Virtual Try-On AR, export print-ready.',
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
      { url: '/favicon.png', type: 'image/png' },
      { url: '/favicon.png', type: 'image/png', sizes: 'any' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.png',
  },
  manifest: '/manifest.webmanifest',
};

// Force dynamic rendering car loadI18nConfig() utilise cookies()
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Gestion d'erreur pour éviter les 500
  let locale: SupportedLocale = 'en';
  let messages: TranslationMessages = {} as TranslationMessages;
  let currency = 'USD';
  let timezone = 'America/New_York';
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
    // Utiliser les valeurs par défaut
    locale = 'en';
    messages = {} as TranslationMessages;
    currency = 'USD';
    timezone = 'America/New_York';
    availableLocales = [
      { locale: 'en', label: 'English', region: 'United States', flag: '🇺🇸' },
      { locale: 'fr', label: 'Français', region: 'France', flag: '🇫🇷' },
      { locale: 'de', label: 'Deutsch', region: 'Deutschland', flag: '🇩🇪' },
      { locale: 'es', label: 'Español', region: 'España', flag: '🇪🇸' },
      { locale: 'it', label: 'Italiano', region: 'Italia', flag: '🇮🇹' },
    ];
  }

  try {
    featureFlags = await loadFeatureFlags();
  } catch (error) {
    serverLogger.error('[Layout] Failed to load feature flags', error);
    // Utiliser les valeurs par défaut
    featureFlags = {
      flags: {
        enableAIGeneration: true,
        enable3DConfigurator: true,
        enableVirtualTryOn: true,
        enableARExport: true,
        enableBulkGeneration: true,
        enableAdvancedAnalytics: true,
        enableTeamCollaboration: true,
        enableShopifyIntegration: true,
        enableWooCommerceIntegration: true,
        enablePrintfulIntegration: true,
        enableNewPricingPage: true,
        enableReferralProgram: true,
        enableNotificationCenter: true,
        enableSupportTickets: true,
        enableExperimentalFeatures: false,
        enableDebugMode: false,
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
        <link rel="manifest" href="/manifest.webmanifest" />
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
      <body className={`${inter.className} ${inter.variable} ${jakarta.variable} overflow-x-hidden`}>
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-full focus:font-semibold focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
        >
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
            <CookieBanner />
            <Analytics />
            <SpeedInsights />
            <LazyAnalytics />
            <WebVitalsReporter />
          </AnalyticsProvider>
        </Providers>
      </body>
    </html>
  );
}