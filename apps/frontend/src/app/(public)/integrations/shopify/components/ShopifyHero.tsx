'use client';

import { Button } from '@/components/ui/button';
import { IntegrationStatusBadge } from '@/components/integrations/IntegrationStatusBadge';
import { motion } from 'framer-motion';
import { ShoppingBag, BookOpen, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export function ShopifyHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white py-20 sm:py-24 md:py-28">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <ShoppingBag className="w-10 h-10 text-white" />
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 mb-6">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold">
              Intégration Shopify
            </h1>
            <IntegrationStatusBadge integrationType="shopify" className="text-sm" />
          </div>
          <p className="text-xl sm:text-2xl text-green-100 mb-8 max-w-3xl mx-auto">
            Ajoutez la personnalisation 3D/AR à votre boutique Shopify en 15 minutes.
            <br />
            <span className="font-semibold text-white">Augmentez vos conversions de 35% en moyenne.</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/dashboard/integrations">
              <Button
                size="lg"
                className="bg-white text-green-600 hover:bg-green-50 font-semibold px-8 py-6 text-lg"
              >
                <ShoppingBag className="w-5 h-5 mr-2" />
                Configurer l&apos;intégration
              </Button>
            </Link>
            <Link href="/help/documentation/integrations/shopify">
              <Button
                size="lg"
                variant="outline"
                className="bg-white/10 backdrop-blur border-2 border-white/30 text-white hover:bg-white/20 font-semibold px-8 py-6 text-lg"
              >
                <BookOpen className="w-5 h-5 mr-2" />
                Voir la documentation
              </Button>
            </Link>
          </div>
          <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>Installation en 2 minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>Support 7j/7</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              <span>Gratuit à installer</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
