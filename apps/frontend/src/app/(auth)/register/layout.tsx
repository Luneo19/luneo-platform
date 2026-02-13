import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Inscription | Luneo',
  description: 'Inscrivez-vous gratuitement sur Luneo et commencez à créer des produits personnalisés avec notre plateforme de customisation IA.',
  openGraph: {
    title: 'Inscription | Luneo',
    description: 'Inscrivez-vous gratuitement sur Luneo et commencez à créer des produits personnalisés avec notre plateforme de customisation IA.',
    type: 'website',
    url: 'https://app.luneo.app/register',
    siteName: 'Luneo',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
