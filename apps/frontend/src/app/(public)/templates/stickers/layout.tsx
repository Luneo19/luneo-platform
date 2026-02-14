import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { SEO_BASE_URL } from '@/lib/seo/constants';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Stickers Templates | Luneo',
  description:
    '250+ templates stickers personnalisables. Créez des stickers et décalcomanies uniques avec le configurateur Luneo.',
  keywords: ['stickers', 'décalcomanies', 'templates', 'personnalisation', 'print-ready', 'Luneo'],
  canonicalUrl: `${SEO_BASE_URL}/templates/stickers`,
  ogType: 'website',
});

export default function StickersTemplatesLayout({ children }: { children: ReactNode }) {
  return children;
}
