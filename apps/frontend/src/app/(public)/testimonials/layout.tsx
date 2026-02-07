import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { SEO_BASE_URL } from '@/lib/seo/constants';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Témoignages | Luneo',
  description:
    'Témoignages et retours clients sur la plateforme Luneo. Personnalisation produit, configurateur 3D et intégrations e-commerce.',
  keywords: ['témoignages', 'clients', 'retours', 'personnalisation', 'Luneo', 'SaaS'],
  canonicalUrl: `${SEO_BASE_URL}/testimonials`,
  ogType: 'website',
});

export default function TestimonialsLayout({ children }: { children: ReactNode }) {
  return children;
}
