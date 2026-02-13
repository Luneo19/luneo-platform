import type { Metadata } from 'next';
import { SEO_BASE_URL } from '@/lib/seo/constants';

export const metadata: Metadata = {
  title: 'Marketplace Luneo - Templates et designs professionnels',
  description:
    'Découvrez des templates et designs professionnels créés par notre communauté. T-shirts, logos, réseaux sociaux, packaging et plus.',
  openGraph: {
    title: 'Marketplace Luneo - Templates et designs professionnels',
    description:
      'Templates et designs professionnels pour personnalisation produit.',
    type: 'website',
    url: `${SEO_BASE_URL}/marketplace`,
    siteName: 'Luneo',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Marketplace Luneo - Templates et designs professionnels',
    description: 'Templates et designs professionnels pour personnalisation produit.',
  },
  alternates: {
    canonical: `${SEO_BASE_URL}/marketplace`,
    languages: {
      fr: `${SEO_BASE_URL}/marketplace`,
      en: `${SEO_BASE_URL}/en/marketplace`,
    },
  },
};

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
