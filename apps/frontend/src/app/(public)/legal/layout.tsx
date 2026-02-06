/**
 * Legal Pages Layout
 * Provides SEO metadata for all legal pages
 */

import type { Metadata } from 'next';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Documents Légaux - Luneo',
  description: 'Consultez nos documents légaux : Politique de confidentialité, Conditions d\'utilisation, RGPD, Cookies et DPA.',
  keywords: [
    'politique de confidentialité',
    'conditions d\'utilisation',
    'RGPD',
    'cookies',
    'DPA',
    'luneo',
    'protection des données',
  ],
  noindex: false,
  ogType: 'website',
});

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
