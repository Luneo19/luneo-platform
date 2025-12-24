import type { Metadata } from "next";
import { Inter } from "next/font/google";

// Optimisation des fonts: preload et display swap
const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap', // Améliore le CLS (Cumulative Layout Shift)
  preload: true,
  variable: '--font-inter',
});
import "./globals.css";
import { Providers } from "./providers";
import { CookieBanner } from "@/components/CookieBanner";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { WebVitalsReporter } from "@/components/WebVitalsReporter";
import { LazyAnalytics } from "@/components/LazyAnalytics";

// Initialize Sentry monitoring
if (typeof window !== 'undefined') {
  import('@/lib/monitoring/sentry-init').catch(() => {
    // Sentry initialization failed, continue without it
  });
}

import { loadI18nConfig } from "@/i18n/server";
import { loadFeatureFlags } from "@/lib/feature-flags/loadFeatureFlags";

export const metadata: Metadata = {
  metadataBase: new URL('https://app.luneo.app'),
  title: {
    default: 'Luneo - Plateforme de Personnalisation Produits | Design 2D/3D, AR & Print-Ready',
    template: '%s | Luneo Platform',
  },
  description: 'Créez et personnalisez vos produits avec notre plateforme complète : éditeur 2D (Konva.js), configurateur 3D (Three.js), Virtual Try-On AR, export print-ready (CMYK, PDF/X-4), intégrations e-commerce (Shopify, WooCommerce).',
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
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://app.luneo.app',
    siteName: 'Luneo Platform',
    title: 'Luneo - Plateforme de Personnalisation Produits',
    description: 'Personnalisez vos produits avec notre éditeur 2D/3D, Virtual Try-On AR, et export print-ready professionnel.',
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
    title: 'Luneo - Plateforme de Personnalisation Produits',
    description: 'Personnalisez vos produits avec notre éditeur 2D/3D, Virtual Try-On AR, et export print-ready professionnel.',
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
    google: 'google-site-verification-code', // À remplacer si vous avez un code
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
  manifest: '/manifest.json',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { locale, messages, currency, timezone, availableLocales } = await loadI18nConfig();
  const featureFlags = await loadFeatureFlags();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* Preconnect to Google Fonts for faster font loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Luneo" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={`${inter.className} ${inter.variable}`}>
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
          {children}
          <CookieBanner />
          <Analytics />
          <SpeedInsights />
          <LazyAnalytics />
          <WebVitalsReporter />
        </Providers>
      </body>
    </html>
  );
}