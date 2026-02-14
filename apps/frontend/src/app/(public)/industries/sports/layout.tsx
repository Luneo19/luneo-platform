import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { SEO_BASE_URL } from '@/lib/seo/constants';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Sports & Outdoor | Luneo',
  description:
    'Personnalisation équipement sportif. Chaussures custom, maillots d\'équipe et équipement fitness avec visualisation 3D et AR.',
  keywords: ['sports', 'outdoor', 'équipement sportif', 'personnalisation', '3D', 'Luneo'],
  canonicalUrl: `${SEO_BASE_URL}/industries/sports`,
  ogType: 'website',
});

export default function SportsIndustryLayout({ children }: { children: ReactNode }) {
  return children;
}
