import type { Metadata } from 'next';
import { generateBreadcrumbSchema, generateProductSchema } from '@/lib/seo/structured-data';
import { SEO_BASE_URL } from '@/lib/seo/constants';

const integrationsBreadcrumbJsonLd = generateBreadcrumbSchema([
  { name: 'Home', url: SEO_BASE_URL },
  { name: 'Intégrations', url: `${SEO_BASE_URL}/integrations` },
]);
const softwareApplicationJsonLd = generateProductSchema(
  'Luneo Integrations',
  'Connectez Luneo à votre boutique : Shopify, WooCommerce, PrestaShop, Stripe, Printful, Zapier, Make. Intégration native en quelques minutes.'
);

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
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(integrationsBreadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationJsonLd) }}
      />
      {children}
    </>
  );
}
