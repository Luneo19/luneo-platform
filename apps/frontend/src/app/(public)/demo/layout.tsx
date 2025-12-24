import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Démo Luneo',
    default: 'Démos Interactives | Luneo',
  },
  description: 'Testez nos solutions de personnalisation produits en direct : éditeur 2D, configurateur 3D, Virtual Try-On AR, AI Design Hub. Aucune inscription requise.',
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Luneo Platform',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Luneo Demos',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@luneo_app',
  },
};

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}




















