'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CreditCard, BookOpen, Settings, CheckCircle2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white py-24 sm:py-28 md:py-32">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
          <div className="flex justify-center mb-6">
            <motion initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }} className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center shadow-2xl">
              <CreditCard className="w-12 h-12 text-white" />
            </motion>
          </div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            Intégration Stripe
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-xl sm:text-2xl md:text-3xl text-indigo-100 mb-8 max-w-4xl mx-auto leading-relaxed">
            Paiements sécurisés pour vos produits personnalisés. Cartes, Apple Pay, Google Pay, abonnements.
            <br />
            <span className="font-semibold text-white">Configuration en 10 minutes, conformité PCI incluse.</span>
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link href="https://stripe.com" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-white text-indigo-600 hover:bg-indigo-50 font-bold px-10 py-7 text-lg shadow-xl hover:shadow-2xl transition-all">
                <CreditCard className="w-5 h-5 mr-2" />Créer un compte Stripe<ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/help/documentation/integrations/stripe">
              <Button size="lg" variant="outline" className="bg-white/10 backdrop-blur border-2 border-white/30 text-white hover:bg-white/20 font-semibold px-10 py-7 text-lg">
                <BookOpen className="w-5 h-5 mr-2" />Documentation
              </Button>
            </Link>
            <Link href="/dashboard/integrations">
              <Button size="lg" variant="outline" className="bg-white/10 backdrop-blur border-2 border-white/30 text-white hover:bg-white/20 font-semibold px-10 py-7 text-lg">
                <Settings className="w-5 h-5 mr-2" />Configurer
              </Button>
            </Link>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="flex flex-wrap justify-center gap-8 text-sm md:text-base">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full"><CheckCircle2 className="w-5 h-5" /><span>PCI DSS Level 1</span></div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full"><CheckCircle2 className="w-5 h-5" /><span>40+ méthodes de paiement</span></div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full"><CheckCircle2 className="w-5 h-5" /><span>135+ devises</span></div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full"><CheckCircle2 className="w-5 h-5" /><span>99.99% uptime</span></div>
          </motion.div>
        </motion>
      </div>
    </section>
  );
}
