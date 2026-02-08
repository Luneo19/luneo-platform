import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Référence API - Documentation Luneo',
  description:
    'Référence complète de l\'API Luneo : authentification, endpoints, designs, commandes, webhooks et limites.',
  openGraph: {
    title: 'Référence API - Documentation Luneo',
    description: 'Référence API Luneo : endpoints et intégration.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Référence API - Documentation Luneo',
    description: 'Référence API Luneo.',
  },
};

export default function APIReferenceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
