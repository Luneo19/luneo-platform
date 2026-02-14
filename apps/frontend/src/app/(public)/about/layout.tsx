import type { Metadata } from 'next';
import { SEO_BASE_URL } from '@/lib/seo/constants';
import { getOrganizationSchema } from '@/lib/seo/metadata';

export const metadata: Metadata = {
  title: 'À propos | Luneo - Notre Mission & Équipe',
  description: 'Découvrez l\'histoire de Luneo, notre mission de démocratiser la personnalisation produit et l\'équipe qui rend cela possible.',
  keywords: ['à propos', 'about', 'mission', 'équipe', 'startup', 'Luneo', 'personnalisation'],
  openGraph: {
    title: 'À propos | Luneo',
    description: 'Découvrez l\'histoire de Luneo et notre mission de démocratiser la personnalisation produit.',
    type: 'website',
    url: `${SEO_BASE_URL}/about`,
    siteName: 'Luneo',
  },
  alternates: {
    canonical: `${SEO_BASE_URL}/about`,
    languages: {
      fr: `${SEO_BASE_URL}/about`,
      en: `${SEO_BASE_URL}/en/about`,
    },
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const organizationSchema = getOrganizationSchema();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: typeof organizationSchema === 'string' ? organizationSchema : JSON.stringify(organizationSchema),
        }}
      />
      {children}
    </>
  );
}
