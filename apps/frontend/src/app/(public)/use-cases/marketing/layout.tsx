import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { SEO_BASE_URL } from '@/lib/seo/constants';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Marketing & Automation | Luneo',
  description:
    'Automatisez la création de visuels marketing avec IA. Génération en masse, A/B testing, templates brandés. Gagnez 10h/semaine.',
  keywords: ['marketing', 'automation', 'génération IA', 'visuels', 'personnalisation', 'Luneo'],
  canonicalUrl: `${SEO_BASE_URL}/use-cases/marketing`,
  ogType: 'website',
});

export default function MarketingUseCaseLayout({ children }: { children: ReactNode }) {
  return children;
}
