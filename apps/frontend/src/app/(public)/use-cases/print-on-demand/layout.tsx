import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { SEO_BASE_URL } from '@/lib/seo/constants';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Print-on-Demand | Luneo',
  description:
    'Automatisez votre business POD avec Luneo. Intégration native Printful, Printify, Teespring. Export print-ready et mockups 3D.',
  keywords: ['print on demand', 'POD', 'Printful', 'Printify', 'Teespring', 'personnalisation', 'Luneo'],
  canonicalUrl: `${SEO_BASE_URL}/use-cases/print-on-demand`,
  ogType: 'website',
});

export default function PrintOnDemandUseCaseLayout({ children }: { children: ReactNode }) {
  return children;
}
