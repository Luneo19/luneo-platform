import type { Metadata } from 'next';

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

export default function IntegrationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
