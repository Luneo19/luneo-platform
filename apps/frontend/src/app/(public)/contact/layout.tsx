import type { Metadata } from 'next';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://luneo.app';

export const metadata: Metadata = {
  title: 'Contact | Luneo - Support & Équipe Commerciale',
  description:
    "Contactez l'équipe Luneo pour déployer vos agents IA, demander une démo ou échanger sur votre stratégie support et opérations.",
  keywords: ['contact', 'support', 'agents IA', 'démo', 'commercial', 'Luneo'],
  openGraph: {
    title: 'Contact | Luneo',
    description: "Contactez l'équipe Luneo pour vos projets d'agents IA, votre support technique ou votre plan Enterprise.",
    type: 'website',
    url: `${APP_URL}/contact`,
    siteName: 'Luneo',
  },
  alternates: {
    canonical: `${APP_URL}/contact`,
    languages: {
      fr: `${APP_URL}/contact`,
      en: `${APP_URL}/en/contact`,
    },
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
