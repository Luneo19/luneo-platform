'use client';

import React, { memo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Quote } from 'lucide-react';
import { ScrollReveal } from '@/components/marketing/shared/scroll-reveal';

const testimonials = [
  { name: 'Jean D.', role: 'CEO, Fashion Brand', text: 'Luneo a transformé notre e-commerce. +45% de conversion avec l\'AR.' },
  { name: 'Marie L.', role: 'Designer', text: 'L\'AI generation me fait gagner 10h/semaine. Incroyable.' },
  { name: 'Pierre M.', role: 'CTO, Print Company', text: 'API super simple, SDK React top. Intégration en 2h.' },
];

function TestimonialsPageContent() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <section className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Quote className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-5xl font-bold mb-4">Ce qu'en disent nos clients</h1>
        </div>
      </section>
      <section className="dark-section relative noise-overlay max-w-7xl mx-auto px-4 py-20">
        <div className="absolute inset-0 gradient-mesh-purple" />
        <div className="relative z-10">
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, idx) => (
              <ScrollReveal key={idx} delay={idx * 100}>
                <div className="bg-dark-card/60 backdrop-blur-sm border border-white/[0.04] rounded-xl p-8 hover:-translate-y-1 transition-all">
                  <Quote className="w-8 h-8 text-purple-400 mb-4" />
                  <p className="text-slate-300 mb-4 italic">"{t.text}"</p>
                  <div>
                    <p className="font-bold text-white">{t.name}</p>
                    <p className="text-sm text-slate-400">{t.role}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

const TestimonialsPageMemo = memo(TestimonialsPageContent);

export default function TestimonialsPage() {
  return (
    <ErrorBoundary componentName="TestimonialsPage">
      <TestimonialsPageMemo />
    </ErrorBoundary>
  );
}

