import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ressources | Luneo',
  description: 'Documentation et ressources Luneo',
  openGraph: {
    title: 'Ressources | Luneo',
    description: 'Documentation et ressources Luneo',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
