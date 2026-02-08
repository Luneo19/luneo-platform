'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Upload, Zap, FileType, Cpu, Layers, Globe, Package, Cloud } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { FEATURES } from '../data';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Upload,
  Zap,
  FileType,
  Cpu,
  Layers,
  Globe,
  Package,
  Cloud,
};

export function AssetHubFeatures() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Fonctionnalités Avancées
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Pipeline complet de gestion d&apos;assets 3D, de l&apos;upload au déploiement
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((feature, index) => {
            const Icon = ICON_MAP[feature.iconKey] ?? Package;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-gray-900/50 border-blue-500/20 p-6 h-full hover:border-blue-500/50 hover:bg-gray-900/70 transition-all group">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-white">{feature.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
