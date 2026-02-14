import { generateMetadata as generateSEOMetadata } from '@/lib/seo/metadata';
import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { SEO_BASE_URL } from '@/lib/seo/constants';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Intégration Stripe | Luneo',
  description:
    'Paiements et abonnements Stripe avec Luneo. Sécurisez les commandes personnalisées, webhooks temps réel et gestion des abonnements.',
  keywords: [
    'Stripe',
    'paiement',
    'abonnement',
    'webhooks',
    'personnalisation',
    'Luneo',
    'e-commerce',
  ],
  canonicalUrl: `${SEO_BASE_URL}/integrations/stripe`,
  ogType: 'website',
});

export default function StripeLayout({ children }: { children: ReactNode }) {
  return children;
}
