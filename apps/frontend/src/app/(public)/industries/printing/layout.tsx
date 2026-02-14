import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { SEO_BASE_URL } from '@/lib/seo/constants';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Printing & Print-on-Demand | Luneo',
  description:
    'Automatisez votre workflow print avec des fichiers prêts à imprimer. Export CMYK, gestion des marges, qualité 300 DPI.',
  keywords: ['printing', 'print on demand', 'CMYK', 'export print-ready', 'personnalisation', 'Luneo'],
  canonicalUrl: `${SEO_BASE_URL}/industries/printing`,
  ogType: 'website',
});

export default function PrintingIndustryLayout({ children }: { children: ReactNode }) {
  return children;
}
