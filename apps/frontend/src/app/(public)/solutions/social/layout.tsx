import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { SEO_BASE_URL } from '@/lib/seo/constants';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Social & Partenariats | Luneo',
  description:
    'Solutions de personnalisation pour campagnes sociales et partenariats. Co-branding et partage.',
  keywords: [
    'social',
    'partenariats',
    'co-branding',
    'partage',
    'campagnes',
    'personnalisation',
  ],
  canonicalUrl: `${SEO_BASE_URL}/solutions/social`,
  ogType: 'website',
});

export default function SocialLayout({ children }: { children: ReactNode }) {
  return children;
}
