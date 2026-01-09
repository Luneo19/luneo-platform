'use client';

import { Card } from '@/components/ui/card';
import { FadeIn, StaggerChildren, StaggerItem } from '@/components/animations';
import { Quote } from 'lucide-react';

const testimonials = [
  {
    quote: 'De 100 à 600 commandes/mois sans embaucher. Luneo a permis notre scale et automatisé notre production de designs print-ready.',
    author: 'Marie Bertrand',
    role: 'CEO & Fondatrice',
    company: 'LA FABRIQUE À SACHETS',
    metric: '+500%',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    quote: 'La visualisation 3D premium a éliminé le besoin d\'échantillons physiques. 100% de sell-out sur notre dernière collection.',
    author: 'Francesco Colombo',
    role: 'Chief Operating Officer',
    company: 'DESIGN ITALIAN SHOES',
    metric: '100%',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    quote: 'Les fichiers print-ready automatiques ont été un game-changer. Plus de 80% de temps de workflow économisé.',
    author: 'Christian Martinez',
    role: 'Creative Director',
    company: 'KAZE CLUB',
    metric: '-80%',
    gradient: 'from-green-500 to-emerald-500',
  },
];

/**
 * Testimonials Section - Customer success stories
 */
export function Testimonials() {
  return (
    <section className="py-24 sm:py-32 bg-gray-900 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <FadeIn className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            Ils nous font confiance
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Découvrez comment nos clients transforment leur business avec Luneo
          </p>
        </FadeIn>

        {/* Testimonials Grid */}
        <StaggerChildren className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <StaggerItem key={index}>
              <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700 p-6 sm:p-8 h-full hover:border-purple-500/50 transition-all">
                {/* Metric Badge */}
                <div className={`inline-flex items-center justify-center px-4 py-2 rounded-full bg-gradient-to-r ${testimonial.gradient} text-white font-bold text-lg mb-4`}>
                  {testimonial.metric}
                </div>

                {/* Quote Icon */}
                <Quote className="w-8 h-8 text-gray-600 mb-4" />

                {/* Quote */}
                <p className="text-gray-300 mb-6 leading-relaxed italic">
                  "{testimonial.quote}"
                </p>

                {/* Author */}
                <div className="border-t border-gray-700 pt-4">
                  <p className="font-semibold text-white">
                    {testimonial.author}
                  </p>
                  <p className="text-sm text-gray-400">
                    {testimonial.role}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {testimonial.company}
                  </p>
                </div>
              </Card>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </section>
  );
}
