import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { SEO_BASE_URL } from '@/lib/seo/constants';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Showcase | Luneo',
  description:
    'Galerie de créations et projets réalisés avec Luneo. Exemples de personnalisation 2D, 3D et AR.',
  keywords: ['showcase', 'galerie', 'créations', 'projets', 'personnalisation', 'Luneo'],
  canonicalUrl: `${SEO_BASE_URL}/showcase`,
  ogType: 'website',
});

export default function ShowcaseLayout({ children }: { children: ReactNode }) {
  return children;
}
