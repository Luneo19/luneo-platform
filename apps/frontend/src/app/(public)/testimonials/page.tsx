import { Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Marie Dupont',
    initials: 'MD',
    role: 'Directrice Service Client',
    company: 'TechStart',
    text: 'Depuis que nous utilisons Luneo, notre taux de résolution automatique a atteint 85\u00a0%. Nos agents répondent 24/7 et nos clients sont plus satisfaits que jamais.',
    stars: 5,
    gradient: 'from-blue-500 to-cyan-400',
  },
  {
    name: 'Thomas Martin',
    initials: 'TM',
    role: 'CEO',
    company: 'ShopExpress',
    text: "L'agent IA Luneo gère 90\u00a0% de nos demandes e-commerce\u00a0: suivi de commandes, retours, FAQ. Notre équipe se concentre enfin sur les cas complexes.",
    stars: 5,
    gradient: 'from-purple-500 to-pink-400',
  },
  {
    name: 'Sophie Bernard',
    initials: 'SB',
    role: 'VP Marketing',
    company: 'DataFlow',
    text: "La mise en place a pris 20 minutes. L'agent comprend parfaitement notre documentation technique et répond avec précision.",
    stars: 5,
    gradient: 'from-amber-500 to-orange-400',
  },
];

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: count }).map((_, i) => (
        <Star
          key={i}
          className="h-4 w-4 fill-amber-400 text-amber-400"
        />
      ))}
    </div>
  );
}

export default function TestimonialsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Hero */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-amber-600/20 blur-3xl" />
        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <span className="mb-4 inline-block rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-sm font-medium text-white/70">
            Témoignages
          </span>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Ils ont{' '}
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
              transformé leur support
            </span>{' '}
            avec Luneo
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/60">
            Découvrez comment nos clients automatisent leur relation client
            grâce aux agents IA Luneo.
          </p>
        </div>
      </section>

      {/* Testimonials Grid */}
      <section className="relative pb-24 sm:pb-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.03] p-8 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.12] hover:bg-white/[0.05]"
              >
                <Stars count={t.stars} />

                <blockquote className="mt-5 text-[15px] leading-relaxed text-white/70">
                  &ldquo;{t.text}&rdquo;
                </blockquote>

                <div className="mt-6 flex items-center gap-4 border-t border-white/[0.06] pt-6">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${t.gradient} text-sm font-bold text-white shadow-lg`}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{t.name}</p>
                    <p className="text-sm text-white/50">
                      {t.role}, {t.company}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative border-t border-white/[0.06] py-24">
        <div className="absolute inset-0 bg-gradient-to-t from-purple-600/5 to-transparent" />
        <div className="relative z-10 mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Rejoignez nos clients satisfaits
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/60">
            Essayez Luneo gratuitement et découvrez comment un agent IA peut
            transformer votre service client.
          </p>
          <a
            href="/register"
            className="mt-8 inline-flex items-center rounded-full bg-gradient-to-r from-purple-500 to-pink-600 px-8 py-3 font-medium text-white shadow-lg shadow-purple-500/25 transition-all hover:shadow-purple-500/40"
          >
            Commencer gratuitement
          </a>
        </div>
      </section>
    </div>
  );
}
