import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { SEO_BASE_URL } from '@/lib/seo/constants';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Industries | Luneo',
  description:
    'Solutions de personnalisation par industrie : mode, joaillerie, sport, automobile, édition et plus. Adapté à votre secteur.',
  keywords: ['industries', 'mode', 'joaillerie', 'sport', 'automobile', 'personnalisation', 'Luneo'],
  canonicalUrl: `${SEO_BASE_URL}/industries`,
  ogType: 'website',
  alternateLocales: [
    { locale: 'fr', url: `${SEO_BASE_URL}/industries` },
    { locale: 'en', url: `${SEO_BASE_URL}/en/industries` },
  ],
});

export default function IndustriesLayout({ children }: { children: ReactNode }) {
  return children;
}
