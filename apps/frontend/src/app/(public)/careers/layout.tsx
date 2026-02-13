import type { Metadata } from 'next';
import { SEO_BASE_URL } from '@/lib/seo/constants';

export const metadata: Metadata = {
  title: 'Carrières | Luneo - Rejoignez Notre Équipe',
  description: 'Rejoignez Luneo et construisez le futur du commerce 3D/AR. Postes ouverts : Frontend, 3D, Product Design, Customer Success.',
  keywords: ['carrières', 'emploi', 'recrutement', 'Luneo', 'startup', '3D', 'e-commerce', 'Paris', 'Remote'],
  openGraph: {
    title: 'Carrières | Luneo - Rejoignez Notre Équipe',
    description: 'Rejoignez Luneo et construisez le futur du commerce 3D/AR.',
    type: 'website',
    url: `${SEO_BASE_URL}/careers`,
    siteName: 'Luneo',
  },
  alternates: {
    canonical: `${SEO_BASE_URL}/careers`,
  },
};

export default function CareersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
