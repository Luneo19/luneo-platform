import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Luneo Playground - Testez notre personnalisateur en direct',
  description:
    'Testez le code Luneo en direct : Virtual Try-On, AR Export, Bulk Generation, Materials PBR. Exemples interactifs et production-ready.',
  openGraph: {
    title: 'Luneo Playground - Testez notre personnalisateur en direct',
    description:
      'Testez le code Luneo en direct : Virtual Try-On, AR Export, Bulk Generation. Exemples interactifs.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Luneo Playground - Testez notre personnalisateur en direct',
    description:
      'Testez le code Luneo en direct : Virtual Try-On, AR Export, Bulk Generation.',
  },
};

export default function PlaygroundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
