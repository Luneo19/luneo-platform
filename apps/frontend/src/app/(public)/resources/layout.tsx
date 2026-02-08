import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { SEO_BASE_URL } from '@/lib/seo/constants';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Ressources | Luneo',
  description:
    'Guides, tutoriels et ressources pour la personnalisation produit. Documentation, bonnes pratiques et cas d\'usage.',
  keywords: ['ressources', 'guides', 'tutoriels', 'documentation', 'personnalisation', 'Luneo'],
  canonicalUrl: `${SEO_BASE_URL}/resources`,
  ogType: 'website',
});

export default function ResourcesLayout({ children }: { children: ReactNode }) {
  return children;
}
