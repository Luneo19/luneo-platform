import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Checkout | Luneo - Plateforme de personnalisation IA',
  description:
    'Finalisez votre commande et accédez à la personnalisation IA avancée avec Luneo.',
  robots: { index: false, follow: false },
  alternates: {
    languages: {
      fr: '/fr/checkout',
      en: '/en/checkout',
    },
  },
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
