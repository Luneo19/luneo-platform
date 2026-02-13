import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata';
import { generateBreadcrumbSchema } from '@/lib/seo/structured-data';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { SEO_BASE_URL } from '@/lib/seo/constants';

const breadcrumbJsonLd = generateBreadcrumbSchema([
  { name: 'Home', url: SEO_BASE_URL },
  { name: 'Solutions', url: `${SEO_BASE_URL}/solutions` },
  { name: 'Branding & Identité', url: `${SEO_BASE_URL}/solutions/branding` },
]);

export const metadata: Metadata = generateSEOMetadata({
  title: 'Branding & Identité | Luneo',
  description:
    'Cohérence de marque sur tous les produits personnalisés. Kits, guidelines et templates par industrie.',
  keywords: [
    'branding',
    'identité',
    'marque',
    'guidelines',
    'templates',
    'personnalisation',
  ],
  canonicalUrl: `${SEO_BASE_URL}/solutions/branding`,
  ogType: 'website',
});

export default function BrandingLayout({ children }: { children: ReactNode }) {
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
