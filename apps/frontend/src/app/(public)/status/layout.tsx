import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { SEO_BASE_URL } from '@/lib/seo/constants';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Statut des services | Luneo',
  description:
    'État des services Luneo en temps réel. Disponibilité API, configurateur, éditeur et intégrations.',
  keywords: ['statut', 'status', 'disponibilité', 'uptime', 'Luneo', 'SaaS'],
  canonicalUrl: `${SEO_BASE_URL}/status`,
  ogType: 'website',
});

export default function StatusLayout({ children }: { children: ReactNode }) {
  return children;
}
