import {
  HeroSectionNew,
  FeaturesSectionNew,
  HowItWorksNew,
  ConversionNarrativeSection,
  PricingSectionNew,
  CTASectionNew,
  SocialProofSection,
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
  title: 'Luneo - Agents IA autonomes pour votre service client',
  description: 'Déployez des agents IA qui résolvent 80% des demandes clients. Créez, entraînez et déployez des agents conversationnels alimentés par vos données. En 15 minutes, sans code.',
  keywords: [
    'agents IA',
    'service client',
    'chatbot',
    'support automatisé',
    'IA conversationnelle',
    'SaaS',
    'automatisation',
    'base de connaissances',
  ],
  ogType: 'website',
  ogImage: '/og-image.png',
});

const softwareApplicationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Luneo',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  description:
    'Agents IA autonomes pour le service client. Créez, entraînez et déployez des agents conversationnels alimentés par vos données. En 15 minutes, sans code.',
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
        <SocialProofSection />
        <FeaturesSectionNew />
        <HowItWorksNew />
        <ConversionNarrativeSection />
        <PricingSectionNew />
        <CTASectionNew />
      </main>
    </>
    </ErrorBoundary>
  );
}
