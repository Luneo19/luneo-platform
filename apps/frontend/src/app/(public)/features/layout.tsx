import type { Metadata } from 'next';
import { SEO_BASE_URL } from '@/lib/seo/constants';

export const metadata: Metadata = {
  title: 'Fonctionnalités | Luneo - Agents IA pour le Service Client',
  description:
    'Découvrez les fonctionnalités de Luneo : agents conversationnels IA, base de connaissances, analytics, multi-canal, multi-modèles et sécurité RGPD.',
  keywords: [
    'agents IA',
    'chatbot IA',
    'service client automatisé',
    'base de connaissances',
    'analytics',
    'multi-canal',
    'GPT-4',
    'Claude',
    'RGPD',
  ],
  openGraph: {
    title: 'Fonctionnalités | Luneo - Agents IA',
    description:
      'Agents conversationnels, base de connaissances, analytics temps réel, multi-canal — tout pour automatiser votre support client.',
    type: 'website',
    url: `${SEO_BASE_URL}/features`,
    siteName: 'Luneo',
    images: [
      {
        url: `${SEO_BASE_URL}/og-features.png`,
        width: 1200,
        height: 630,
        alt: 'Luneo - Fonctionnalités Agents IA',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fonctionnalités | Luneo - Agents IA',
    description:
      'Découvrez toutes les fonctionnalités de Luneo pour déployer des agents IA sur vos canaux de support.',
  },
  alternates: {
    canonical: `${SEO_BASE_URL}/features`,
    languages: {
      fr: `${SEO_BASE_URL}/features`,
    },
  },
};

export default function FeaturesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
