import type { Metadata } from 'next';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Intégrations Luneo - Shopify, WooCommerce, PrestaShop',
  description:
    'Connectez Luneo à votre boutique : Shopify, WooCommerce, PrestaShop, Stripe, Printful, Zapier, Make. Intégration native en quelques minutes.',
  openGraph: {
    title: 'Intégrations Luneo - Shopify, WooCommerce, PrestaShop',
    description:
      'Connectez Luneo à votre e-commerce et outils : Shopify, WooCommerce, Stripe, Printful.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Intégrations Luneo - Shopify, WooCommerce, PrestaShop',
    description: 'Connectez Luneo à votre boutique en ligne.',
  },
};

const INTEGRATIONS = [
  { name: 'Shopify', href: '/integrations/shopify', description: 'Intégration native complète' },
  { name: 'WooCommerce', href: '/integrations/woocommerce', description: 'Plugin WordPress officiel' },
  { name: 'Stripe', href: '/integrations/stripe', description: 'Paiements et abonnements' },
  { name: 'Printful', href: '/integrations/printful', description: 'Print on demand' },
  { name: 'Zapier', href: '/integrations/zapier', description: 'Automatisations' },
  { name: 'Make', href: '/integrations/make', description: 'Scénarios visuels' },
];

export default function IntegrationsPage() {
  return (
    <div className="min-h-screen bg-gray-900 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-4">Intégrations Luneo</h1>
        <p className="text-xl text-gray-400 mb-12">
          Shopify, WooCommerce, PrestaShop, Stripe, Printful et plus. Connectez votre boutique en quelques minutes.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {INTEGRATIONS.map((int) => (
            <Link key={int.name} href={int.href}>
              <Card className="p-6 bg-gray-800/50 border-gray-700 hover:border-emerald-500/50 transition-colors">
                <h2 className="text-lg font-semibold text-white mb-2">{int.name}</h2>
                <p className="text-sm text-gray-400 mb-4">{int.description}</p>
                <Button variant="ghost" size="sm" className="text-emerald-400 p-0 h-auto">
                  Voir l&apos;intégration <ArrowRight className="ml-1 w-4 h-4" />
                </Button>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
