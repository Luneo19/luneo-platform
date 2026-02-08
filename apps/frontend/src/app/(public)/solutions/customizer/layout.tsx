import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { SEO_BASE_URL } from '@/lib/seo/constants';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Visual Customizer | Luneo',
  description:
    'Éditeur visuel 2D pour personnaliser textiles, goodies et packaging. Texte, images, couleurs et export print-ready.',
  keywords: [
    'customizer',
    'éditeur visuel',
    'personnalisation 2D',
    'print-ready',
    'goodies',
    'textile',
  ],
  canonicalUrl: `${SEO_BASE_URL}/solutions/customizer`,
  ogType: 'website',
});

export default function CustomizerLayout({ children }: { children: ReactNode }) {
  return children;
}
