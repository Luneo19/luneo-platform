import Link from 'next/link';

interface MissingDocsPageProps {
  params: Promise<{ slug?: string[] }>;
}

export default async function MissingDocsPage({ params }: MissingDocsPageProps) {
  const { slug = [] } = await params;
  const missingPath = `/help/documentation/${slug.join('/')}`;

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="rounded-2xl border border-white/10 bg-black/20 p-8">
        <h1 className="text-2xl font-semibold text-white">Documentation en cours de publication</h1>
        <p className="mt-3 text-white/80">
          Cette section n&apos;est pas encore disponible. Le lien existe deja dans l&apos;application pour preparer la navigation complete.
        </p>
        <p className="mt-2 text-sm text-white/70">Chemin: {missingPath}</p>
        <div className="mt-6 flex gap-3">
          <Link href="/help/documentation" className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black">
            Retour a la documentation
          </Link>
          <Link href="/contact" className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white">
            Contacter le support
          </Link>
        </div>
      </div>
    </main>
  );
}
