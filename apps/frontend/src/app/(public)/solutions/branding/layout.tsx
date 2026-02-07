import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { SEO_BASE_URL } from '@/lib/seo/constants';

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
  return children;
}
