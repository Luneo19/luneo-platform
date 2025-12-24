'use client';

import React, { memo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';

function GalleryPageContent() {
  const designs = Array(12).fill(null).map((_, i) => ({
    id: i + 1,
    emoji: ['🎨', '👕', '☕', '📱', '🎒', '🕶️', '⌚', '💼', '🧢', '👟', '🎧', '📷'][i],
    title: `Design ${i + 1}`
  }));

  return (
    <div className="min-h-screen bg-gray-900 py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Galerie</h1>
          <p className="text-xl text-gray-400">Designs créés avec Luneo</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {designs.map((design, i) => (
            <motion.div key={design.id} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} viewport={{ once: true }}>
              <Card className="aspect-square bg-gray-800/50 border-gray-700 hover:border-purple-500/50 transition-all flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-2">{design.emoji}</div>
                  <p className="text-sm text-gray-400">{design.title}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

const GalleryPageMemo = memo(GalleryPageContent);

export default function GalleryPage() {
  return (
    <ErrorBoundary componentName="GalleryPage">
      <GalleryPageMemo />
    </ErrorBoundary>
  );
}
