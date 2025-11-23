import Link from 'next/link';
import { DollarSign, Users, TrendingUp, Gift } from 'lucide-react';

export const metadata = {
  title: 'Programme Affiliation - Luneo',
  description: 'Gagnez jusqu\'à 30% de commission en recommandant Luneo',
};

export default function AffiliatePage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <DollarSign className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-5xl font-bold mb-6">Programme Affiliation</h1>
          <p className="text-2xl text-green-100 mb-8">
            Gagnez jusqu'à 30% de commission récurrente en recommandant Luneo à votre audience. Simple, transparent, et rentable.
          </p>
          <Link href="/contact?subject=affiliation" className="bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-green-50 inline-block">
            Rejoindre le programme
          </Link>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-12">Pourquoi Devenir Affilié ?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: DollarSign, title: '30% Commission', desc: 'Récurrente à vie sur chaque client' },
            { icon: Users, title: 'Cookie 90 jours', desc: 'Attribution longue durée' },
            { icon: TrendingUp, title: 'Dashboard détaillé', desc: 'Tracking en temps réel' },
            { icon: Gift, title: 'Bonus performance', desc: 'Prime à partir de 10 ventes/mois' },
          ].map((benefit) => (
            <div key={benefit.title} className="bg-gray-50 rounded-xl p-6 text-center">
              <benefit.icon className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-bold text-gray-900 mb-2">{benefit.title}</h3>
              <p className="text-gray-600 text-sm">{benefit.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-12">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Commissions par Plan</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">30%</div>
              <div className="text-sm text-gray-600">Plan Professional (29€/mois)</div>
              <div className="text-lg font-semibold text-green-600 mt-2">≈ 8,70€/mois</div>
            </div>
            <div className="bg-white rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">30%</div>
              <div className="text-sm text-gray-600">Plan Business (59€/mois)</div>
              <div className="text-lg font-semibold text-green-600 mt-2">≈ 17,70€/mois</div>
            </div>
            <div className="bg-white rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">30%</div>
              <div className="text-sm text-gray-600">Plan Enterprise (99€+/mois)</div>
              <div className="text-lg font-semibold text-green-600 mt-2">≈ 29,70€+/mois</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
