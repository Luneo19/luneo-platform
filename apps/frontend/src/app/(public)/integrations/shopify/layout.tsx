import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { SEO_BASE_URL } from '@/lib/seo/constants';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Intégration Shopify | Luneo',
  description:
    'Connectez le configurateur Luneo à votre boutique Shopify. Personnalisation produit, panier et commandes synchronisées.',
  keywords: ['Shopify', 'intégration', 'e-commerce', 'configurateur', 'personnalisation', 'Luneo'],
  canonicalUrl: `${SEO_BASE_URL}/integrations/shopify`,
  ogType: 'website',
});

export default function ShopifyLayout({ children }: { children: ReactNode }) {
  return children;
}
