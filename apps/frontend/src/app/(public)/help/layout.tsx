/**
 * Help Center Layout
 * Provides SEO metadata for all help and documentation pages
 */

import type { Metadata } from 'next';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Centre d\'Aide - Luneo',
  description: 'Documentation complète, tutoriels, guides d\'intégration et FAQ pour la plateforme Luneo. Apprenez à utiliser toutes les fonctionnalités.',
  keywords: [
    'documentation luneo',
    'tutoriels',
    'guide d\'utilisation',
    'API documentation',
    'intégration e-commerce',
    'support technique',
    'FAQ',
    'aide',
  ],
  noindex: false,
  ogType: 'website',
});

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
