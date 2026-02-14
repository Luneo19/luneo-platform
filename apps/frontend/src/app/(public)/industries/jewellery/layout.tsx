import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { SEO_BASE_URL } from '@/lib/seo/constants';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Jewellery & Luxury | Luneo',
  description:
    'Visualisation 3D ultra-réaliste pour bijoux. PBR materials, virtual try-on AR et configurateur pierres/métaux pour la bijouterie.',
  keywords: ['jewellery', 'bijouterie', 'luxury', '3D visualization', 'virtual try-on', 'personnalisation', 'Luneo'],
  canonicalUrl: `${SEO_BASE_URL}/industries/jewellery`,
  ogType: 'website',
});

export default function JewelleryIndustryLayout({ children }: { children: ReactNode }) {
  return children;
}
