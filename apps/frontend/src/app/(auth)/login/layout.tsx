import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Connexion | Luneo',
  description: 'Connectez-vous à votre compte Luneo pour accéder à vos designs, produits personnalisés et outils de création.',
  openGraph: {
    title: 'Connexion | Luneo',
    description: 'Connectez-vous à votre compte Luneo pour accéder à vos designs, produits personnalisés et outils de création.',
    type: 'website',
    url: 'https://app.luneo.app/login',
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
