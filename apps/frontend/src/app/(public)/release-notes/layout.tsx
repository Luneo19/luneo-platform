import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Notes de version | Luneo',
  description: 'Historique détaillé des versions et nouveautés Luneo',
  openGraph: {
    title: 'Notes de version | Luneo',
    description: 'Historique détaillé des versions et nouveautés Luneo',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
