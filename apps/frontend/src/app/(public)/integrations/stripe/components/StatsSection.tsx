import React from 'react';

export function StatsSection() {
  return (
    <section className="py-16 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center"><div className="text-4xl md:text-5xl font-bold text-indigo-600 mb-2">40+</div><div className="text-sm md:text-base text-gray-600">Méthodes de paiement</div></div>
          <div className="text-center"><div className="text-4xl md:text-5xl font-bold text-green-600 mb-2">135+</div><div className="text-sm md:text-base text-gray-600">Devises</div></div>
          <div className="text-center"><div className="text-4xl md:text-5xl font-bold text-purple-600 mb-2">99.99%</div><div className="text-sm md:text-base text-gray-600">Uptime</div></div>
          <div className="text-center"><div className="text-4xl md:text-5xl font-bold text-pink-600 mb-2">10min</div><div className="text-sm md:text-base text-gray-600">Configuration</div></div>
        </div>
      </div>
    </section>
  );
}
