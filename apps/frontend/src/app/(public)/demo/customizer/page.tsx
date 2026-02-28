import Link from 'next/link';

export default function DemoCustomizerPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="rounded-2xl border border-white/10 bg-black/20 p-8">
        <h1 className="text-2xl font-semibold text-white">Demo customizer</h1>
        <p className="mt-3 text-white/80">
          Le demo customizer public est en cours de mise a jour. Vous pouvez demander une demonstration guidee.
        </p>
        <div className="mt-6 flex gap-3">
          <Link href="/contact?source=demo-customizer" className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black">
            Demander une demo
          </Link>
          <Link href="/pricing" className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white">
            Voir les plans
          </Link>
        </div>
      </div>
    </main>
  );
}
