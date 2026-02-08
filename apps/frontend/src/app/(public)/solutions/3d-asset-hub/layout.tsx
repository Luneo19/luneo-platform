import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { SEO_BASE_URL } from '@/lib/seo/constants';

export const metadata: Metadata = generateSEOMetadata({
  title: '3D Asset Hub | Luneo',
  description:
    'Bibliothèque de modèles 3D et assets pour votre configurateur. Import, optimisation et gestion des ressources.',
  keywords: [
    '3D assets',
    'modèles 3D',
    'bibliothèque',
    'GLB',
    'glTF',
    'configurateur',
  ],
  canonicalUrl: `${SEO_BASE_URL}/solutions/3d-asset-hub`,
  ogType: 'website',
});

export default function AssetHubLayout({ children }: { children: ReactNode }) {
  return children;
}
