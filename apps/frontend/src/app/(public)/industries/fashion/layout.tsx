import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { SEO_BASE_URL } from '@/lib/seo/constants';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Fashion & Apparel | Luneo',
  description:
    'Virtual try-on, configurateur 3D et lookbook AR pour la mode. Personnalisez vos vêtements avec visualisation réaliste.',
  keywords: ['fashion', 'mode', 'apparel', 'virtual try-on', '3D configurator', 'personnalisation', 'Luneo'],
  canonicalUrl: `${SEO_BASE_URL}/industries/fashion`,
  ogType: 'website',
});

export default function FashionIndustryLayout({ children }: { children: ReactNode }) {
  return children;
}
