import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { SEO_BASE_URL } from '@/lib/seo/constants';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Agences & Studios | Luneo',
  description:
    'Solution white-label pour agences créatives. Gérez plusieurs clients avec une seule plateforme. Multi-clients et commissions.',
  keywords: ['agence', 'studio créatif', 'white-label', 'multi-clients', 'personnalisation', 'Luneo'],
  canonicalUrl: `${SEO_BASE_URL}/use-cases/agency`,
  ogType: 'website',
});

export default function AgencyUseCaseLayout({ children }: { children: ReactNode }) {
  return children;
}
