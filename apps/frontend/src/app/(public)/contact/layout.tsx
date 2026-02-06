import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact | Luneo - Support & Équipe Commerciale',
  description: 'Contactez l\'équipe Luneo pour toute question, demande de démo ou support technique. Nous sommes là pour vous aider.',
  keywords: ['contact', 'support', 'aide', 'démo', 'commercial', 'Luneo'],
  openGraph: {
    title: 'Contact | Luneo',
    description: 'Contactez l\'équipe Luneo pour toute question, demande de démo ou support technique.',
    type: 'website',
    url: 'https://luneo.app/contact',
    siteName: 'Luneo',
  },
  alternates: {
    canonical: 'https://luneo.app/contact',
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
