import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata';
import { generateBreadcrumbSchema } from '@/lib/seo/structured-data';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { SEO_BASE_URL } from '@/lib/seo/constants';

const breadcrumbJsonLd = generateBreadcrumbSchema([
  { name: 'Home', url: SEO_BASE_URL },
  { name: 'Solutions', url: `${SEO_BASE_URL}/solutions` },
  { name: 'AI Design Hub', url: `${SEO_BASE_URL}/solutions/ai-design-hub` },
]);

export const metadata: Metadata = generateSEOMetadata({
  title: 'AI Design Hub | Luneo',
  description:
    'Générez des designs produits avec l\'IA. Création d\'images, variations et intégration directe dans votre configurateur.',
  keywords: [
    'IA design',
    'génération images',
    'personnalisation IA',
    'DALL-E',
    'design produit',
  ],
  canonicalUrl: `${SEO_BASE_URL}/solutions/ai-design-hub`,
  ogType: 'website',
});

export default function AIDesignHubLayout({ children }: { children: ReactNode }) {
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
