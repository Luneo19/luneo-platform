import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation (CGU) - Luneo",
  description:
    "Conditions générales d'utilisation de la plateforme Luneo. SaaS de personnalisation produit, droit suisse, RGPD.",
  openGraph: {
    title: "Conditions générales d'utilisation (CGU) - Luneo",
    description: "CGU de la plateforme Luneo. Personnalisation 2D/3D, try-on, IA, e-commerce.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Conditions générales d'utilisation (CGU) - Luneo",
    description: "Conditions générales d'utilisation de la plateforme Luneo.",
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
