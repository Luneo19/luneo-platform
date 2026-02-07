'use client';

import React from 'react';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { Building2, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { USE_CASES } from './data';

export function UseCasesSection() {
  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gray-950/50">
      <div className="max-w-7xl mx-auto">
        <motion initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full mb-6">
            <Building2 className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium text-green-400">Industries</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Adapté à <span className="bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent">Votre Secteur</span>
          </h2>
        </motion>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {USE_CASES.map((useCase, i) => (
            <motion key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
              <Card className={`h-full bg-gradient-to-br ${useCase.gradient}/10 border-gray-700/50 p-6 hover:border-white/20 transition-all`}>
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${useCase.gradient} flex items-center justify-center text-white flex-shrink-0`}>{useCase.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">{useCase.title}</h3>
                    <p className="text-gray-400 text-sm mb-3">{useCase.description}</p>
                    <p className="text-xs text-gray-400 mb-3">Ex: {useCase.examples}</p>
                    <div className={`inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r ${useCase.gradient} bg-opacity-20 rounded-full`}>
                      <TrendingUp className="w-4 h-4 text-white" />
                      <span className="text-sm font-semibold text-white">{useCase.metrics}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion>
          ))}
        </div>
      </div>
    </section>
  );
}
