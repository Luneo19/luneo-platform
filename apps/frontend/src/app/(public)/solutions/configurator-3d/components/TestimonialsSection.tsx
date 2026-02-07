'use client';

import React from 'react';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { Star } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { Testimonial } from './data';

interface TestimonialsSectionProps {
  testimonials: Testimonial[];
}

export function TestimonialsSection({ testimonials }: TestimonialsSectionProps) {
  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gray-950/50">
      <div className="max-w-7xl mx-auto">
        <motion initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full mb-6">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-sm font-medium text-yellow-400">Témoignages</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ils Utilisent Notre Configurateur</h2>
        </motion>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, i) => (
            <motion key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
              <Card className="h-full bg-gray-800/30 border-gray-700/50 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">{testimonial.avatar}</div>
                  <div>
                    <p className="font-semibold text-white">{testimonial.author}</p>
                    <p className="text-sm text-gray-400">{testimonial.role}, {testimonial.company}</p>
                  </div>
                </div>
                <p className="text-gray-300 text-sm italic mb-4">&quot;{testimonial.quote}&quot;</p>
                <div className="pt-4 border-t border-gray-700/50">
                  <div className="text-2xl font-bold text-blue-400">{testimonial.metric}</div>
                  <div className="text-xs text-gray-400">{testimonial.metricLabel}</div>
                </div>
              </Card>
            </motion>
          ))}
        </div>
      </div>
    </section>
  );
}
