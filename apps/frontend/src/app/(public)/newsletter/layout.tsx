import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { SEO_BASE_URL } from '@/lib/seo/constants';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Newsletter | Luneo',
  description:
    'Inscrivez-vous à la newsletter Luneo. Actualités, conseils personnalisation et offres réservées aux abonnés.',
  keywords: ['newsletter', 'inscription', 'actualités', 'Luneo', 'personnalisation'],
  canonicalUrl: `${SEO_BASE_URL}/newsletter`,
  ogType: 'website',
});

export default function NewsletterLayout({ children }: { children: ReactNode }) {
  return children;
}
