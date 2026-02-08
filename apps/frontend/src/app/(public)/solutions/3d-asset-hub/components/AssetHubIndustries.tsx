'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Image as ImageIcon, Package, Globe, TrendingUp, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

const USE_CASES = [
  {
    title: 'E-commerce AR',
    description: 'Convertissez vos produits 3D en AR pour iOS (USDZ) et Android (GLB)',
    icon: ImageIcon,
    color: 'blue',
    points: ['Upload GLB → Auto USDZ conversion', 'Optimisation mobile (< 10MB)', 'AR Quick Look + Scene Viewer ready'],
  },
  {
    title: 'Gaming Assets',
    description: 'Préparez vos assets pour Unity, Unreal Engine, et autres moteurs',
    icon: Package,
    color: 'purple',
    points: ['Export FBX + GLB optimisés', 'LODs automatiques (4 niveaux)', 'Textures PBR compressées'],
  },
  {
    title: 'Web Viewer',
    description: 'Intégrez des viewers 3D sur votre site avec Three.js',
    icon: Globe,
    color: 'green',
    points: ['GLB Draco ultra-léger', 'Progressive loading', 'Embed code 1-click'],
  },
  {
    title: 'Batch Processing',
    description: "Traitez des milliers d'assets automatiquement",
    icon: TrendingUp,
    color: 'orange',
    points: ['Upload CSV avec URLs', 'Processing pipeline auto', 'Webhooks notifications'],
  },
];

export function AssetHubIndustries() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-black/50">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Cas d&apos;Usage
          </h2>
          <p className="text-xl text-gray-300">
            Solution complète pour tous vos besoins 3D
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {USE_CASES.map((uc) => {
            const Icon = uc.icon;
            const borderClass =
              uc.color === 'blue'
                ? 'border-blue-500/20'
                : uc.color === 'purple'
                  ? 'border-purple-500/20'
                  : uc.color === 'green'
                    ? 'border-green-500/20'
                    : 'border-orange-500/20';
            const iconBgClass =
              uc.color === 'blue'
                ? 'bg-blue-500/20 text-blue-400'
                : uc.color === 'purple'
                  ? 'bg-purple-500/20 text-purple-400'
                  : uc.color === 'green'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-orange-500/20 text-orange-400';
            return (
              <Card key={uc.title} className={`bg-gray-900/50 ${borderClass} p-8`}>
                <div className="flex items-start gap-4 mb-6">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBgClass}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-white">{uc.title}</h3>
                    <p className="text-gray-400">{uc.description}</p>
                  </div>
                </div>
                <ul className="space-y-3 text-sm text-gray-300">
                  {uc.points.map((point) => (
                    <li key={point} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span>{point}</span>
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
