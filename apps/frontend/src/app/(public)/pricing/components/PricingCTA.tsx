'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PricingCTA() {
  return (
    <section className="border-t border-gray-200 bg-gradient-to-br from-blue-600 to-purple-600 py-16 sm:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold text-white">Besoin d&apos;une solution Enterprise ?</h2>
        <p className="mt-4 text-lg text-blue-100">
          Tarification personnalisée, infrastructure dédiée, support 24/7 et bien plus encore.
        </p>
        <Link href="/contact?type=enterprise" className="mt-8 inline-block">
          <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
            Contacter les ventes
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </div>
    </section>
  );
}
