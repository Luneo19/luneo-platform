import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Luneo - Génération en masse de designs personnalisés',
  description:
    'Générez 1000+ designs/heure avec BullMQ et 10 workers. Architecture, code et performance réelle pour la génération massive.',
  openGraph: {
    title: 'Luneo - Génération en masse de designs personnalisés',
    description:
      'Générez 1000+ designs/heure avec BullMQ. Architecture et code production-ready.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Luneo - Génération en masse de designs personnalisés',
    description: 'Générez 1000+ designs/heure avec BullMQ et 10 workers.',
  },
};

export default function BulkGenerationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
