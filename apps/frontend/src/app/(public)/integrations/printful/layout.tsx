import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { SEO_BASE_URL } from '@/lib/seo/constants';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Intégration Printful | Luneo',
  description:
    'Print on demand avec Printful et Luneo. Personnalisez, commandez et faites livrer par Printful.',
  keywords: ['Printful', 'print on demand', 'POD', 'personnalisation', 'Luneo', 'e-commerce'],
  canonicalUrl: `${SEO_BASE_URL}/integrations/printful`,
  ogType: 'website',
});

export default function PrintfulLayout({ children }: { children: ReactNode }) {
  return children;
}
