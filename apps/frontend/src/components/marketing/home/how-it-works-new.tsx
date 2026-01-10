'use client';

import { UserPlus, Settings, Rocket } from 'lucide-react';

const steps = [
  {
    number: '01',
    title: 'Créez votre compte',
    description: 'Inscrivez-vous en quelques secondes avec juste votre email. Aucune carte bancaire requise pour commencer.',
    icon: <UserPlus className="w-6 h-6" />,
    color: 'indigo',
  },
  {
    number: '02',
    title: 'Configurez votre espace',
    description: 'Personnalisez votre environnement, invitez les membres de votre équipe et configurez les intégrations.',
    icon: <Settings className="w-6 h-6" />,
    color: 'purple',
  },
  {
    number: '03',
    title: 'Lancez et développez',
    description: 'Mettez-vous en ligne en toute confiance et développez sans effort au fur et à mesure que votre entreprise grandit.',
    icon: <Rocket className="w-6 h-6" />,
    color: 'green',
  },
];

const colorClasses = {
  indigo: 'bg-gradient-to-br from-indigo-600 to-purple-600',
  purple: 'bg-gradient-to-br from-purple-600 to-pink-600',
  green: 'bg-gradient-to-br from-green-600 to-emerald-600',
};

/**
 * How It Works Section - 3 simple steps
 * Based on Pandawa template, adapted for Luneo
 */
export function HowItWorksNew() {
  return (
    <section id="how-it-works" className="py-24 sm:py-32 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16" data-animate="fade-up">
          <span className="inline-block px-3.5 py-1.5 bg-indigo-100 text-indigo-600 text-xs font-semibold rounded-full mb-4 uppercase tracking-wider">
            Comment ça marche
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Commencez en{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              3 étapes simples
            </span>
          </h2>
          <p className="text-lg text-gray-600">
            Notre processus rationalisé vous permet de passer de zéro au lancement en un temps record.
          </p>
        </div>

        {/* Steps */}
        <div className="max-w-4xl mx-auto space-y-6">
          {steps.map((step, index) => {
            const colors = colorClasses[step.color as keyof typeof colorClasses];
            return (
              <div
                key={step.number}
                className="flex items-center gap-10 p-10 bg-white rounded-2xl border border-gray-100 transition-all hover:border-indigo-600 hover:shadow-lg group"
                data-animate="fade-right"
                data-delay={index * 150}
              >
                <div className="text-6xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex-shrink-0">
                  {step.number}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{step.description}</p>
                </div>
                <div className="flex-shrink-0">
                  <div className={`w-[60px] h-[60px] ${colors} rounded-xl flex items-center justify-center text-white`}>
                    {step.icon}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
