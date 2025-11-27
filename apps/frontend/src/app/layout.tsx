import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { CookieBanner } from "@/components/CookieBanner";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { WebVitalsReporter } from "@/components/WebVitalsReporter";
import CrispChat from "@/components/CrispChat";
import { loadI18nConfig } from "@/i18n/server";
import { loadFeatureFlags } from "@/lib/feature-flags/loadFeatureFlags";

const inter = Inter({ subsets: ["latin"] });

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
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon.svg', type: 'image/svg+xml', sizes: 'any' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.svg',
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
      <body className={inter.className}>
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
          <WebVitalsReporter />
          <CrispChat />
        </Providers>
      </body>
    </html>
  );
}