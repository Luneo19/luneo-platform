import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { SEO_BASE_URL } from '@/lib/seo/constants';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Intégration Zapier | Luneo',
  description:
    'Automatisez Luneo avec Zapier. Connectez votre configurateur produit à 6000+ apps : CRM, email, stock, e-commerce et plus.',
  keywords: [
    'Zapier',
    'automatisation',
    'intégration',
    'configurateur',
    'personnalisation',
    'Luneo',
    'workflows',
  ],
  canonicalUrl: `${SEO_BASE_URL}/integrations/zapier`,
  ogType: 'website',
});

export default function ZapierLayout({ children }: { children: ReactNode }) {
  return children;
}
