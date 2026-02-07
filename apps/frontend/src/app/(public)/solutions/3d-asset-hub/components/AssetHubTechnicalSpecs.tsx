'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Gauge, Layers, Package, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

const SPECS = [
  {
    icon: Gauge,
    title: 'Performance',
    color: 'blue',
    items: ['Traitement < 2s par asset', '1000+ assets/heure (batch)', 'Compression 70-95%', 'Edge CDN global < 50ms'],
  },
  {
    icon: Layers,
    title: 'Optimisation',
    color: 'purple',
    items: ['Auto LOD generation (4 niveaux)', 'Texture compression (WebP, AVIF, Basis)', 'AI mesh simplification', 'Geometry cleanup auto'],
  },
  {
    icon: Package,
    title: 'Scalabilité',
    color: 'green',
    items: ['BullMQ + Redis queue', 'Multi-worker parallel', 'Rate limiting intelligent', 'Auto-scaling workers'],
  },
];

export function AssetHubTechnicalSpecs() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Spécifications Techniques
          </h2>
          <p className="text-xl text-gray-300">
            Performance et scalabilité enterprise-grade
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {SPECS.map((spec) => {
            const Icon = spec.icon;
            const borderClass =
              spec.color === 'blue'
                ? 'border-blue-500/20'
                : spec.color === 'purple'
                  ? 'border-purple-500/20'
                  : 'border-green-500/20';
            const iconColor =
              spec.color === 'blue'
                ? 'text-blue-400'
                : spec.color === 'purple'
                  ? 'text-purple-400'
                  : 'text-green-400';
            return (
              <Card key={spec.title} className={`bg-gray-900/50 ${borderClass} p-6`}>
                <Icon className={`w-10 h-10 ${iconColor} mb-4`} />
                <h3 className="text-xl font-bold mb-3 text-white">{spec.title}</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  {spec.items.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
