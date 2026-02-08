import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { SEO_BASE_URL } from '@/lib/seo/constants';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Cas d\'usage | Luneo',
  description:
    'Cas d\'usage de personnalisation : e-commerce, print on demand, agences, branding et marketing. Exemples et retours clients.',
  keywords: ['cas d\'usage', 'e-commerce', 'print on demand', 'agence', 'branding', 'Luneo'],
  canonicalUrl: `${SEO_BASE_URL}/use-cases`,
  ogType: 'website',
});

export default function UseCasesLayout({ children }: { children: ReactNode }) {
  return children;
}
