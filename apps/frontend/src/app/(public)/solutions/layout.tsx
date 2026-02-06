/**
 * Solutions Page Layout with SEO Metadata
 * FE-03: Ajouter SEO metadata pages publiques
 */

import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Solutions - Personnalisation par Industrie',
  description: 'Découvrez nos solutions de personnalisation de produits adaptées à votre industrie : Mode, Accessoires, Goodies, Décoration, Sport et plus encore.',
  keywords: [
    'solutions personnalisation',
    'personnalisation mode',
    'personnalisation accessoires',
    'goodies entreprise',
    'produits personnalisés',
    'customisation industrie',
    'B2B personnalisation',
  ],
  canonicalUrl: '/solutions',
  ogType: 'website',
});

export default function SolutionsLayout({ children }: { children: ReactNode }) {
  return children;
}
