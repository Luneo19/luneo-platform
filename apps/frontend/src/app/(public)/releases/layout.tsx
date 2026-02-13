import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Versions | Luneo',
  description: 'Versions et mises à jour de la plateforme Luneo',
  openGraph: {
    title: 'Versions | Luneo',
    description: 'Versions et mises à jour de la plateforme Luneo',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
