import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata';
import { generateBreadcrumbSchema } from '@/lib/seo/structured-data';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { SEO_BASE_URL } from '@/lib/seo/constants';

const breadcrumbJsonLd = generateBreadcrumbSchema([
  { name: 'Home', url: SEO_BASE_URL },
  { name: 'Solutions', url: `${SEO_BASE_URL}/solutions` },
  { name: 'Visual Customizer', url: `${SEO_BASE_URL}/solutions/customizer` },
]);

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
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {children}
    </>
  );
}
