import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { SEO_BASE_URL } from '@/lib/seo/constants';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Branding & Design System | Luneo',
  description:
    'Créez et maintenez votre design system cohérent sur tous les supports. Brand colors, typography, templates brandés et asset library centralisée.',
  keywords: ['branding', 'design system', 'identité de marque', 'templates', 'personnalisation', 'Luneo'],
  canonicalUrl: `${SEO_BASE_URL}/use-cases/branding`,
  ogType: 'website',
});

export default function BrandingUseCaseLayout({ children }: { children: ReactNode }) {
  return children;
}
