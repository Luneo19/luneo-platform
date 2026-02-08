import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Configuration - Documentation Luneo',
  description:
    'Configuration initiale de Luneo : compte, clé API, variables d\'environnement et déploiement.',
  openGraph: {
    title: 'Configuration - Documentation Luneo',
    description: 'Configuration initiale Luneo.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Configuration - Documentation Luneo',
    description: 'Configuration Luneo.',
  },
};

export default function ConfigSetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
