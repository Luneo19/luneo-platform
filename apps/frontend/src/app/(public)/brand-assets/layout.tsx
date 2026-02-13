import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ressources de marque | Luneo',
  description: 'Logo, couleurs et ressources graphiques Luneo',
  openGraph: {
    title: 'Ressources de marque | Luneo',
    description: 'Logo, couleurs et ressources graphiques Luneo',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
