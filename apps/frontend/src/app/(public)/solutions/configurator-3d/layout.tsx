import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { SEO_BASE_URL } from '@/lib/seo/constants';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Configurateur 3D | Luneo',
  description:
    'Configurateur 3D interactif pour personnaliser vos produits en temps réel. Intégration e-commerce, matériaux et textures, export AR.',
  keywords: [
    'configurateur 3D',
    'personnalisation 3D',
    'Three.js',
    'e-commerce 3D',
    'AR',
    'visualisation produit',
  ],
  canonicalUrl: `${SEO_BASE_URL}/solutions/configurator-3d`,
  ogType: 'website',
});

export default function Configurator3DLayout({ children }: { children: ReactNode }) {
  return children;
}
