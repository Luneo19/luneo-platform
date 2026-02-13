import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politique de confidentialité | Luneo',
  description: 'Politique de confidentialité et protection des données Luneo',
  openGraph: {
    title: 'Politique de confidentialité | Luneo',
    description: 'Politique de confidentialité et protection des données Luneo',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
