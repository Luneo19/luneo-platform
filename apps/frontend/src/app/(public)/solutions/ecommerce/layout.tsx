import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { SEO_BASE_URL } from '@/lib/seo/constants';

export const metadata: Metadata = generateSEOMetadata({
  title: 'E-commerce & Intégrations | Luneo',
  description:
    'Intégrez le configurateur Luneo à Shopify, WooCommerce et votre stack. Panier, commandes et print-on-demand.',
  keywords: [
    'e-commerce',
    'Shopify',
    'WooCommerce',
    'intégration',
    'panier',
    'print on demand',
  ],
  canonicalUrl: `${SEO_BASE_URL}/solutions/ecommerce`,
  ogType: 'website',
});

export default function EcommerceLayout({ children }: { children: ReactNode }) {
  return children;
}
