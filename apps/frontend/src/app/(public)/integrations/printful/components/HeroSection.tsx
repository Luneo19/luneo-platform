'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Printer, BookOpen, Settings, CheckCircle2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-24 sm:py-28 md:py-32">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="flex justify-center mb-6">
            <motion
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center shadow-2xl"
            >
              <Printer className="w-12 h-12 text-white" />
            </motion>
          </div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
          >
            Intégration Printful
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl sm:text-2xl md:text-3xl text-blue-100 mb-8 max-w-4xl mx-auto leading-relaxed"
          >
            Print-on-Demand automatique pour vos produits personnalisés. Plus de 300 produits,
            <br />
            <span className="font-semibold text-white">fulfillment automatique, expédition mondiale.</span>
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
          >
            <Link href="https://www.printful.com" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 font-bold px-10 py-7 text-lg shadow-xl hover:shadow-2xl transition-all">
                <Printer className="w-5 h-5 mr-2" />
                Créer un compte Printful
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/help/documentation/integrations/printful">
              <Button size="lg" variant="outline" className="bg-white/20 backdrop-blur border-2 border-white/50 text-white hover:bg-white/30 font-semibold px-10 py-7 text-lg">
                <BookOpen className="w-5 h-5 mr-2" />
                Documentation
              </Button>
            </Link>
            <Link href="/dashboard/integrations">
              <Button size="lg" variant="outline" className="bg-white/20 backdrop-blur border-2 border-white/50 text-white hover:bg-white/30 font-semibold px-10 py-7 text-lg">
                <Settings className="w-5 h-5 mr-2" />
                Configurer
              </Button>
            </Link>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap justify-center gap-8 text-sm md:text-base"
          >
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full">
              <CheckCircle2 className="w-5 h-5" />
              <span>Gratuit à utiliser</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full">
              <CheckCircle2 className="w-5 h-5" />
              <span>300+ produits</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full">
              <CheckCircle2 className="w-5 h-5" />
              <span>Fulfillment automatique</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full">
              <CheckCircle2 className="w-5 h-5" />
              <span>Expédition mondiale</span>
            </div>
          </motion.div>
        </motion>
      </div>
    </section>
  );
}
