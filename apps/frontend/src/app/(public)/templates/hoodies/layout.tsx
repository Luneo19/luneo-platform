import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { SEO_BASE_URL } from '@/lib/seo/constants';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Hoodies Templates | Luneo',
  description:
    'Templates 3D de hoodies personnalisables. Créez des sweats à capuche sur mesure avec le configurateur et export print-ready.',
  keywords: ['hoodies', 'sweats', 'templates', 'personnalisation', '3D', 'print on demand', 'Luneo'],
  canonicalUrl: `${SEO_BASE_URL}/templates/hoodies`,
  ogType: 'website',
});

export default function HoodiesTemplatesLayout({ children }: { children: ReactNode }) {
  return children;
}
