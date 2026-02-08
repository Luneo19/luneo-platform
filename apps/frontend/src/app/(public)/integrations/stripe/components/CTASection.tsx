import React from 'react';
import Link from 'next/link';
import { CreditCard, MessageSquare, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CTASection() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
      <div className="max-w-5xl mx-auto text-center">
        <h2 className="text-4xl sm:text-5xl font-bold mb-6">Prêt à accepter les paiements ?</h2>
        <p className="text-xl md:text-2xl text-indigo-100 mb-10 leading-relaxed">
          Créez votre compte Stripe gratuitement et configurez les paiements en moins de 10 minutes.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="https://stripe.com" target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="bg-white text-indigo-600 hover:bg-indigo-50 font-bold px-10 py-7 text-lg shadow-xl">
              <CreditCard className="w-5 h-5 mr-2" />Créer un compte Stripe<ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link href="/contact">
            <Button size="lg" variant="outline" className="bg-white/20 border-2 border-white/50 text-white hover:bg-white/30 font-semibold px-10 py-7 text-lg">
              <MessageSquare className="w-5 h-5 mr-2" />Demander une démo
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
