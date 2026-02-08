import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Marketplace Luneo - Templates et designs professionnels',
  description:
    'Découvrez des templates et designs professionnels créés par notre communauté. T-shirts, logos, réseaux sociaux, packaging et plus.',
  openGraph: {
    title: 'Marketplace Luneo - Templates et designs professionnels',
    description:
      'Templates et designs professionnels pour personnalisation produit.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Marketplace Luneo - Templates et designs professionnels',
    description: 'Templates et designs professionnels pour personnalisation produit.',
  },
};

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
