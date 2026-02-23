import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Inscription | Luneo',
  description: 'Inscrivez-vous gratuitement sur Luneo et déployez vos agents IA pour automatiser votre service client.',
  openGraph: {
    title: 'Inscription | Luneo',
    description: 'Inscrivez-vous gratuitement sur Luneo et déployez vos agents IA pour automatiser votre service client.',
    type: 'website',
    url: 'https://luneo.app/register',
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
