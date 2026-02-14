import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { SEO_BASE_URL } from '@/lib/seo/constants';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Furniture & Home Decor | Luneo',
  description:
    'AR placement et configurateur 3D pour mobilier. Visualisez meubles dans votre intérieur, choisissez tissus et finitions.',
  keywords: ['furniture', 'mobilier', 'home decor', 'AR placement', '3D configurator', 'personnalisation', 'Luneo'],
  canonicalUrl: `${SEO_BASE_URL}/industries/furniture`,
  ogType: 'website',
});

export default function FurnitureIndustryLayout({ children }: { children: ReactNode }) {
  return children;
}
