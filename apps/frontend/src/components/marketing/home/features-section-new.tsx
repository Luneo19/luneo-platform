'use client';

import { Zap, Shield, RefreshCw, Puzzle, TrendingUp, Headphones } from 'lucide-react';

const features = [
  {
    icon: <Zap className="w-6 h-6" />,
    title: 'Génération IA Ultra-Rapide',
    description: 'Performance optimisée qui garantit que vos designs sont générés en quelques secondes.',
    color: 'indigo',
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'Sécurité Enterprise',
    description: 'Sécurité de niveau entreprise avec chiffrement de bout en bout et conformité intégrée.',
    color: 'purple',
  },
  {
    icon: <RefreshCw className="w-6 h-6" />,
    title: 'Synchronisation Temps Réel',
    description: 'Synchronisation instantanée sur tous les appareils et membres de l\'équipe.',
    color: 'green',
  },
  {
    icon: <Puzzle className="w-6 h-6" />,
    title: 'Intégrations',
    description: 'Connectez-vous à 100+ outils que vous utilisez déjà et adorez.',
    color: 'orange',
  },
  {
    icon: <TrendingUp className="w-6 h-6" />,
    title: 'Analytics Avancés',
    description: 'Insights et analytics approfondis pour prendre des décisions basées sur les données.',
    color: 'pink',
  },
  {
    icon: <Headphones className="w-6 h-6" />,
    title: 'Support 24/7',
    description: 'Support disponible 24h/24 et 7j/7 de notre équipe d\'experts quand vous en avez besoin.',
    color: 'cyan',
  },
];

const colorClasses = {
  indigo: {
    bg: 'bg-indigo-100',
    hover: 'bg-gradient-to-br from-indigo-600 to-purple-600',
    text: 'text-indigo-600',
    border: 'border-indigo-500/20 hover:border-indigo-500/50',
  },
  purple: {
    bg: 'bg-purple-100',
    hover: 'bg-gradient-to-br from-purple-600 to-pink-600',
    text: 'text-purple-600',
    border: 'border-purple-500/20 hover:border-purple-500/50',
  },
  green: {
    bg: 'bg-green-100',
    hover: 'bg-gradient-to-br from-green-600 to-emerald-600',
    text: 'text-green-600',
    border: 'border-green-500/20 hover:border-green-500/50',
  },
  orange: {
    bg: 'bg-orange-100',
    hover: 'bg-gradient-to-br from-orange-600 to-yellow-600',
    text: 'text-orange-600',
    border: 'border-orange-500/20 hover:border-orange-500/50',
  },
  pink: {
    bg: 'bg-pink-100',
    hover: 'bg-gradient-to-br from-pink-600 to-rose-600',
    text: 'text-pink-600',
    border: 'border-pink-500/20 hover:border-pink-500/50',
  },
  cyan: {
    bg: 'bg-cyan-100',
    hover: 'bg-gradient-to-br from-cyan-600 to-blue-600',
    text: 'text-cyan-600',
    border: 'border-cyan-500/20 hover:border-cyan-500/50',
  },
};

/**
 * Features Section - Showcase key features
 * Based on Pandawa template, adapted for Luneo
 */
export function FeaturesSectionNew() {
  return (
    <section id="features" className="py-24 sm:py-32 bg-gray-50 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16" data-animate="fade-up">
          <span className="inline-block px-3.5 py-1.5 bg-indigo-100 text-indigo-600 text-xs font-semibold rounded-full mb-4 uppercase tracking-wider">
            Fonctionnalités
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Tout ce dont vous avez besoin pour{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              réussir
            </span>
          </h2>
          <p className="text-lg text-gray-600">
            Des fonctionnalités puissantes conçues pour vous aider à créer, lancer et faire croître
            vos produits personnalisés plus rapidement que jamais.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const colors = colorClasses[feature.color as keyof typeof colorClasses];
            return (
              <div
                key={feature.title}
                className="bg-white p-8 rounded-2xl border border-gray-100 transition-all hover:-translate-y-2 hover:shadow-xl hover:border-transparent group"
                data-animate="fade-up"
                data-delay={index * 100}
              >
                <div
                  className={`w-14 h-14 ${colors.bg} ${colors.text} rounded-xl flex items-center justify-center mb-5 transition-all group-hover:${colors.hover} group-hover:text-white`}
                >
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
