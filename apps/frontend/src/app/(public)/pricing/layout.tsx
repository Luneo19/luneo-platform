import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tarifs & Plans | Luneo - Personnalisation Produit',
  description: 'Découvrez nos plans tarifaires flexibles. De Starter à Enterprise, trouvez la solution adaptée à vos besoins de personnalisation produit avec IA.',
  keywords: ['tarifs', 'pricing', 'plans', 'personnalisation', 'IA', 'SaaS', 'e-commerce'],
  openGraph: {
    title: 'Tarifs & Plans | Luneo',
    description: 'Découvrez nos plans tarifaires flexibles. De Starter à Enterprise, trouvez la solution adaptée à vos besoins.',
    type: 'website',
    url: 'https://luneo.app/pricing',
    siteName: 'Luneo',
    images: [
      {
        url: 'https://luneo.app/og-pricing.png',
        width: 1200,
        height: 630,
        alt: 'Luneo Pricing Plans',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tarifs & Plans | Luneo',
    description: 'Découvrez nos plans tarifaires flexibles pour la personnalisation produit avec IA.',
  },
  alternates: {
    canonical: 'https://luneo.app/pricing',
    languages: {
      'fr': 'https://luneo.app/tarifs',
      'en': 'https://luneo.app/pricing',
    },
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
