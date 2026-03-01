import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { SEO_BASE_URL } from '@/lib/seo/constants';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Programme de parrainage | Luneo',
  description:
    'Parrainez des clients et gagnez des crédits Luneo. Programme de parrainage simple et récompensant.',
  keywords: ['parrainage', 'referral', 'crédits', 'programme', 'Luneo'],
  canonicalUrl: `${SEO_BASE_URL}/referral`,
  ogType: 'website',
  alternateLocales: [
    { locale: 'fr', url: `${SEO_BASE_URL}/referral` },
  ],
});

export default function ReferralLayout({ children }: { children: ReactNode }) {
  return children;
}
