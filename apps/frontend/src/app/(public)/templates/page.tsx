import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: "Templates d'agents IA | Luneo",
  description:
    "Découvrez nos templates d'agents IA pré-configurés. Support client, ventes, onboarding, FAQ et plus. Déployez en 15 minutes.",
  openGraph: {
    title: "Templates d'agents IA | Luneo",
    description: "Agents IA pré-configurés pour automatiser votre service client.",
    url: 'https://luneo.app/templates',
  },
};

const CATEGORIES = [
  { value: '', label: 'Tous' },
  { value: 'SUPPORT', label: 'Support' },
  { value: 'SALES', label: 'Ventes' },
  { value: 'ONBOARDING', label: 'Onboarding' },
  { value: 'REVIEWS', label: 'Avis' },
  { value: 'CONTENT', label: 'Contenu' },
  { value: 'ANALYTICS', label: 'Analytics' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'CUSTOM', label: 'Personnalisé' },
] as const;

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
  category: string;
  icon: string;
  color?: string;
  capabilities?: string[];
  usageCount?: number;
  avgRating?: number | null;
};

async function getTemplates(category?: string): Promise<Template[]> {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const url = category
    ? `${backendUrl}/api/v1/agent-templates?category=${encodeURIComponent(category)}`
    : `${backendUrl}/api/v1/agent-templates`;
  const res = await fetch(url, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data?.data ?? data ?? [];
}

export default async function TemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const category = params.category ?? '';
  const templates = await getTemplates(category || undefined);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Hero */}
      <section className="relative pt-20 pb-16 sm:pt-24 sm:pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/40 via-indigo-950/30 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.2),transparent)] pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Templates d&apos;agents IA
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto mb-8">
            Découvrez nos templates pré-configurés. Support client, ventes, onboarding, FAQ et plus.
            Déployez en 15 minutes.
          </p>
          {/* Search placeholder - category filter via links below */}
          <div className="max-w-xl mx-auto">
            <div className="relative rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-3">
              <span className="text-white/40 text-sm">Filtrez par catégorie ci-dessous</span>
            </div>
          </div>
        </div>
      </section>

      {/* Category filters */}
      <section className="border-t border-white/[0.06] py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-2">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.value || 'all'}
                href={cat.value ? `/templates?category=${cat.value}` : '/templates'}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  (!category && !cat.value) || category === cat.value
                    ? 'bg-violet-600/30 text-violet-200 border border-violet-500/40'
                    : 'bg-white/[0.04] text-white/70 border border-white/[0.06] hover:bg-white/[0.08] hover:text-white'
                }`}
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Grid of template cards */}
      <section className="py-12 sm:py-16 pb-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {templates.length === 0 ? (
            <div className="text-center py-16 text-white/60">
              <p>Aucun template trouvé pour cette catégorie.</p>
              <Link
                href="/templates"
                className="mt-4 inline-block text-violet-400 hover:text-violet-300"
              >
                Voir tous les templates
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {templates.map((tpl) => (
                <article
                  key={tpl.id}
                  className="group rounded-xl bg-white/[0.03] border border-white/[0.06] p-6 hover:border-white/[0.1] hover:bg-white/[0.05] transition-all duration-200"
                >
                  <div className="flex items-start gap-4">
                    <span
                      className="text-3xl flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-lg bg-white/[0.06]"
                      aria-hidden
                    >
                      {tpl.icon || '🤖'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-medium border mb-2 ${
                          CATEGORY_COLORS[tpl.category] ?? 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30'
                        }`}
                      >
                        {tpl.category}
                      </span>
                      <h2 className="text-lg font-semibold text-white mb-1">
                        <Link
                          href={`/templates/${tpl.slug}`}
                          className="hover:text-violet-300 transition-colors"
                        >
                          {tpl.name}
                        </Link>
                      </h2>
                      <p className="text-sm text-white/60 line-clamp-2 mb-4">{tpl.description}</p>
                      {Array.isArray(tpl.capabilities) && tpl.capabilities.length > 0 && (
                        <ul className="space-y-1 mb-4">
                          {tpl.capabilities.slice(0, 3).map((cap, i) => (
                            <li key={i} className="text-xs text-white/50 flex items-center gap-2">
                              <span className="w-1 h-1 rounded-full bg-violet-500/60" />
                              {cap}
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs text-white/40">
                          {typeof tpl.usageCount === 'number' && (
                            <span>{tpl.usageCount.toLocaleString('fr-FR')} utilisations</span>
                          )}
                          {typeof tpl.avgRating === 'number' && (
                            <span>★ {tpl.avgRating.toFixed(1)}</span>
                          )}
                        </div>
                        <Link
                          href={`/register?template=${tpl.slug}`}
                          className="text-sm font-medium text-violet-400 hover:text-violet-300 transition-colors"
                        >
                          Commencer gratuitement →
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-white/[0.06] py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Créez votre agent personnalisé
          </h2>
          <p className="text-white/70 mb-8">
            Personnalisez un template ou partez de zéro. Sans code, en quelques minutes.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold transition-all"
          >
            Créer un compte gratuit
          </Link>
        </div>
      </section>
    </div>
  );
}
