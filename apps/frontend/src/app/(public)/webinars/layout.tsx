import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Webinaires | Luneo',
  description: 'Formations gratuites en direct avec les experts Luneo',
  openGraph: {
    title: 'Webinaires | Luneo',
    description: 'Formations gratuites en direct avec les experts Luneo',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
