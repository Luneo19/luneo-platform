import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Journal des modifications | Luneo',
  description: 'Historique des mises à jour et évolutions de la plateforme Luneo',
  openGraph: {
    title: 'Journal des modifications | Luneo',
    description: 'Historique des mises à jour et évolutions de la plateforme Luneo',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
