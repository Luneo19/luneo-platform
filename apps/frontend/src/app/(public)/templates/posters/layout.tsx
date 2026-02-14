import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { SEO_BASE_URL } from '@/lib/seo/constants';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Posters Templates | Luneo',
  description:
    'Plus de 400 templates posters personnalisables. Créez des affiches et posters sur mesure avec le configurateur design Luneo.',
  keywords: ['posters', 'affiches', 'templates', 'personnalisation', 'design', 'Luneo'],
  canonicalUrl: `${SEO_BASE_URL}/templates/posters`,
  ogType: 'website',
});

export default function PostersTemplatesLayout({ children }: { children: ReactNode }) {
  return children;
}
