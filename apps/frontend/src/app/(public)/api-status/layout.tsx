import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Statut API | Luneo',
  description: 'Vérifiez le statut en temps réel des services Luneo',
  openGraph: {
    title: 'Statut API | Luneo',
    description: 'Vérifiez le statut en temps réel des services Luneo',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
