import {
  Navigation,
  HeroSectionNew,
  FeaturesSectionNew,
  HowItWorksNew,
  DemoModulesSection,
  TestimonialsNew,
  PricingSectionNew,
  Integrations,
  FAQSection,
  CTASectionNew,
  FooterNew,
  CursorGlow,
  LogoWatermarkSection,
} from '@/components/marketing/home';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { generateMetadata as generateSEOMetadata, getOrganizationSchema, getWebsiteSchema } from '@/lib/seo/metadata';
import { SEO_BASE_URL } from '@/lib/seo/constants';
import type { Metadata } from 'next';

/**
 * Homepage - Modern landing page with all sections
 * Based on Pandawa template design, adapted for Luneo
 * This is a Server Component - all child components are Client Components
 * 
 * REFONTE COMPLÈTE - Janvier 2025
 * Nouveau design basé sur le template Pandawa avec animations et effets modernes
 */

export const metadata: Metadata = generateSEOMetadata({
  title: 'Luneo - Personnalisation de Produits avec IA',
  description: 'Plateforme SaaS B2B pour la personnalisation de produits avec intelligence artificielle. Créez des designs uniques, visualisez en 3D/AR, et intégrez facilement dans votre e-commerce.',
  keywords: [
    'personnalisation produits',
    'IA design',
    '3D configurator',
    'AR try-on',
    'e-commerce',
    'SaaS B2B',
    'white-label',
    'Shopify',
    'WooCommerce',
  ],
  ogType: 'website',
  ogImage: '/og-image.png',
});

const softwareApplicationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Luneo',
  applicationCategory: 'DesignApplication',
  operatingSystem: 'Web',
  description:
    'Plateforme SaaS B2B pour la personnalisation de produits avec intelligence artificielle. Créez des designs uniques, visualisez en 3D/AR, et intégrez facilement dans votre e-commerce.',
  url: SEO_BASE_URL,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
};

export default function HomePage() {
  const organizationSchema = getOrganizationSchema();
  const websiteSchema = getWebsiteSchema();

  return (
    <ErrorBoundary componentName="HomePage">
      <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: typeof organizationSchema === 'string' ? organizationSchema : JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: typeof websiteSchema === 'string' ? websiteSchema : JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationJsonLd) }}
      />
      <main className="min-h-screen w-full min-w-0">
        <HeroSectionNew />
        <FeaturesSectionNew />
        <DemoModulesSection />
        <HowItWorksNew />
        <TestimonialsNew />
        <PricingSectionNew />
        <Integrations />
        <FAQSection />
        <LogoWatermarkSection />
        <CTASectionNew />
      </main>
    </>
    </ErrorBoundary>
  );
}
