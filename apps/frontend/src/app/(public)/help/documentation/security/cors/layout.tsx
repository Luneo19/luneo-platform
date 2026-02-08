import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sécurité CORS - Documentation Luneo',
  description:
    'Configuration CORS pour l\'API Luneo : domaines autorisés, en-têtes et bonnes pratiques de sécurité.',
  openGraph: {
    title: 'Sécurité CORS - Documentation Luneo',
    description: 'Configuration CORS pour l\'API Luneo.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sécurité CORS - Documentation Luneo',
    description: 'Sécurité CORS Luneo.',
  },
};

export default function SecurityCorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
