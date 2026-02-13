import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata';
import { generateBreadcrumbSchema } from '@/lib/seo/structured-data';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { SEO_BASE_URL } from '@/lib/seo/constants';

const breadcrumbJsonLd = generateBreadcrumbSchema([
  { name: 'Home', url: SEO_BASE_URL },
  { name: 'Solutions', url: `${SEO_BASE_URL}/solutions` },
  { name: 'Social & Partenariats', url: `${SEO_BASE_URL}/solutions/social` },
]);

export const metadata: Metadata = generateSEOMetadata({
  title: 'Social & Partenariats | Luneo',
  description:
    'Solutions de personnalisation pour campagnes sociales et partenariats. Co-branding et partage.',
  keywords: [
    'social',
    'partenariats',
    'co-branding',
    'partage',
    'campagnes',
    'personnalisation',
  ],
  canonicalUrl: `${SEO_BASE_URL}/solutions/social`,
  ogType: 'website',
});

export default function SocialLayout({ children }: { children: ReactNode }) {
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
