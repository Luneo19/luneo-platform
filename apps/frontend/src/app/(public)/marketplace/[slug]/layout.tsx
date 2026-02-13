import type { Metadata } from 'next';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const title = slug ? `${decodeURIComponent(slug)} | Marketplace Luneo` : 'Marketplace Luneo';
  const description = 'Découvrez ce design sur le marketplace Luneo. Templates et personnalisation produit par IA.';
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'Luneo',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default function MarketplaceSlugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
