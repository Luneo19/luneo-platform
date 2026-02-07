import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { SEO_BASE_URL } from '@/lib/seo/constants';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Réseaux Sociaux & Partage | Luneo',
  description:
    'Partagez les créations sur les réseaux, UGC et campagnes sociales. QR codes et liens de personnalisation.',
  keywords: [
    'réseaux sociaux',
    'partage',
    'UGC',
    'QR code',
    'social media',
    'personnalisation',
  ],
  canonicalUrl: `${SEO_BASE_URL}/solutions/social-media`,
  ogType: 'website',
});

export default function SocialMediaLayout({ children }: { children: ReactNode }) {
  return children;
}
