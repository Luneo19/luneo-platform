import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata';
import { generateBreadcrumbSchema } from '@/lib/seo/structured-data';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { SEO_BASE_URL } from '@/lib/seo/constants';

const breadcrumbJsonLd = generateBreadcrumbSchema([
  { name: 'Home', url: SEO_BASE_URL },
  { name: 'Solutions', url: `${SEO_BASE_URL}/solutions` },
  { name: 'Virtual Try-On & AR', url: `${SEO_BASE_URL}/solutions/virtual-try-on` },
]);

export const metadata: Metadata = generateSEOMetadata({
  title: 'Virtual Try-On & AR | Luneo',
  description:
    'Essayage virtuel et AR pour lunettes, bijoux et accessoires. Réalité augmentée et partage sur les réseaux.',
  keywords: [
    'virtual try-on',
    'AR',
    'réalité augmentée',
    'essayage virtuel',
    'lunettes',
    'bijoux',
  ],
  canonicalUrl: `${SEO_BASE_URL}/solutions/virtual-try-on`,
  ogType: 'website',
});

export default function VirtualTryOnLayout({ children }: { children: ReactNode }) {
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
