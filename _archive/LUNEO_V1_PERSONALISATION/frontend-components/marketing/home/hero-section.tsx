'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { 
  FadeIn, 
  TextReveal, 
  MagneticButton, 
  GradientBackground,
  FloatingElements 
} from '@/components/animations';

/**
 * Hero Section - Modern, animated hero with gradient background
 * Style inspired by Pandawa/Gladia
 */
export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-gray-900 via-purple-900/20 to-gray-900">
      {/* Animated Gradient Background */}
      <GradientBackground 
        className="absolute inset-0"
        colors={['#667eea', '#764ba2', '#f093fb', '#4facfe']}
        animate={true}
        size={600}
      />
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <FadeIn delay={0.1}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-8">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-purple-300">
                Plateforme de personnalisation IA nouvelle génération
              </span>
            </div>
          </FadeIn>

          {/* Main Heading */}
          <FadeIn delay={0.2} className="mb-6">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
              Personnalisez vos produits avec{' '}
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                <TextReveal splitBy="word" delay={0.3}>
                  l'intelligence artificielle
                </TextReveal>
              </span>
            </h1>
          </FadeIn>

          {/* Subheading */}
          <FadeIn delay={0.6}>
            <p className="text-xl sm:text-2xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
              Créez des designs 2D/3D, testez en réalité augmentée, et exportez en qualité print-ready.
              Tout en un seul endroit.
            </p>
          </FadeIn>

              {/* CTAs */}
              <FadeIn delay={0.8}>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                  <MagneticButton>
                    <Link href="/register">
                      <Button 
                        size="lg" 
                        className="group bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-6 text-lg font-semibold shadow-lg shadow-purple-500/50"
                      >
                        Commencer gratuitement
                        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </MagneticButton>
                  
                  <MagneticButton>
                    <Link href="/demo">
                      <Button 
                        size="lg" 
                        variant="outline"
                        className="border-2 border-gray-600 hover:border-gray-400 text-white px-8 py-6 text-lg font-semibold backdrop-blur-sm bg-gray-800/50"
                      >
                        Voir la démo
                      </Button>
                    </Link>
                  </MagneticButton>
                </div>
              </FadeIn>

          {/* Trust Badges / Stats */}
          <FadeIn delay={1.0}>
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span>10K+ utilisateurs</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                <span>99.9% uptime</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                <span>Trusted by leading brands</span>
              </div>
            </div>
          </FadeIn>

          {/* Floating Illustration / Mockup */}
          <FadeIn delay={1.2} className="mt-20">
            <FloatingElements intensity={15} duration={4}>
              <div className="relative max-w-4xl mx-auto">
                {/* Mockup placeholder - to be replaced with actual product mockup */}
                <div className="relative rounded-2xl border border-gray-700 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl p-8 shadow-2xl">
                  <div className="aspect-video bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                      <p className="text-gray-400">Product Mockup / Illustration</p>
                    </div>
                  </div>
                </div>
              </div>
            </FloatingElements>
          </FadeIn>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gray-900 to-transparent pointer-events-none" />
    </section>
  );
}
