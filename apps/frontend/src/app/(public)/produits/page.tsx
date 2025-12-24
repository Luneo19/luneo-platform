'use client';

import React, { useMemo, memo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Palette, 
  Box, 
  Camera, 
  Sparkles, 
  ArrowRight,
  Zap,
  CheckCircle,
  Code,
  Globe,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const products = [
  {
    id: 'customizer',
    title: 'Visual Customizer',
    description: 'Éditeur visuel puissant pour personnaliser vos produits en temps réel',
    icon: <Palette className="w-8 h-8" />,
    href: '/solutions/customizer',
    color: 'from-purple-500 to-pink-500',
    features: ['Layers illimités', 'Upload images', 'Texte personnalisable', 'Export PNG/SVG'],
    badge: 'Populaire',
  },
  {
    id: 'configurator-3d',
    title: 'Configurateur 3D',
    description: 'Visualisation 3D photoréaliste de vos produits avec Three.js',
    icon: <Box className="w-8 h-8" />,
    href: '/solutions/configurator-3d',
    color: 'from-blue-500 to-purple-500',
    features: ['Rendu haute qualité', 'Variantes matériaux', 'Export AR', 'Performance optimisée'],
    badge: 'Pro',
  },
  {
    id: 'virtual-try-on',
    title: 'Virtual Try-On',
    description: 'Essayage virtuel en temps réel avec MediaPipe et réalité augmentée',
    icon: <Camera className="w-8 h-8" />,
    href: '/solutions/virtual-try-on',
    color: 'from-cyan-500 to-blue-500',
    features: ['Tracking visage', 'Essayage AR', 'Mobile & Web', 'Temps réel'],
    badge: 'Innovant',
  },
  {
    id: 'ai-design-hub',
    title: 'AI Design Hub',
    description: 'Générez des milliers de designs avec l\'IA DALL-E 3 en quelques minutes',
    icon: <Sparkles className="w-8 h-8" />,
    href: '/solutions/ai-design-hub',
    color: 'from-pink-500 to-purple-500',
    features: ['Génération IA', 'Bulk generation', 'Variantes automatiques', 'Export print-ready'],
    badge: 'Nouveau',
  },
];

function ProductsHubPageContent() {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero */}
      <section className="relative overflow-hidden py-20 sm:py-24 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 md:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 px-4 py-2 rounded-full mb-6">
              <Zap className="w-5 h-5" />
              <span className="text-sm font-semibold">Nos Produits</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">
              Tous Nos Produits
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                En Un Seul Endroit
              </span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-300 max-w-3xl mx-auto mb-8">
              Découvrez notre suite complète d'outils pour transformer votre e-commerce
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                  Essayer gratuitement
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/solutions">
                <Button size="lg" variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
                  Voir toutes les solutions
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {products.map((product, idx) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Link href={product.href}>
                <Card className="h-full p-8 bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-all cursor-pointer group">
                  <div className="flex items-start justify-between mb-6">
                    <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${product.color} flex items-center justify-center text-white group-hover:scale-110 transition-transform`}>
                      {product.icon}
                    </div>
                    {product.badge && (
                      <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded-full">
                        {product.badge}
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
                    {product.title}
                  </h3>
                  <p className="text-gray-400 mb-6 text-lg">
                    {product.description}
                  </p>
                  
                  <div className="space-y-2 mb-6">
                    {product.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-gray-300">
                        <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex items-center text-blue-400 font-medium group-hover:text-blue-300 transition-colors">
                    Découvrir {product.title}
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Comparison Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Quelle est la différence entre "Produits" et "Solutions" ?
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Nos produits sont les outils techniques. Nos solutions sont des packages complets pour votre industrie.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="p-8 bg-gray-800/50 border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <Code className="w-8 h-8 text-blue-400" />
              <h3 className="text-2xl font-bold text-white">Produits</h3>
            </div>
            <p className="text-gray-400 mb-4">
              Nos produits sont des outils techniques individuels que vous pouvez intégrer dans votre workflow :
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-gray-300">
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <span>Visual Customizer - Éditeur de personnalisation</span>
              </li>
              <li className="flex items-start gap-2 text-gray-300">
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <span>Configurateur 3D - Visualisation produits</span>
              </li>
              <li className="flex items-start gap-2 text-gray-300">
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <span>Virtual Try-On - Essayage virtuel</span>
              </li>
              <li className="flex items-start gap-2 text-gray-300">
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <span>AI Design Hub - Génération IA</span>
              </li>
            </ul>
            <Link href="/produits" className="inline-block mt-6">
              <Button variant="outline" className="border-blue-500/50 hover:bg-blue-500/10">
                Voir tous les produits
              </Button>
            </Link>
          </Card>
          
          <Card className="p-8 bg-gray-800/50 border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="w-8 h-8 text-purple-400" />
              <h3 className="text-2xl font-bold text-white">Solutions</h3>
            </div>
            <p className="text-gray-400 mb-4">
              Nos solutions sont des packages complets adaptés à votre industrie et vos besoins :
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-gray-300">
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <span>E-commerce - Package complet pour boutiques</span>
              </li>
              <li className="flex items-start gap-2 text-gray-300">
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <span>Marketing - Campagnes automatisées</span>
              </li>
              <li className="flex items-start gap-2 text-gray-300">
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <span>Branding - Brand kit complet</span>
              </li>
              <li className="flex items-start gap-2 text-gray-300">
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <span>Industries - Solutions par secteur</span>
              </li>
            </ul>
            <Link href="/solutions" className="inline-block mt-6">
              <Button variant="outline" className="border-purple-500/50 hover:bg-purple-500/10">
                Voir toutes les solutions
              </Button>
            </Link>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-16">
        <Card className="p-8 md:p-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Prêt à transformer votre e-commerce ?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Commencez gratuitement et découvrez comment nos produits peuvent booster votre business
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-50">
                Commencer gratuitement
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10">
                Réserver une démo
              </Button>
            </Link>
          </div>
        </Card>
      </section>
    </div>
  );
}

const ProductsHubPageMemo = memo(ProductsHubPageContent);

export default function ProductsHubPage() {
  return (
    <ErrorBoundary level="page" componentName="ProductsHubPage">
      <ProductsHubPageMemo />
    </ErrorBoundary>
  );
}






















