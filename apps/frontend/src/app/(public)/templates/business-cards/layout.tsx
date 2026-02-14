import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { SEO_BASE_URL } from '@/lib/seo/constants';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Business Cards Templates | Luneo',
  description:
    '100+ templates cartes de visite professionnelles personnalisables. Créez des cartes de visite uniques avec le configurateur Luneo.',
  keywords: ['business cards', 'cartes de visite', 'templates', 'personnalisation', 'print-ready', 'Luneo'],
  canonicalUrl: `${SEO_BASE_URL}/templates/business-cards`,
  ogType: 'website',
});

export default function BusinessCardsTemplatesLayout({ children }: { children: ReactNode }) {
  return children;
}
