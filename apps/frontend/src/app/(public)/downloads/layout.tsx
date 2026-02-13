import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Téléchargements | Luneo',
  description: 'Téléchargez nos outils et ressources : CLI, plugins, press kit',
  openGraph: {
    title: 'Téléchargements | Luneo',
    description: 'Téléchargez nos outils et ressources : CLI, plugins, press kit',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
