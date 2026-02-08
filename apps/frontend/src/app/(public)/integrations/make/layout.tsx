import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { SEO_BASE_URL } from '@/lib/seo/constants';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Intégration Make | Luneo',
  description:
    'Automatisez Luneo avec Make (Integromat). Scénarios visuels pour connecter configurateur, e-commerce et outils métier.',
  keywords: ['Make', 'Integromat', 'automatisation', 'scénarios', 'Luneo', 'intégration'],
  canonicalUrl: `${SEO_BASE_URL}/integrations/make`,
  ogType: 'website',
});

export default function MakeLayout({ children }: { children: ReactNode }) {
  return children;
}
