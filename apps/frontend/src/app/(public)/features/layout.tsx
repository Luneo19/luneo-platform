import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fonctionnalités | Luneo - Plateforme de Personnalisation IA',
  description: 'Découvrez toutes les fonctionnalités de Luneo : éditeur 2D, configurateur 3D, essayage virtuel AR, génération IA, et plus encore.',
  keywords: ['fonctionnalités', 'features', 'personnalisation', 'éditeur 2D', 'configurateur 3D', 'AR', 'IA', 'DALL-E'],
  openGraph: {
    title: 'Fonctionnalités | Luneo',
    description: 'Éditeur 2D, configurateur 3D, essayage virtuel AR, génération IA - tout pour personnaliser vos produits.',
    type: 'website',
    url: 'https://luneo.app/features',
    siteName: 'Luneo',
    images: [
      {
        url: 'https://luneo.app/og-features.png',
        width: 1200,
        height: 630,
        alt: 'Luneo Features',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fonctionnalités | Luneo',
    description: 'Découvrez toutes les fonctionnalités de Luneo pour la personnalisation produit.',
  },
  alternates: {
    canonical: 'https://luneo.app/features',
  },
};

export default function FeaturesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
