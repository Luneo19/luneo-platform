'use client';

import { Card } from '@/components/ui/card';
import { FadeIn, SlideUp } from '@/components/animations';
import { Upload, Sparkles, Rocket } from 'lucide-react';

const steps = [
  {
    number: '1',
    title: 'Uploadez ou Créez',
    description: 'Importez vos designs existants ou générez-en de nouveaux avec notre IA',
    icon: <Upload className="w-7 h-7" />,
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    number: '2',
    title: 'Personnalisez',
    description: 'Modifiez, ajustez et optimisez vos designs avec nos outils avancés',
    icon: <Sparkles className="w-7 h-7" />,
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    number: '3',
    title: 'Exportez & Vendez',
    description: 'Exportez en qualité print-ready et intégrez dans votre e-commerce',
    icon: <Rocket className="w-7 h-7" />,
    gradient: 'from-orange-500 to-red-500',
  },
];

/**
 * How It Works Section - Step-by-step process
 */
export function HowItWorks() {
  return (
    <section className="py-24 sm:py-32 bg-gradient-to-b from-gray-900 to-gray-800 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <FadeIn className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            Comment ça marche
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Trois étapes simples pour transformer vos idées en produits personnalisés
          </p>
        </FadeIn>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <SlideUp key={index} delay={index * 0.2} className="relative">
              {/* Connector Line (desktop only) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 left-full w-full h-0.5 bg-gradient-to-r from-purple-500/50 via-pink-500/50 to-transparent z-0" />
              )}

              <Card className="relative z-10 bg-gray-800/50 backdrop-blur-sm border-gray-700 p-8 hover:border-purple-500/50 transition-all h-full group">
                {/* Step Number */}
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${step.gradient} mb-6 text-white font-bold text-2xl shadow-lg`}>
                  {step.number}
                </div>

                {/* Icon */}
                <div className={`text-transparent bg-clip-text bg-gradient-to-r ${step.gradient} mb-4 group-hover:scale-110 transition-transform`}>
                  {step.icon}
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  {step.description}
                </p>
              </Card>
            </SlideUp>
          ))}
        </div>
      </div>
    </section>
  );
}
