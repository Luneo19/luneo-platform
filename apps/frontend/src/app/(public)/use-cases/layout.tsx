import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata';
import { generateBreadcrumbSchema } from '@/lib/seo/structured-data';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { SEO_BASE_URL } from '@/lib/seo/constants';

const useCasesBreadcrumbJsonLd = generateBreadcrumbSchema([
  { name: 'Home', url: SEO_BASE_URL },
  { name: 'Cas d\'usage', url: `${SEO_BASE_URL}/use-cases` },
]);

export const metadata: Metadata = generateSEOMetadata({
  title: 'Cas d\'usage | Luneo',
  description:
    'Cas d\'usage de personnalisation : e-commerce, print on demand, agences, branding et marketing. Exemples et retours clients.',
  keywords: ['cas d\'usage', 'e-commerce', 'print on demand', 'agence', 'branding', 'Luneo'],
  canonicalUrl: `${SEO_BASE_URL}/use-cases`,
  ogType: 'website',
  alternateLocales: [
    { locale: 'fr', url: `${SEO_BASE_URL}/use-cases` },
    { locale: 'en', url: `${SEO_BASE_URL}/en/use-cases` },
  ],
});

export default function UseCasesLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(useCasesBreadcrumbJsonLd) }}
      />
      {children}
    </>
  );
}
