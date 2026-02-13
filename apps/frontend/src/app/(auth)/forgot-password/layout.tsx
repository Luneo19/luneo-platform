import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mot de passe oublié | Luneo',
  description: 'Réinitialisez votre mot de passe Luneo. Entrez votre email pour recevoir un lien de réinitialisation.',
  openGraph: {
    title: 'Mot de passe oublié | Luneo',
    description: 'Réinitialisez votre mot de passe Luneo.',
    type: 'website',
    siteName: 'Luneo',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mot de passe oublié | Luneo',
    description: 'Réinitialisez votre mot de passe Luneo.',
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
