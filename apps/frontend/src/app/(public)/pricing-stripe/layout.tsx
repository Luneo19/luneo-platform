import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tarifs | Luneo',
  description: 'Découvrez les offres et tarifs Luneo pour la personnalisation produit',
  openGraph: {
    title: 'Tarifs | Luneo',
    description: 'Découvrez les offres et tarifs Luneo pour la personnalisation produit',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
