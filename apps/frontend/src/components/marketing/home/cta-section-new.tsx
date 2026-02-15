'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield, Globe, Lock } from 'lucide-react';
import { ScrollReveal } from '@/components/marketing/shared/scroll-reveal';
import { AnimatedBorderCTA } from '@/components/ui/animated-border';
import { FireflyCTA } from '@/components/ui/firefly-cta';

export function CTASectionNew() {
  return (
    <section className="dark-section relative py-20 sm:py-24 md:py-32 noise-overlay overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-dark-bg to-pink-900/20 animate-gradient-shift gpu-accelerated" style={{ backgroundSize: '400% 400%' }} />
        <div className="absolute w-[400px] sm:w-[600px] lg:w-[800px] h-[400px] sm:h-[600px] lg:h-[800px] rounded-full bg-purple-500/[0.08] blur-[100px] sm:blur-[150px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <ScrollReveal animation="fade-up" duration={700}>
            <h2 className="heading-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-5 sm:mb-6">
              <span className="text-white text-glow-white">Pret a </span>
              <span className="italic text-gradient-purple">transformer</span>
              <span className="text-white text-glow-white"> votre business ?</span>
            </h2>
          </ScrollReveal>

          <ScrollReveal animation="fade-up" delay={100}>
            <p className="text-base sm:text-lg text-white/80 mb-8 sm:mb-10 max-w-xl mx-auto leading-relaxed px-2">
              Rejoignez des milliers de marques qui utilisent deja Luneo pour creer des experiences produit exceptionnelles.
            </p>
          </ScrollReveal>

          <ScrollReveal animation="fade-up" delay={200}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-8 sm:mb-10">
              <Link href="/register" className="w-full sm:w-auto">
                <FireflyCTA color="purple" speed="normal">
                  <AnimatedBorderCTA speed="normal">
                    <Button
                      size="lg"
                      className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-6 sm:px-10 py-5 sm:py-6 text-sm sm:text-base font-bold shadow-xl shadow-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/40 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200"
                    >
                      Essai gratuit 14 jours
                      <ArrowRight className="ml-2 w-4 sm:w-5 h-4 sm:h-5" />
                    </Button>
                  </AnimatedBorderCTA>
                </FireflyCTA>
              </Link>
              <Link href="/contact" className="w-full sm:w-auto">
                <AnimatedBorderCTA speed="normal" variant="white">
                  <Button
                    size="lg"
                    variant="ghost"
                    className="w-full sm:w-auto px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base font-semibold bg-white text-black hover:bg-white/90 hover:text-black border-0"
                  >
                    Parler aux ventes
                  </Button>
                </AnimatedBorderCTA>
              </Link>
            </div>
          </ScrollReveal>

          {/* Trust badges */}
          <ScrollReveal animation="fade" delay={400}>
            <div className="flex items-center justify-center gap-4 sm:gap-6 text-white/80 text-[10px] sm:text-xs">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3 sm:w-3.5 h-3 sm:h-3.5" /> SOC 2
              </span>
              <span className="flex items-center gap-1.5">
                <Globe className="w-3 sm:w-3.5 h-3 sm:h-3.5" /> RGPD
              </span>
              <span className="flex items-center gap-1.5">
                <Lock className="w-3 sm:w-3.5 h-3 sm:h-3.5" /> SSL 256-bit
              </span>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
