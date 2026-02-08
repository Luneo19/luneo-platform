'use client';

import React from 'react';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { Sparkles } from 'lucide-react';
import { Demo3DViewer } from './Demo3DViewer';

export function DemoSection() {
  return (
    <section id="demo-3d" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <motion initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-400">Démo Interactive</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Configurez en <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Temps Réel</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">Testez notre configurateur 3D. Changez matériaux, couleurs, gravure et dimensions.</p>
        </motion>
        <motion initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <Demo3DViewer />
        </motion>
      </div>
    </section>
  );
}
