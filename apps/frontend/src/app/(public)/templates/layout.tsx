import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { SEO_BASE_URL } from '@/lib/seo/constants';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Templates | Luneo',
  description:
    'Templates de personnalisation : t-shirts, mugs, cartes de visite, goodies. Prêts à l\'emploi pour votre configurateur.',
  keywords: ['templates', 't-shirts', 'mugs', 'goodies', 'personnalisation', 'Luneo'],
  canonicalUrl: `${SEO_BASE_URL}/templates`,
  ogType: 'website',
});

export default function TemplatesLayout({ children }: { children: ReactNode }) {
  return children;
}
