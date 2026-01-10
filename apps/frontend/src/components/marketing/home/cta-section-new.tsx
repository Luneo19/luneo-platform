'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

/**
 * CTA Section - Final call to action
 * Based on Pandawa template, adapted for Luneo
 */
export function CTASectionNew() {
  return (
    <section className="relative py-24 sm:py-32 bg-gradient-to-r from-indigo-600 to-purple-600 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-[600px] h-[600px] bg-white/10 rounded-full -top-[200px] -right-[200px]" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-2xl mx-auto text-center" data-animate="fade-up">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Prêt à commencer ?
          </h2>
          <p className="text-lg text-white/90 mb-8">
            Rejoignez des milliers d'équipes qui utilisent déjà Luneo pour créer des produits exceptionnels.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-white text-gray-900 hover:bg-gray-50 px-8 py-6 text-base font-semibold shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all"
              >
                Essai gratuit
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 px-8 py-6 text-base font-semibold"
              >
                Parler aux ventes
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
