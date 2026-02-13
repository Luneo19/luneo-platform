import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata';
import { generateBreadcrumbSchema } from '@/lib/seo/structured-data';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { SEO_BASE_URL } from '@/lib/seo/constants';

const breadcrumbJsonLd = generateBreadcrumbSchema([
  { name: 'Home', url: SEO_BASE_URL },
  { name: 'Solutions', url: `${SEO_BASE_URL}/solutions` },
  { name: 'Marketing & Campagnes', url: `${SEO_BASE_URL}/solutions/marketing` },
]);

export const metadata: Metadata = generateSEOMetadata({
  title: 'Marketing & Campagnes | Luneo',
  description:
    'Outils marketing pour campagnes de personnalisation : UGC, landing pages, lead gen et analytics.',
  keywords: [
    'marketing',
    'campagnes',
    'personnalisation',
    'UGC',
    'lead generation',
    'analytics',
  ],
  canonicalUrl: `${SEO_BASE_URL}/solutions/marketing`,
  ogType: 'website',
});

export default function MarketingLayout({ children }: { children: ReactNode }) {
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
