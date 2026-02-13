import type { Metadata } from 'next';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://luneo.app';

export const metadata: Metadata = {
  title: 'Contact | Luneo - Support & Équipe Commerciale',
  description: 'Contactez l\'équipe Luneo pour toute question, demande de démo ou support technique. Nous sommes là pour vous aider.',
  keywords: ['contact', 'support', 'aide', 'démo', 'commercial', 'Luneo'],
  openGraph: {
    title: 'Contact | Luneo',
    description: 'Contactez l\'équipe Luneo pour toute question, demande de démo ou support technique.',
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
