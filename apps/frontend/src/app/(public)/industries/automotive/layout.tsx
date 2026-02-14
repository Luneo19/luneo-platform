import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { SEO_BASE_URL } from '@/lib/seo/constants';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Automotive | Luneo',
  description:
    'Configurateur véhicule 3D, AR showroom et essai virtuel. Transformez votre showroom automobile avec la réalité augmentée.',
  keywords: ['automotive', 'automobile', 'vehicle configurator', 'AR showroom', 'personnalisation', 'Luneo'],
  canonicalUrl: `${SEO_BASE_URL}/industries/automotive`,
  ogType: 'website',
});

export default function AutomotiveIndustryLayout({ children }: { children: ReactNode }) {
  return children;
}
