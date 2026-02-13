import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Développeurs | Luneo',
  description: 'Documentation et ressources pour les développeurs Luneo',
  openGraph: {
    title: 'Développeurs | Luneo',
    description: 'Documentation et ressources pour les développeurs Luneo',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
