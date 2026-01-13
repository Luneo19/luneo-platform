import {
  Navigation,
  HeroSectionNew,
  FeaturesSectionNew,
  HowItWorksNew,
  TestimonialsNew,
  PricingSectionNew,
  CTASectionNew,
  FooterNew,
  CursorGlow,
} from '@/components/marketing/home';
import { generateMetadata as generateSEOMetadata, getOrganizationSchema, getWebsiteSchema } from '@/lib/seo/metadata';
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
  ogImage: '/og-homepage.png',
});

export default function HomePage() {
  const organizationSchema = getOrganizationSchema();
  const websiteSchema = getWebsiteSchema();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <main className="min-h-screen">
        <HeroSectionNew />
        <FeaturesSectionNew />
        <HowItWorksNew />
        <TestimonialsNew />
        <PricingSectionNew />
        <CTASectionNew />
      </main>
    </>
  );
}
