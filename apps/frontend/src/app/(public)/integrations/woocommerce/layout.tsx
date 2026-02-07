import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { SEO_BASE_URL } from '@/lib/seo/constants';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Intégration WooCommerce | Luneo',
  description:
    'Intégrez Luneo à WooCommerce. Configurateur 3D et personnalisation dans votre boutique WordPress.',
  keywords: ['WooCommerce', 'WordPress', 'intégration', 'configurateur', 'personnalisation', 'Luneo'],
  canonicalUrl: `${SEO_BASE_URL}/integrations/woocommerce`,
  ogType: 'website',
});

export default function WooCommerceLayout({ children }: { children: ReactNode }) {
  return children;
}
