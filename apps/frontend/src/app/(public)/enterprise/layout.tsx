import type { Metadata } from 'next';
import { SEO_BASE_URL } from '@/lib/seo/constants';

export const metadata: Metadata = {
  title: 'Enterprise | Luneo - Solution Personnalisation Grandes Entreprises',
  description: 'Solution Enterprise Luneo : personnalisation produit à grande échelle, intégrations sur-mesure, SLA garanti, support dédié et déploiement on-premise.',
  keywords: ['enterprise', 'entreprise', 'grandes entreprises', 'personnalisation', 'sur-mesure', 'SLA', 'on-premise', 'Luneo'],
  openGraph: {
    title: 'Enterprise | Luneo',
    description: 'Solution Enterprise Luneo pour la personnalisation produit à grande échelle.',
    type: 'website',
    url: `${SEO_BASE_URL}/enterprise`,
    siteName: 'Luneo',
    images: [
      {
        url: `${SEO_BASE_URL}/og-enterprise.png`,
        width: 1200,
        height: 630,
        alt: 'Luneo Enterprise',
      },
    ],
  },
  alternates: {
    canonical: `${SEO_BASE_URL}/enterprise`,
    languages: {
      fr: `${SEO_BASE_URL}/enterprise`,
    },
  },
};

export default function EnterpriseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
