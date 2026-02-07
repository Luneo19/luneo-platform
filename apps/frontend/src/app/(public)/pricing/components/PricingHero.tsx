'use client';

export function PricingHero({
  isYearly,
  onYearlyChange,
}: {
  isYearly: boolean;
  onYearlyChange: (v: boolean) => void;
}) {
  return (
    <section className="border-b border-gray-200 bg-gradient-to-b from-gray-50 to-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            Tarification qui évolue avec vous
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
            Commencez gratuitement avec 50 designs/mois. Votre premier mois est gratuit, sans carte bancaire.
          </p>
        </div>
        <div className="mt-8 flex justify-center">
          <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1">
            <button
              onClick={() => onYearlyChange(false)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                !isYearly ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => onYearlyChange(true)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                isYearly ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Annuel
              <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                -20%
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
