'use client';

import React from 'react';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { Sparkles } from 'lucide-react';
import { Demo3DViewer } from './Demo3DViewer';

export function DemoSection() {
  return (
    <section id="demo-3d" className="dark-section relative noise-overlay py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 gradient-mesh-purple" />
      <div className="relative max-w-7xl mx-auto z-10">
        <motion initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-purple-400">Démo Interactive</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white mb-4 italic">
            <span className="text-gradient-purple">Configurez en Temps Réel</span>
          </h2>
          <p className="text-slate-300 max-w-2xl mx-auto">Testez notre configurateur 3D. Changez matériaux, couleurs, gravure et dimensions.</p>
        </motion>
        <motion initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <Demo3DViewer />
        </motion>
      </div>
    </section>
  );
}
