'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';

const ROWS = [
  { feature: "Formats d'entrée", other: 'GLB, FBX, OBJ (3)', luneo: '12+ formats (GLB, FBX, OBJ, USD, STL...)' },
  { feature: 'Optimisation AI', other: 'Non mentionné', luneo: '✅ Mesh simplification intelligente' },
  { feature: 'Batch Processing', other: 'Limité', luneo: '✅ 1000+ assets/heure (BullMQ)' },
  { feature: 'LOD Generation', other: 'Manuel', luneo: '✅ 4 niveaux automatiques' },
  { feature: 'Deploy Targets', other: 'Web uniquement', luneo: '✅ Web, AR, VR, Gaming Engines' },
  { feature: 'CDN', other: 'Basique', luneo: '✅ Multi-CDN Edge (Cloudflare + Vercel)' },
  { feature: 'Prix (1000 assets)', other: 'Custom quote', luneo: '✅ $79/mois (transparent)' },
];

export function AssetHubComparison() {
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
            Pourquoi Choisir Luneo ?
          </h2>
          <p className="text-xl text-gray-300">
            Comparaison avec les solutions traditionnelles
          </p>
        </motion.div>

        <Card className="bg-gray-900/50 border-blue-500/20 p-8 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="pb-4 text-gray-400 font-semibold">Feature</th>
                <th className="pb-4 text-gray-400 font-semibold">Zakeke DAM</th>
                <th className="pb-4 text-blue-400 font-semibold">Luneo Asset Hub</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {ROWS.map((row) => (
                <tr key={row.feature} className="border-b border-gray-800">
                  <td className="py-4 text-gray-300">{row.feature}</td>
                  <td className="py-4 text-gray-400">{row.other}</td>
                  <td className="py-4 text-white font-semibold">{row.luneo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </section>
  );
}
