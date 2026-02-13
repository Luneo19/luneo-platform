import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata';
import { generateBreadcrumbSchema } from '@/lib/seo/structured-data';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { SEO_BASE_URL } from '@/lib/seo/constants';

const breadcrumbJsonLd = generateBreadcrumbSchema([
  { name: 'Home', url: SEO_BASE_URL },
  { name: 'Solutions', url: `${SEO_BASE_URL}/solutions` },
  { name: 'Visual Customizer', url: `${SEO_BASE_URL}/solutions/visual-customizer` },
]);

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
