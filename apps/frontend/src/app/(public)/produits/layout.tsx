import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Produits | Solutions de Personnalisation Luneo',
  description: 'Découvrez toutes nos solutions de personnalisation produits : Visual Customizer, Configurator 3D, Virtual Try-On AR, AI Design Hub, et plus encore.',
  keywords: [
    'personnalisation produits',
    'customizer 2D',
    'configurateur 3D',
    'virtual try-on',
    'ai design',
    'print-ready',
  ],
  openGraph: {
    title: 'Produits | Solutions Luneo',
    description: 'Découvrez toutes nos solutions de personnalisation produits : Visual Customizer, Configurator 3D, Virtual Try-On AR, AI Design Hub.',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Luneo Products',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Produits | Solutions Luneo',
    description: 'Découvrez toutes nos solutions de personnalisation produits.',
  },
};

export default function ProduitsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}




















