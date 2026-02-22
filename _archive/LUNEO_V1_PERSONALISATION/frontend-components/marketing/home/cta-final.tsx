'use client';

import { Button } from '@/components/ui/button';
import { FadeIn, MagneticButton, GradientBackground } from '@/components/animations';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

/**
 * Final CTA Section - Strong call-to-action before footer
 */
export function CTAFinal() {
  return (
    <section className="py-24 sm:py-32 relative overflow-hidden">
      <GradientBackground 
        className="absolute inset-0"
        colors={['#667eea', '#764ba2', '#f093fb']}
        animate={true}
        size={800}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <FadeIn>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Prêt à transformer vos produits ?
            </h2>
          </FadeIn>

          <FadeIn delay={0.2}>
            <p className="text-xl sm:text-2xl text-gray-300 mb-12 max-w-2xl mx-auto">
              Rejoignez des milliers de créateurs qui utilisent Luneo pour personnaliser et vendre leurs produits
            </p>
          </FadeIn>

          <FadeIn delay={0.4}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <MagneticButton>
                <Link href="/register">
                  <Button 
                    size="lg" 
                    className="group bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-6 text-lg font-semibold shadow-lg shadow-purple-500/50"
                  >
                    Démarrer gratuitement
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </MagneticButton>

              <MagneticButton>
                <Link href="/pricing">
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="border-2 border-white/20 hover:border-white/40 text-white px-8 py-6 text-lg font-semibold backdrop-blur-sm bg-white/10"
                  >
                    Voir les tarifs
                  </Button>
                </Link>
              </MagneticButton>
            </div>
          </FadeIn>

          {/* Trust indicators */}
          <FadeIn delay={0.6} className="mt-12">
            <p className="text-sm text-gray-400">
              ✓ Essai gratuit de 14 jours • ✓ Sans carte bancaire • ✓ Annulation à tout moment
            </p>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
