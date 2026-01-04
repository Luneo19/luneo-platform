import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Intégrations E-commerce | Shopify, WooCommerce, Stripe',
  description: 'Connectez Luneo à votre stack e-commerce : Shopify, WooCommerce, Stripe, Printful, Zapier, Make. Synchronisation automatique des produits et commandes.',
  keywords: [
    'intégration shopify',
    'woocommerce personnalisation',
    'stripe paiement',
    'printful print on demand',
    'zapier automation',
    'make integration',
  ],
  openGraph: {
    title: 'Intégrations E-commerce | Luneo',
    description: 'Connectez Luneo à votre stack e-commerce : Shopify, WooCommerce, Stripe, Printful, Zapier, Make.',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Luneo Integrations',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Intégrations E-commerce | Luneo',
    description: 'Connectez Luneo à votre stack e-commerce : Shopify, WooCommerce, Stripe, Printful.',
  },
};

export default function IntegrationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}





























