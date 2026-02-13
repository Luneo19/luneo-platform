import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata';
import { generateBreadcrumbSchema } from '@/lib/seo/structured-data';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { SEO_BASE_URL } from '@/lib/seo/constants';

const breadcrumbJsonLd = generateBreadcrumbSchema([
  { name: 'Home', url: SEO_BASE_URL },
  { name: 'Solutions', url: `${SEO_BASE_URL}/solutions` },
  { name: 'Réseaux Sociaux & Partage', url: `${SEO_BASE_URL}/solutions/social-media` },
]);

export const metadata: Metadata = generateSEOMetadata({
  title: 'Réseaux Sociaux & Partage | Luneo',
  description:
    'Partagez les créations sur les réseaux, UGC et campagnes sociales. QR codes et liens de personnalisation.',
  keywords: [
    'réseaux sociaux',
    'partage',
    'UGC',
    'QR code',
    'social media',
    'personnalisation',
  ],
  canonicalUrl: `${SEO_BASE_URL}/solutions/social-media`,
  ogType: 'website',
});

export default function SocialMediaLayout({ children }: { children: ReactNode }) {
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
