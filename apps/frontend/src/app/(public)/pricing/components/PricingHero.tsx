'use client';

export function PricingHero({
  isYearly,
  onYearlyChange,
}: {
  isYearly: boolean;
  onYearlyChange: (v: boolean) => void;
}) {
  return (
    <section className="relative pt-32 pb-16 sm:pt-40 sm:pb-24">
      <div className="absolute inset-0 gradient-mesh-purple opacity-50" />
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 text-xs font-semibold rounded-full mb-5 uppercase tracking-wider">
            Tarifs
          </span>
          <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
            Tarification qui{' '}
            <span className="italic text-gradient-purple">evolue avec vous</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
            Commencez gratuitement avec 50 designs/mois. Votre premier mois est gratuit, sans carte bancaire.
          </p>
        </div>
        <div className="mt-8 flex justify-center">
          <div className="inline-flex rounded-xl border border-white/[0.08] bg-dark-card p-1">
            <button
              onClick={() => onYearlyChange(false)}
              className={`rounded-lg px-5 py-2.5 text-sm font-medium transition-all ${
                !isYearly ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/20' : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => onYearlyChange(true)}
              className={`rounded-lg px-5 py-2.5 text-sm font-medium transition-all ${
                isYearly ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/20' : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              Annuel
              <span className="ml-2 rounded-full bg-green-500/20 border border-green-500/30 px-2 py-0.5 text-xs font-semibold text-green-400">
                -20%
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
