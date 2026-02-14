import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { SEO_BASE_URL } from '@/lib/seo/constants';

export const metadata: Metadata = generateSEOMetadata({
  title: 'T-Shirts Templates | Luneo',
  description:
    'Plus de 500 templates t-shirts prêts à personnaliser. Créez des t-shirts sur mesure avec le configurateur et export print-ready.',
  keywords: ['t-shirts', 'templates', 'personnalisation', 'print on demand', 'sublimation', 'Luneo'],
  canonicalUrl: `${SEO_BASE_URL}/templates/t-shirts`,
  ogType: 'website',
});

export default function TShirtsTemplatesLayout({ children }: { children: ReactNode }) {
  return children;
}
