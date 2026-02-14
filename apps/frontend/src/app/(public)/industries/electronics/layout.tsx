import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { SEO_BASE_URL } from '@/lib/seo/constants';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Electronics | Luneo',
  description:
    'Configuration tech products en 3D. PC builder, personnalisation coques smartphone et AR placement pour TV et sound systems.',
  keywords: ['electronics', 'tech', 'PC builder', 'smartphone cases', 'AR placement', 'personnalisation', 'Luneo'],
  canonicalUrl: `${SEO_BASE_URL}/industries/electronics`,
  ogType: 'website',
});

export default function ElectronicsIndustryLayout({ children }: { children: ReactNode }) {
  return children;
}
