import type { Metadata } from 'next';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://luneo.app';

export const metadata: Metadata = {
  title: 'Demander une Démo | Luneo - Personnalisation Produit',
  description: 'Planifiez une démonstration personnalisée de Luneo avec notre équipe. Découvrez comment transformer votre e-commerce avec la personnalisation IA.',
  keywords: ['démo', 'demo', 'démonstration', 'essai', 'personnalisation', 'e-commerce', 'Luneo'],
  openGraph: {
    title: 'Demander une Démo | Luneo',
    description: 'Planifiez une démonstration personnalisée de Luneo avec notre équipe.',
    type: 'website',
    url: `${APP_URL}/demo`,
    siteName: 'Luneo',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: `${APP_URL}/demo`,
  },
};

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
