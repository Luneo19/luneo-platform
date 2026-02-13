import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Documentation API | Luneo',
  description:
    "Documentation complète de l'API Luneo pour les développeurs",
  openGraph: {
    title: 'Documentation API | Luneo',
    description: "Documentation complète de l'API Luneo pour les développeurs",
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
