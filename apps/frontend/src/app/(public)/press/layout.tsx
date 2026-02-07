import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { SEO_BASE_URL } from '@/lib/seo/constants';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Presse | Luneo',
  description:
    'Communiqués de presse, kit média et contacts presse Luneo. Plateforme de personnalisation produit avec IA.',
  keywords: ['presse', 'communiqué', 'kit média', 'Luneo', 'personnalisation', 'SaaS'],
  canonicalUrl: `${SEO_BASE_URL}/press`,
  ogType: 'website',
});

export default function PressLayout({ children }: { children: ReactNode }) {
  return children;
}
