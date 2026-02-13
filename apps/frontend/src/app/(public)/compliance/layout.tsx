import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Conformité | Luneo',
  description: 'Certifications et conformité Luneo : RGPD, ISO 27001, SOC 2',
  openGraph: {
    title: 'Conformité | Luneo',
    description: 'Certifications et conformité Luneo : RGPD, ISO 27001, SOC 2',
    type: 'website',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
