'use client';

import React from 'react';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { Card } from '@/components/ui/card';
import { FEATURES } from './data';

export function FeaturesSection() {
  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Fonctionnalités <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Avancées</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">CPQ professionnel avec rendu 3D photoréaliste et export production</p>
        </motion>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((feature, i) => (
            <motion key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
              <Card className="h-full bg-gray-800/30 border-gray-700/50 p-6 hover:border-blue-500/50 hover:bg-gray-800/50 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-4 text-blue-400 group-hover:scale-110 transition-transform">{feature.icon}</div>
                <div className="inline-block px-2 py-0.5 bg-blue-500/20 rounded text-xs text-blue-300 font-medium mb-2">{feature.highlight}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{feature.description}</p>
              </Card>
            </motion>
          ))}
        </div>
      </div>
    </section>
  );
}
