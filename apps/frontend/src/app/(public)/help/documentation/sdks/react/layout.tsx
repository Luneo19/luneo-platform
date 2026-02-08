import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SDK React - Documentation Luneo',
  description:
    'Intégrez le personnalisateur Luneo dans votre app React. ProductCustomizer, ProductConfigurator3D et exemples de code.',
  openGraph: {
    title: 'SDK React - Documentation Luneo',
    description: 'SDK React pour Luneo : customizer et configurateur 3D.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SDK React - Documentation Luneo',
    description: 'SDK React Luneo.',
  },
};

export default function ReactSDKLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
