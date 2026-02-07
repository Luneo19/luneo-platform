'use client';

import React from 'react';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { Award, Check, X } from 'lucide-react';
import { COMPARISON_FEATURES } from './data';

export function ComparisonSection() {
  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gray-950/50">
      <div className="max-w-5xl mx-auto">
        <motion initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full mb-6">
            <Award className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-medium text-orange-400">Comparatif</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Pourquoi Choisir <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Luneo</span> ?
          </h2>
        </motion>
        <motion initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="py-4 px-4 text-left text-sm font-semibold text-gray-400">Feature</th>
                <th className="py-4 px-4 text-center text-sm font-semibold text-blue-400 bg-blue-500/10 rounded-t-lg">Luneo</th>
                <th className="py-4 px-4 text-center text-sm font-semibold text-gray-400">Zakeke</th>
                <th className="py-4 px-4 text-center text-sm font-semibold text-gray-400">Threekit</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_FEATURES.map((feature, i) => (
                <tr key={i} className="border-b border-gray-700/50">
                  <td className="py-3 px-4 text-sm text-gray-300">{feature.name}</td>
                  <td className="py-3 px-4 text-center bg-blue-500/5">
                    {typeof feature.luneo === 'boolean' ? (feature.luneo ? <Check className="w-5 h-5 text-green-400 mx-auto" /> : <X className="w-5 h-5 text-red-400 mx-auto" />) : <span className="text-white font-medium">{String(feature.luneo)}</span>}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {typeof feature.zakeke === 'boolean' ? (feature.zakeke ? <Check className="w-5 h-5 text-green-400 mx-auto" /> : <X className="w-5 h-5 text-gray-400 mx-auto" />) : <span className="text-gray-400 text-sm">{String(feature.zakeke)}</span>}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {typeof feature.threekit === 'boolean' ? (feature.threekit ? <Check className="w-5 h-5 text-green-400 mx-auto" /> : <X className="w-5 h-5 text-gray-400 mx-auto" />) : <span className="text-gray-400 text-sm">{String(feature.threekit)}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion>
      </div>
    </section>
  );
}
