'use client';

import { Card } from '@/components/ui/card';
import { FadeIn, StaggerChildren, StaggerItem } from '@/components/animations';
import { 
  Sparkles, 
  Palette, 
  Box, 
  Zap, 
  Shield, 
  Globe,
  ArrowRight 
} from 'lucide-react';
import Link from 'next/link';

const features = [
  {
    icon: <Sparkles className="w-8 h-8" />,
    title: 'Génération IA',
    description: 'Créez des designs uniques en secondes avec notre moteur IA avancé',
    gradient: 'from-purple-500/20 to-pink-500/20',
    borderColor: 'border-purple-500/20 hover:border-purple-500/50',
  },
  {
    icon: <Palette className="w-8 h-8" />,
    title: 'Éditeur 2D/3D',
    description: 'Éditeur professionnel avec export print-ready (CMYK, PDF/X-4)',
    gradient: 'from-blue-500/20 to-cyan-500/20',
    borderColor: 'border-blue-500/20 hover:border-blue-500/50',
  },
  {
    icon: <Box className="w-8 h-8" />,
    title: 'Virtual Try-On AR',
    description: 'Visualisez vos produits en réalité augmentée directement dans le navigateur',
    gradient: 'from-green-500/20 to-emerald-500/20',
    borderColor: 'border-green-500/20 hover:border-green-500/50',
  },
  {
    icon: <Zap className="w-8 h-8" />,
    title: 'Traitement Ultra-Rapide',
    description: 'Génération en quelques secondes grâce à notre infrastructure optimisée',
    gradient: 'from-orange-500/20 to-red-500/20',
    borderColor: 'border-orange-500/20 hover:border-orange-500/50',
  },
  {
    icon: <Shield className="w-8 h-8" />,
    title: 'Sécurité Enterprise',
    description: 'Vos données sont protégées avec cryptage de niveau bancaire',
    gradient: 'from-indigo-500/20 to-purple-500/20',
    borderColor: 'border-indigo-500/20 hover:border-indigo-500/50',
  },
  {
    icon: <Globe className="w-8 h-8" />,
    title: 'Intégrations Multi-Platesformes',
    description: 'Connectez-vous à Shopify, WooCommerce, Zapier et plus encore',
    gradient: 'from-teal-500/20 to-blue-500/20',
    borderColor: 'border-teal-500/20 hover:border-teal-500/50',
  },
];

/**
 * Features Section - Showcase key features with glassmorphism cards
 */
export function FeaturesSection() {
  return (
    <section className="py-24 sm:py-32 bg-gray-900 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/5 to-transparent" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <FadeIn className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
            Tout ce dont vous avez besoin
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Une plateforme complète pour créer, personnaliser et vendre vos produits personnalisés
          </p>
        </FadeIn>

        {/* Features Grid */}
        <StaggerChildren className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <StaggerItem key={index}>
              <Card 
                className={`bg-gradient-to-br ${feature.gradient} ${feature.borderColor} p-6 sm:p-8 transition-all duration-300 h-full group hover:scale-105`}
              >
                <div className="text-purple-400 mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-300 leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            </StaggerItem>
          ))}
        </StaggerChildren>

        {/* CTA */}
        <FadeIn delay={0.8} className="text-center mt-12">
          <Link 
            href="/features"
            className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 font-semibold transition-colors"
          >
            Découvrir toutes les fonctionnalités
            <ArrowRight className="w-5 h-5" />
          </Link>
        </FadeIn>
      </div>
    </section>
  );
}
