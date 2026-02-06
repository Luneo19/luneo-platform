import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'À propos | Luneo - Notre Mission & Équipe',
  description: 'Découvrez l\'histoire de Luneo, notre mission de démocratiser la personnalisation produit et l\'équipe qui rend cela possible.',
  keywords: ['à propos', 'about', 'mission', 'équipe', 'startup', 'Luneo', 'personnalisation'],
  openGraph: {
    title: 'À propos | Luneo',
    description: 'Découvrez l\'histoire de Luneo et notre mission de démocratiser la personnalisation produit.',
    type: 'website',
    url: 'https://luneo.app/about',
    siteName: 'Luneo',
  },
  alternates: {
    canonical: 'https://luneo.app/about',
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
