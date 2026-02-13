import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata';
import { generateBreadcrumbSchema } from '@/lib/seo/structured-data';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { SEO_BASE_URL } from '@/lib/seo/constants';

const breadcrumbJsonLd = generateBreadcrumbSchema([
  { name: 'Home', url: SEO_BASE_URL },
  { name: 'Solutions', url: `${SEO_BASE_URL}/solutions` },
  { name: '3D Asset Hub', url: `${SEO_BASE_URL}/solutions/3d-asset-hub` },
]);

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
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {children}
    </>
  );
}
