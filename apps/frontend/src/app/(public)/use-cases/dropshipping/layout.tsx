import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { SEO_BASE_URL } from '@/lib/seo/constants';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Dropshipping | Luneo',
  description:
    'Personnalisation produits pour dropshipping. Intégration AliExpress et CJDropshipping. Catalogues automatisés et mockups IA.',
  keywords: ['dropshipping', 'AliExpress', 'CJDropshipping', 'personnalisation', 'mockups', 'Luneo'],
  canonicalUrl: `${SEO_BASE_URL}/use-cases/dropshipping`,
  ogType: 'website',
});

export default function DropshippingUseCaseLayout({ children }: { children: ReactNode }) {
  return children;
}
