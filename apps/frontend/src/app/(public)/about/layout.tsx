import type { Metadata } from 'next';
import { SEO_BASE_URL } from '@/lib/seo/constants';
import { getOrganizationSchema } from '@/lib/seo/metadata';

export const metadata: Metadata = {
  title: 'À propos | Luneo - Notre Mission & Équipe',
  description:
    "Découvrez l'histoire de Luneo et notre mission : aider les entreprises à déployer des agents IA fiables pour le support, les ventes et les opérations.",
  keywords: ['à propos', 'about', 'mission', 'équipe', 'startup', 'Luneo', 'agents IA', 'support client'],
  openGraph: {
    title: 'À propos | Luneo',
    description: "Découvrez l'histoire de Luneo et notre mission autour des agents IA orientés ROI.",
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
