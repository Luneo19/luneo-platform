import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Calculateur ROI | Luneo',
  description: 'Estimez votre retour sur investissement avec Luneo',
  openGraph: {
    title: 'Calculateur ROI | Luneo',
    description: 'Estimez votre retour sur investissement avec Luneo',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
