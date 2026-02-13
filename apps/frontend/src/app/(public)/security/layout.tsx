import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { SEO_BASE_URL } from '@/lib/seo/constants';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Sécurité | Luneo',
  description:
    'Sécurité des données, conformité RGPD et bonnes pratiques. Infrastructure et politiques de sécurité Luneo.',
  keywords: ['sécurité', 'RGPD', 'données', 'conformité', 'infrastructure', 'Luneo'],
  canonicalUrl: `${SEO_BASE_URL}/security`,
  ogType: 'website',
  alternateLocales: [
    { locale: 'fr', url: `${SEO_BASE_URL}/security` },
    { locale: 'en', url: `${SEO_BASE_URL}/en/security` },
  ],
});

export default function SecurityLayout({ children }: { children: ReactNode }) {
  return children;
}
