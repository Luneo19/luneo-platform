import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Politique de confidentialité - Luneo',
  description:
    'Politique de confidentialité Luneo. Collecte, utilisation et protection de vos données. Conformité nLPD/nDSG (Suisse), RGPD et ePrivacy.',
  openGraph: {
    title: 'Politique de confidentialité - Luneo',
    description: 'Comment Luneo collecte et protège vos données personnelles.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Politique de confidentialité - Luneo',
    description: 'Politique de confidentialité Luneo.',
  },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
