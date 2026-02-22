import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const CATEGORY_COLORS: Record<string, string> = {
  SUPPORT: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  SALES: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  ONBOARDING: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  REVIEWS: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  CONTENT: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  ANALYTICS: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  EMAIL: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  CUSTOM: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30',
};

type Template = {
  id: string;
  slug: string;
  name: string;
  description: string;
  longDescription?: string | null;
  metaDescription?: string | null;
  category: string;
  icon: string;
  color?: string;
  capabilities?: string[];
  suggestedQuestions?: string[];
  requiredSources?: string[];
  defaultModel?: string;
  defaultTemperature?: number;
  usageCount?: number;
  avgRating?: number | null;
};

async function getTemplate(slug: string): Promise<Template | null> {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const res = await fetch(`${backendUrl}/api/v1/agent-templates/${slug}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.data ?? data ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const template = await getTemplate(slug);
  if (!template) return { title: 'Template non trouvé' };

  const description =
    template.metaDescription ?? template.longDescription ?? template.description;

  return {
    title: `${template.name} - Agent IA | Luneo`,
    description: description ?? template.description,
    openGraph: {
      title: `${template.name} - Agent IA | Luneo`,
      description: description ?? template.description,
    },
  };
}

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const template = await getTemplate(slug);
  if (!template) notFound();

  const categoryColor =
    CATEGORY_COLORS[template.category] ??
    'bg-zinc-500/20 text-zinc-300 border-zinc-500/30';

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Back link */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Link
          href="/templates"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
        >
          ← Retour aux templates
        </Link>
      </div>

      {/* Hero */}
      <section className="relative py-12 sm:py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/30 via-indigo-950/20 to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <span
              className="text-5xl sm:text-6xl flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center rounded-2xl bg-white/[0.06] border border-white/[0.06]"
              aria-hidden
            >
              {template.icon || '🤖'}
            </span>
            <div>
              <span
                className={`inline-block px-3 py-1 rounded-lg text-sm font-medium border mb-3 ${categoryColor}`}
              >
                {template.category}
              </span>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">{template.name}</h1>
              <p className="text-lg text-white/70">
                {template.longDescription ?? template.description}
              </p>
              <div className="flex items-center gap-4 mt-4 text-sm text-white/50">
                {typeof template.usageCount === 'number' && (
                  <span>{template.usageCount.toLocaleString('fr-FR')} utilisations</span>
                )}
                {typeof template.avgRating === 'number' && (
                  <span>★ {template.avgRating.toFixed(1)}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 space-y-12">
        {/* Capacités */}
        {Array.isArray(template.capabilities) && template.capabilities.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">Capacités</h2>
            <ul className="space-y-2">
              {template.capabilities.map((cap, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 text-white/80 pl-4 border-l-2 border-violet-500/40"
                >
                  {cap}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Questions suggérées */}
        {Array.isArray(template.suggestedQuestions) &&
          template.suggestedQuestions.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">Questions suggérées</h2>
              <div className="space-y-3">
                {template.suggestedQuestions.map((q, i) => (
                  <div
                    key={i}
                    className="rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-3 text-white/80 max-w-md"
                  >
                    &ldquo;{q}&rdquo;
                  </div>
                ))}
              </div>
            </section>
          )}

        {/* Sources requises */}
        {Array.isArray(template.requiredSources) && template.requiredSources.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">Sources requises</h2>
            <ul className="flex flex-wrap gap-2">
              {template.requiredSources.map((src, i) => (
                <li
                  key={i}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.06] text-white/70 text-sm"
                >
                  {src}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Configuration */}
        {(template.defaultModel || typeof template.defaultTemperature === 'number') && (
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">Configuration par défaut</h2>
            <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-4 space-y-2">
              {template.defaultModel && (
                <p className="text-white/80">
                  <span className="text-white/50">Modèle :</span> {template.defaultModel}
                </p>
              )}
              {typeof template.defaultTemperature === 'number' && (
                <p className="text-white/80">
                  <span className="text-white/50">Température :</span>{' '}
                  {template.defaultTemperature}
                </p>
              )}
            </div>
          </section>
        )}

        {/* CTAs */}
        <section className="pt-8 border-t border-white/[0.06]">
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href={`/register?template=${template.slug}`}
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold transition-all"
            >
              Commencer avec ce template
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-white/[0.06] border border-white/[0.06] text-white/80 hover:bg-white/[0.1] hover:text-white font-medium transition-all"
            >
              Déjà un compte ? Se connecter
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
