import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Connexion | Luneo',
  description: 'Connectez-vous à votre compte Luneo pour gérer vos agents IA, conversations et automatisations.',
  openGraph: {
    title: 'Connexion | Luneo',
    description: 'Connectez-vous à votre compte Luneo pour gérer vos agents IA, conversations et automatisations.',
    type: 'website',
    url: 'https://luneo.app/login',
    siteName: 'Luneo',
  },
  robots: {
    index: false, // Login pages should not be indexed
    follow: true,
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
