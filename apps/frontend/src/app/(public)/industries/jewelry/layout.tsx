import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { SEO_BASE_URL } from '@/lib/seo/constants';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Jewelry & Luxury | Luneo',
  description:
    'Photorealistic 3D visualization for jewelry. PBR materials, AR virtual try-on and configurator for stones and metals.',
  keywords: ['jewelry', 'bijouterie', 'luxury', '3D visualization', 'virtual try-on', 'personnalisation', 'Luneo'],
  canonicalUrl: `${SEO_BASE_URL}/industries/jewelry`,
  ogType: 'website',
});

export default function JewelryIndustryLayout({ children }: { children: ReactNode }) {
  return children;
}
