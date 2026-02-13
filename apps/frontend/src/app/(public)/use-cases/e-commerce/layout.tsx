import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { SEO_BASE_URL } from '@/lib/seo/constants';

export const metadata: Metadata = generateSEOMetadata({
  title: 'E-commerce & Print-on-Demand | Luneo',
  description:
    'Ajoutez la personnalisation 3D/AR à votre boutique en ligne. Intégrations Shopify, WooCommerce. Augmentez vos conversions de 35%.',
  keywords: ['e-commerce', 'personnalisation', 'Shopify', 'WooCommerce', 'print on demand', 'Luneo'],
  canonicalUrl: `${SEO_BASE_URL}/use-cases/e-commerce`,
  ogType: 'website',
});

export default function EcommerceUseCaseLayout({ children }: { children: ReactNode }) {
  return children;
}
