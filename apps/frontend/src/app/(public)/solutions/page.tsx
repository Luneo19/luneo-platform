'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { Palette, Box, Camera, Sparkles, Store, Megaphone, Share2, Briefcase, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function SolutionsHubPageContent() {
  const solutions = useMemo(() => [
    { title: 'Virtual Try-On', desc: 'AR essayage réaliste', icon: <Camera className="w-8 h-8" />, href: '/solutions/virtual-try-on', color: 'from-cyan-500 to-blue-500' },
    { title: 'Configurator 3D', desc: 'Three.js photo-réaliste', icon: <Box className="w-8 h-8" />, href: '/solutions/configurator-3d', color: 'from-blue-500 to-purple-500' },
    { title: 'Visual Customizer', desc: 'Éditeur visuel Konva.js', icon: <Palette className="w-8 h-8" />, href: '/solutions/customizer', color: 'from-purple-500 to-pink-500' },
    { title: '3D Asset Hub', desc: 'Gestion assets 3D pro', icon: <Sparkles className="w-8 h-8" />, href: '/solutions/3d-asset-hub', color: 'from-green-500 to-teal-500' },
    { title: 'AI Design Hub', desc: 'DALL-E 3 génération', icon: <Sparkles className="w-8 h-8" />, href: '/solutions/ai-design-hub', color: 'from-pink-500 to-purple-500' },
    { title: 'Branding', desc: 'Brand kit complet', icon: <Briefcase className="w-8 h-8" />, href: '/solutions/branding', color: 'from-indigo-500 to-purple-500' },
    { title: 'E-commerce', desc: 'Intégrations natives', icon: <Store className="w-8 h-8" />, href: '/solutions/ecommerce', color: 'from-green-500 to-teal-500' },
    { title: 'Marketing', desc: 'Campagnes automatisées', icon: <Megaphone className="w-8 h-8" />, href: '/solutions/marketing', color: 'from-rose-500 to-pink-500' },
    { title: 'Social Media', desc: 'Gestion réseaux sociaux', icon: <Share2 className="w-8 h-8" />, href: '/solutions/social', color: 'from-violet-500 to-fuchsia-500' },
  ], []);

  return (
    <div className="min-h-screen bg-gray-900">
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 py-20 px-4">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,black,transparent)]" />
        </div>

        <div className="relative max-w-7xl mx-auto text-center">
          <motion initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">
              Nos Solutions
              <br />
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Pour Chaque Besoin
              </span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              9 solutions professionnelles pour transformer votre business e-commerce
            </p>
          </motion>
        </div>
      </section>

      <section className="py-20 px-4 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {solutions.map((solution, i) => (
              <Link key={i} href={solution.href}>
                <Card className="p-6 bg-gray-800/50 border-gray-700 hover:border-purple-500/50 transition-all h-full group">
                  <div className={`w-16 h-16 bg-gradient-to-br ${solution.color} rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                    {solution.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">{solution.title}</h3>
                  <p className="text-gray-400 mb-4">{solution.desc}</p>
                  <div className="flex items-center text-purple-400">
                    <span className="text-sm">En savoir plus</span>
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default function SolutionsHubPage() {
  return (
    <ErrorBoundary level="page" componentName="SolutionsHubPage">
      <SolutionsHubPageContent />
    </ErrorBoundary>
  );
}
