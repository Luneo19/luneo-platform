import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { SEO_BASE_URL } from '@/lib/seo/constants';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Marketing & Campagnes | Luneo',
  description:
    'Outils marketing pour campagnes de personnalisation : UGC, landing pages, lead gen et analytics.',
  keywords: [
    'marketing',
    'campagnes',
    'personnalisation',
    'UGC',
    'lead generation',
    'analytics',
  ],
  canonicalUrl: `${SEO_BASE_URL}/solutions/marketing`,
  ogType: 'website',
});

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return children;
}
