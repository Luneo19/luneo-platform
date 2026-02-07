import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { SEO_BASE_URL } from '@/lib/seo/constants';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Visual Customizer | Luneo',
  description:
    'Personnalisation visuelle 2D/3D pour tous types de produits. Interface simple et export multi-format.',
  keywords: [
    'visual customizer',
    'personnalisation visuelle',
    '2D',
    '3D',
    'export',
    'print-ready',
  ],
  canonicalUrl: `${SEO_BASE_URL}/solutions/visual-customizer`,
  ogType: 'website',
});

export default function VisualCustomizerLayout({ children }: { children: ReactNode }) {
  return children;
}
