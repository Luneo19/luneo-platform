'use client';

import React from 'react';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { Cpu } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { TECH_SPECS } from './data';

export function TechSpecsSection() {
  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full mb-6">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-medium text-cyan-400">Spécifications</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Performance <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Professionnelle</span>
          </h2>
        </motion>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TECH_SPECS.map((section, i) => (
            <motion key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
              <Card className="h-full bg-gray-800/30 border-gray-700/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400">{section.icon}</div>
                  <h3 className="text-xl font-bold text-white">{section.category}</h3>
                </div>
                <div className="space-y-3">
                  {section.specs.map((spec, j) => (
                    <div key={j} className="flex justify-between items-start gap-2 text-sm">
                      <span className="text-gray-400">{spec.name}</span>
                      <span className="text-white font-medium text-right">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </motion>
          ))}
        </div>
      </div>
    </section>
  );
}
