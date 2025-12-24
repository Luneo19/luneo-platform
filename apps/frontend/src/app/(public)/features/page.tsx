'use client';

import React, { memo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Palette, Box, Camera, Sparkles, Zap, Shield } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function FeaturesPageContent() {
  const features = [
    { icon: <Palette className="w-8 h-8" />, title: 'Customizer 2D', desc: 'Éditeur visuel Konva.js', color: 'from-blue-500 to-cyan-500' },
    { icon: <Box className="w-8 h-8" />, title: 'Configurator 3D', desc: 'Three.js + PBR materials', color: 'from-purple-500 to-pink-500' },
    { icon: <Camera className="w-8 h-8" />, title: 'Virtual Try-On', desc: 'AR temps réel MediaPipe', color: 'from-green-500 to-teal-500' },
    { icon: <Sparkles className="w-8 h-8" />, title: 'AI Generation', desc: 'DALL-E 3 + Bulk', color: 'from-orange-500 to-red-500' },
    { icon: <Zap className="w-8 h-8" />, title: 'Performance', desc: '60 FPS, lazy loading', color: 'from-yellow-500 to-orange-500' },
    { icon: <Shield className="w-8 h-8" />, title: 'Security', desc: 'OAuth, JWT, RBAC', color: 'from-indigo-500 to-purple-500' },
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 py-20 px-4">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,black,transparent)]" />
        </div>

        <div className="relative max-w-7xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">
              Features
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Tout ce dont vous avez besoin
              </span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Plateforme complète de personnalisation produits
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-4 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <Card key={i} className="p-6 bg-gray-800/50 border-gray-700">
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center text-white mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-gray-800/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Commencez Maintenant</h2>
          <Link href="/register">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 h-12 text-lg">Essayer gratuitement</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

const MemoizedFeaturesPageContent = memo(FeaturesPageContent);

export default function FeaturesPage() {
  return (
    <ErrorBoundary level="page" componentName="FeaturesPage">
      <MemoizedFeaturesPageContent />
    </ErrorBoundary>
  );
}
