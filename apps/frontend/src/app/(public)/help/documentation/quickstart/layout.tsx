import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Guide de démarrage rapide - Documentation Luneo',
  description:
    'Démarrez avec Luneo : installation, première configuration et premier customizer en quelques minutes.',
  openGraph: {
    title: 'Guide de démarrage rapide - Documentation Luneo',
    description: 'Démarrez avec Luneo en quelques minutes.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Guide de démarrage rapide - Documentation Luneo',
    description: 'Démarrage rapide Luneo.',
  },
};

export default function QuickstartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
