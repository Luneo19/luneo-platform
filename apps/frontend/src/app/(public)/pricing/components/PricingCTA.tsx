'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PricingCTA() {
  return (
    <section className="relative border-t border-white/[0.04] py-16 sm:py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-pink-900/10" />
      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="font-display text-3xl font-bold text-white">
          Besoin d&apos;une solution <span className="italic text-gradient-purple">Enterprise</span> ?
        </h2>
        <p className="mt-4 text-lg text-slate-400">
          Tarification personnalisee, infrastructure dediee, support 24/7 et bien plus encore.
        </p>
        <Link href="/contact?type=enterprise" className="mt-8 inline-block">
          <Button size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold shadow-lg shadow-purple-500/25">
            Contacter les ventes
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </div>
    </section>
  );
}
