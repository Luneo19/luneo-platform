'use client';

import { Button } from '@/components/ui/button';
import { ShoppingBag, MessageSquare } from 'lucide-react';
import Link from 'next/link';

export function ShopifyCTA() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-bold mb-6">
          Prêt à transformer votre boutique Shopify ?
        </h2>
        <p className="text-xl text-green-100 mb-8">
          Installez l&apos;app gratuitement et commencez à personnaliser vos produits en moins de 2 minutes.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/dashboard/integrations">
            <Button size="lg" className="bg-white text-green-600 hover:bg-green-50 font-bold px-8 py-6 text-lg">
              <ShoppingBag className="w-5 h-5 mr-2" />
              Configurer l&apos;intégration
            </Button>
          </Link>
          <Link href="/contact">
            <Button size="lg" variant="outline" className="bg-white/20 border-2 border-white/50 text-white hover:bg-white/30 font-semibold px-8 py-6 text-lg">
              <MessageSquare className="w-5 h-5 mr-2" />
              Demander une démo
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
