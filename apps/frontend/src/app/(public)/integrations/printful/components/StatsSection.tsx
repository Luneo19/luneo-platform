import React from 'react';

export function StatsSection() {
  return (
    <section className="py-16 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">300+</div>
            <div className="text-sm md:text-base text-gray-600">Produits disponibles</div>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold text-green-600 mb-2">10+</div>
            <div className="text-sm md:text-base text-gray-600">Centres production</div>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold text-purple-600 mb-2">200+</div>
            <div className="text-sm md:text-base text-gray-600">Pays livrés</div>
          </div>
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold text-orange-600 mb-2">2-7j</div>
            <div className="text-sm md:text-base text-gray-600">Délai production</div>
          </div>
        </div>
      </div>
    </section>
  );
}
