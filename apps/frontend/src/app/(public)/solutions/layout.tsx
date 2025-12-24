import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Solutions Luneo',
    default: 'Solutions de Personnalisation Produits',
  },
  description: 'Découvrez nos solutions de personnalisation produits : éditeur 2D, configurateur 3D, Virtual Try-On AR, AI Design Hub, et intégrations e-commerce.',
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Luneo Platform',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Luneo Solutions',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@luneo_app',
  },
};

export default function SolutionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}




















