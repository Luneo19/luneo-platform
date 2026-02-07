import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { SEO_BASE_URL } from '@/lib/seo/constants';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Success Stories | Luneo',
  description:
    'Success stories et études de cas. Comment des marques utilisent Luneo pour la personnalisation produit et l\'e-commerce.',
  keywords: ['success stories', 'études de cas', 'cas clients', 'personnalisation', 'Luneo'],
  canonicalUrl: `${SEO_BASE_URL}/success-stories`,
  ogType: 'website',
});

export default function SuccessStoriesLayout({ children }: { children: ReactNode }) {
  return children;
}
