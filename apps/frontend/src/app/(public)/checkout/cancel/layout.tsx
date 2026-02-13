import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Paiement annulé | Luneo - Plateforme de personnalisation IA',
  description: 'Votre paiement a été annulé. Vous pouvez modifier votre panier et réessayer quand vous le souhaitez.',
  robots: { index: false, follow: false },
  alternates: {
    languages: {
      fr: '/fr/checkout/cancel',
      en: '/en/checkout/cancel',
    },
  },
};

export default function CheckoutCancelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
