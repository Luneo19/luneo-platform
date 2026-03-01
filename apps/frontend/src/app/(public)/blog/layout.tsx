import type { Metadata } from 'next';
import { SEO_BASE_URL } from '@/lib/seo/constants';

export const metadata: Metadata = {
  title: 'Blog - Luneo | Actualités et tutoriels',
  description:
    'Découvrez nos articles, tutoriels et actualités sur la personnalisation de produits et le design IA.',
  openGraph: {
    title: 'Blog - Luneo',
    description: 'Articles, tutoriels et actualités sur la personnalisation IA.',
    url: `${SEO_BASE_URL}/blog`,
    siteName: 'Luneo',
  },
  alternates: {
    canonical: `${SEO_BASE_URL}/blog`,
    languages: {
      fr: `${SEO_BASE_URL}/blog`,
    },
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
