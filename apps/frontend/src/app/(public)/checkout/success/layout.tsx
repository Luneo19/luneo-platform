import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Commande confirmée | Luneo - Plateforme de personnalisation IA',
  description: 'Votre commande a été confirmée. Accédez à vos personnalisations et à votre espace Luneo.',
  robots: { index: false, follow: false },
  alternates: {
    languages: {
      fr: '/fr/checkout/success',
      en: '/en/checkout/success',
    },
  },
};

export default function CheckoutSuccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
