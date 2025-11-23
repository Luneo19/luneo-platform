'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, Camera, Box, Layers, Code, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DemoHubPage() {
  const demos = [
    {
      title: 'Virtual Try-On',
      description: 'Essayage AR en temps réel avec tracking facial',
      icon: <Camera className="w-8 h-8" />,
      href: '/demo/virtual-try-on',
      color: 'from-cyan-500 to-blue-500',
      badge: 'MediaPipe + Three.js'
    },
    {
      title: '3D Configurator',
      description: 'Configurateur 3D interactif avec PBR materials',
      icon: <Box className="w-8 h-8" />,
      href: '/demo/3d-configurator',
      color: 'from-purple-500 to-pink-500',
      badge: 'Three.js + WebGL'
    },
    {
      title: 'Bulk Generation',
      description: 'Génération IA massive avec DALL-E 3',
      icon: <Layers className="w-8 h-8" />,
      href: '/demo/bulk-generation',
      color: 'from-orange-500 to-red-500',
      badge: 'BullMQ + Redis'
    },
    {
      title: 'AR Export',
      description: 'Export AR pour iOS/Android/WebXR',
      icon: <Eye className="w-8 h-8" />,
      href: '/demo/ar-export',
      color: 'from-green-500 to-teal-500',
      badge: 'USDZ + GLB'
    },
    {
      title: 'Code Playground',
      description: 'Testez notre SDK en direct',
      icon: <Code className="w-8 h-8" />,
      href: '/demo/playground',
      color: 'from-indigo-500 to-purple-500',
      badge: 'Live Code'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 py-20 px-4">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,black,transparent)]" />
        </div>

        <div className="relative max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
              Démos Interactives
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Testez Luneo en Direct
              </span>
            </h1>

            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Explorez nos fonctionnalités avec des démos interactives. Virtual Try-On, 3D, IA, AR - tout en live !
            </p>
          </motion.div>
        </div>
      </section>

      {/* Demos Grid */}
      <section className="py-20 px-4 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {demos.map((demo, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <Link href={demo.href}>
                  <Card className="p-6 bg-gray-800/50 border-gray-700 hover:border-blue-500/50 transition-all h-full group cursor-pointer">
                    <div className={`w-16 h-16 bg-gradient-to-br ${demo.color} rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                      {demo.icon}
                    </div>
                    
                    <div className="mb-3">
                      <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full">
                        {demo.badge}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                      {demo.title}
                    </h3>
                    
                    <p className="text-gray-400 mb-4">
                      {demo.description}
                    </p>

                    <div className="flex items-center text-blue-400 group-hover:text-blue-300 transition-colors">
                      <span className="text-sm font-medium">Essayer maintenant</span>
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gray-800/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Prêt à intégrer Luneo ?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Commencez gratuitement en 5 minutes
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 h-12 text-lg">
                Commencer gratuitement
              </Button>
            </Link>
            <Link href="/help/documentation">
              <Button variant="outline" className="border-gray-600 text-white hover:bg-gray-700 h-12 px-8 text-lg">
                Documentation
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
