import type { Metadata } from 'next';
import { SEO_BASE_URL } from '@/lib/seo/constants';

export const metadata: Metadata = {
  title: 'Carrières | Luneo - Rejoignez Notre Équipe',
  description:
    'Rejoignez Luneo et construisez la nouvelle génération d’agents IA pour le support, les ventes et les opérations client.',
  keywords: ['carrières', 'emploi', 'recrutement', 'Luneo', 'startup', 'agents IA', 'SaaS', 'support client', 'remote'],
  openGraph: {
    title: 'Carrières | Luneo - Rejoignez Notre Équipe',
    description: 'Rejoignez Luneo et construisez la nouvelle génération d’agents IA pour les entreprises.',
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
