import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Produit | Luneo',
  description: 'Découvrez les solutions de personnalisation produit Luneo',
  openGraph: {
    title: 'Produit | Luneo',
    description: 'Découvrez les solutions de personnalisation produit Luneo',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
