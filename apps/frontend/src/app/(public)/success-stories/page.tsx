'use client';

import React, { memo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function SuccessStoriesPageContent() {
  const stories = [
    {
      company: 'LuxeMode',
      industry: 'Mode & Luxe',
      logo: '👔',
      results: { conversion: '+45%', revenue: '+2.3M€', satisfaction: '98%' },
      quote: "Luneo a transformé notre expérience client. Nos conversions ont explosé.",
      author: 'Marie Dubois, CEO'
    },
    {
      company: 'TechPrint',
      industry: 'Print on Demand',
      logo: '🖨️',
      results: { orders: '+300%', designs: '50K+', time: '-80%' },
      quote: "Avec Luneo AI, nous générons des milliers de designs en quelques heures.",
      author: 'Pierre Martin, Founder'
    },
    {
      company: 'OptiqueStyle',
      industry: 'Lunetterie',
      logo: '🕶️',
      results: { returns: '-65%', engagement: 'x4', sales: '+180%' },
      quote: "Le Virtual Try-On a révolutionné notre boutique en ligne.",
      author: 'Sophie Laurent, Directrice'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-green-900 to-teal-900 py-20 px-4">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,black,transparent)]" />
        </div>

        <div className="relative max-w-7xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">
              Success Stories
              <br />
              <span className="bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent">
                Résultats Prouvés
              </span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Découvrez comment nos clients ont transformé leur business avec Luneo
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-4 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {stories.map((story, i) => (
              <Card key={i} className="p-6 bg-gray-800/50 border-gray-700">
                <div className="text-6xl mb-4">{story.logo}</div>
                <h3 className="text-2xl font-bold text-white mb-2">{story.company}</h3>
                <p className="text-sm text-gray-400 mb-6">{story.industry}</p>
                
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {Object.entries(story.results).map(([key, value], j) => (
                    <div key={j} className="text-center">
                      <div className="text-2xl font-bold text-green-400">{value}</div>
                      <div className="text-xs text-gray-500 capitalize">{key}</div>
                    </div>
                  ))}
                </div>

                <blockquote className="text-gray-300 italic mb-4 border-l-4 border-green-500 pl-4">
                  "{story.quote}"
                </blockquote>
                <p className="text-sm text-gray-400">— {story.author}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-gradient-to-br from-green-900 to-teal-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Rejoignez-les !</h2>
          <Link href="/register">
            <Button className="bg-white text-green-900 hover:bg-gray-100 px-8 h-12 text-lg font-semibold">
              Commencer gratuitement
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

const SuccessStoriesPageMemo = memo(SuccessStoriesPageContent);

export default function SuccessStoriesPage() {
  return (
    <ErrorBoundary componentName="SuccessStoriesPage">
      <SuccessStoriesPageMemo />
    </ErrorBoundary>
  );
}
