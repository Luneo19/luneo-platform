import type { Metadata } from 'next';
import { SEO_BASE_URL } from '@/lib/seo/constants';

export const metadata: Metadata = {
  title: 'Brand Guidelines | Luneo - Logos, Couleurs & Ressources',
  description: 'Logos, couleurs et typographie Luneo. Identité visuelle et ressources de marque.',
  keywords: ['brand', 'guidelines', 'logo', 'couleurs', 'typographie', 'Luneo', 'identité visuelle'],
  openGraph: {
    title: 'Brand Guidelines | Luneo',
    description: 'Logos, couleurs et typographie Luneo. Identité visuelle et ressources de marque.',
    type: 'website',
    url: `${SEO_BASE_URL}/brand`,
    siteName: 'Luneo',
  },
  alternates: {
    canonical: `${SEO_BASE_URL}/brand`,
  },
};

export default function BrandLayout({ children }: { children: React.ReactNode }) {
  return children;
}
