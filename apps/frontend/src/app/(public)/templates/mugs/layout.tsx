import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { SEO_BASE_URL } from '@/lib/seo/constants';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Mugs Templates | Luneo',
  description:
    'Templates mugs personnalisables en 3D. Créez des mugs sur mesure avec le configurateur 360° et export print-ready.',
  keywords: ['mugs', 'tasses', 'templates', 'personnalisation', '3D configurator', 'print on demand', 'Luneo'],
  canonicalUrl: `${SEO_BASE_URL}/templates/mugs`,
  ogType: 'website',
});

export default function MugsTemplatesLayout({ children }: { children: ReactNode }) {
  return children;
}
