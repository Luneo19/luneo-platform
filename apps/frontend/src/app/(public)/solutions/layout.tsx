/**
 * Solutions Page Layout with SEO Metadata
 * FE-03: Ajouter SEO metadata pages publiques
 */

import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata';
import { generateBreadcrumbSchema } from '@/lib/seo/structured-data';
import { SEO_BASE_URL } from '@/lib/seo/constants';
import type { Metadata } from 'next';
import { ReactNode } from 'react';

const solutionsBreadcrumbJsonLd = generateBreadcrumbSchema([
  { name: 'Home', url: SEO_BASE_URL },
  { name: 'Solutions', url: `${SEO_BASE_URL}/solutions` },
]);

export const metadata: Metadata = generateSEOMetadata({
  title: 'Solutions - Personnalisation par Industrie',
  description: 'Découvrez nos solutions de personnalisation de produits adaptées à votre industrie : Mode, Accessoires, Goodies, Décoration, Sport et plus encore.',
  keywords: [
    'solutions personnalisation',
    'personnalisation mode',
    'personnalisation accessoires',
    'goodies entreprise',
    'produits personnalisés',
    'customisation industrie',
    'B2B personnalisation',
  ],
  canonicalUrl: '/solutions',
  ogType: 'website',
  alternateLocales: [
    { locale: 'fr', url: `${SEO_BASE_URL}/fr/solutions` },
    { locale: 'en', url: `${SEO_BASE_URL}/en/solutions` },
  ],
});

export default function SolutionsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(solutionsBreadcrumbJsonLd) }}
      />
      {children}
    </>
  );
}
