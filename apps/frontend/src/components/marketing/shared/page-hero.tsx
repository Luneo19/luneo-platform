'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ScrollReveal, useParallax } from '@/components/marketing/shared/scroll-reveal';

interface PageHeroProps {
  title: string;
  description?: string;
  badge?: string;
  cta?: {
    label: string;
    href: string;
  };
  gradient?: string;
}

export function PageHero({
  title,
  description,
  badge,
  cta,
  gradient = 'from-purple-500 via-fuchsia-500 to-pink-500',
}: PageHeroProps) {
  const parallaxRef = useParallax(0.1);

  return (
    <section className="relative pt-24 sm:pt-32 pb-14 sm:pb-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 gradient-mesh-purple opacity-60" />
      <div ref={parallaxRef} className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className={`absolute w-[300px] sm:w-[450px] lg:w-[600px] h-[300px] sm:h-[450px] lg:h-[600px] rounded-full bg-gradient-to-br ${gradient} opacity-[0.06] blur-[80px] sm:blur-[120px] top-[-100px] sm:top-[-200px] right-[-50px] sm:right-[-100px] animate-float gpu-accelerated`} />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(168,85,247,0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(168,85,247,0.3) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          {badge && (
            <ScrollReveal animation="fade-down" duration={400}>
              <div className="inline-flex items-center gap-2 sm:gap-2.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-xs sm:text-sm font-medium text-purple-400 mb-5 sm:mb-6">
                <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                {badge}
              </div>
            </ScrollReveal>
          )}

          <ScrollReveal animation="fade-up" delay={100} duration={700}>
            <h1 className="heading-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-4 sm:mb-6 text-white text-glow-white px-2">
              {title}
            </h1>
          </ScrollReveal>

          {description && (
            <ScrollReveal animation="fade-up" delay={200}>
              <p className="text-base sm:text-lg md:text-xl text-slate-300 body-text mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
                {description}
              </p>
            </ScrollReveal>
          )}

          {cta && (
            <ScrollReveal animation="fade-up" delay={300}>
              <div>
                <Link href={cta.href} className="inline-block">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base font-bold shadow-xl shadow-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                  >
                    {cta.label}
                    <ArrowRight className="ml-2 w-4 sm:w-5 h-4 sm:h-5" />
                  </Button>
                </Link>
              </div>
            </ScrollReveal>
          )}
        </div>
      </div>
    </section>
  );
}
