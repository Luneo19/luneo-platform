import type { Metadata } from 'next';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `${id ? `${decodeURIComponent(id.replace(/-/g, ' '))} - ` : ''}Article - Luneo Blog`,
    description: 'Lisez cet article sur le blog Luneo.',
    openGraph: {
      title: 'Article - Luneo Blog',
      description: 'Lisez cet article sur le blog Luneo.',
    },
  };
}

export default function BlogArticleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
