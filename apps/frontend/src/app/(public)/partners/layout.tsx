import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { SEO_BASE_URL } from '@/lib/seo/constants';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Partenaires | Luneo',
  description:
    'Rejoignez le programme partenaires Luneo. Commissions, support dédié et ressources pour développer votre activité de personnalisation.',
  keywords: ['partenaires', 'programme partenaire', 'commissions', 'resellers', 'Luneo'],
  canonicalUrl: `${SEO_BASE_URL}/partners`,
  ogType: 'website',
});

export default function PartnersLayout({ children }: { children: ReactNode }) {
  return children;
}
