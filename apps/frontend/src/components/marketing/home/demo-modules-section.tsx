'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { Camera, Box, Sparkles, BarChart3, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ============================================================================
// TYPES STRICTS POUR MODULES DE DÉMO
// ============================================================================

/**
 * Module de démo avec typage strict
 */
interface DemoModule {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: 'cyan' | 'purple' | 'pink' | 'indigo' | 'green';
  badge: string;
  features: string[];
}

/**
 * Classes de couleurs pour modules avec typage strict
 */
interface ColorClasses {
  bg: string;
  hover: string;
  text: string;
  border: string;
  gradient: string;
}

const colorClasses: Record<DemoModule['color'], ColorClasses> = {
  cyan: {
    bg: 'bg-cyan-100',
    hover: 'bg-gradient-to-br from-cyan-600 to-blue-600',
    text: 'text-cyan-600',
    border: 'border-cyan-500/20 hover:border-cyan-500/50',
    gradient: 'from-cyan-600 to-blue-600',
  },
  purple: {
    bg: 'bg-purple-100',
    hover: 'bg-gradient-to-br from-purple-600 to-pink-600',
    text: 'text-purple-600',
    border: 'border-purple-500/20 hover:border-purple-500/50',
    gradient: 'from-purple-600 to-pink-600',
  },
  pink: {
    bg: 'bg-pink-100',
    hover: 'bg-gradient-to-br from-pink-600 to-rose-600',
    text: 'text-pink-600',
    border: 'border-pink-500/20 hover:border-pink-500/50',
    gradient: 'from-pink-600 to-rose-600',
  },
  indigo: {
    bg: 'bg-indigo-100',
    hover: 'bg-gradient-to-br from-indigo-600 to-purple-600',
    text: 'text-indigo-600',
    border: 'border-indigo-500/20 hover:border-indigo-500/50',
    gradient: 'from-indigo-600 to-purple-600',
  },
  green: {
    bg: 'bg-green-100',
    hover: 'bg-gradient-to-br from-green-600 to-emerald-600',
    text: 'text-green-600',
    border: 'border-green-500/20 hover:border-green-500/50',
    gradient: 'from-green-600 to-emerald-600',
  },
};

/**
 * Modules de démo disponibles
 */
const demoModules: DemoModule[] = [
  {
    id: 'virtual-try-on',
    title: 'Virtual Try-On',
    description: 'Essayage virtuel en temps réel avec MediaPipe Face Mesh et AR pour mobile et web',
    icon: <Camera className="w-6 h-6" />,
    href: '/demo/virtual-try-on',
    color: 'cyan',
    badge: 'AR + MediaPipe',
    features: ['Tracking facial temps réel', 'AR WebXR', 'Export USDZ/GLB', 'Mobile & Desktop'],
  },
  {
    id: '3d-configurator',
    title: '3D Configurator',
    description: 'Configurateur 3D photoréaliste avec matériaux PBR, éclairage avancé et rendu haute qualité',
    icon: <Box className="w-6 h-6" />,
    href: '/demo/3d-configurator',
    color: 'purple',
    badge: 'Three.js + WebGL',
    features: ['Rendu PBR', 'Matériaux personnalisables', 'Export haute qualité', 'Performance optimisée'],
  },
  {
    id: 'ai-agents',
    title: 'AI Agents',
    description: 'Agents IA intelligents (Luna, Aria, Nova) pour BI, personnalisation et support automatique',
    icon: <Sparkles className="w-6 h-6" />,
    href: '/demo/ai-agents',
    color: 'pink',
    badge: 'GPT-4 + Claude 3.5',
    features: ['Luna (B2B BI)', 'Aria (B2C Créatif)', 'Nova (Support)', 'RAG + Memory'],
  },
  {
    id: 'smart-analytics',
    title: 'Smart Analytics',
    description: 'Analytics avancés avec prédictions, funnels, cohortes et recommandations IA',
    icon: <BarChart3 className="w-6 h-6" />,
    href: '/demo/analytics',
    color: 'indigo',
    badge: 'BI + ML',
    features: ['Funnels & Cohortes', 'Prédictions IA', 'Anomalies détectées', 'Recommandations'],
  },
  {
    id: 'ar-experience',
    title: 'AR Experience',
    description: 'Expériences AR immersives avec WebXR, tracking main/corps et intégration e-commerce',
    icon: <Wand2 className="w-6 h-6" />,
    href: '/demo/ar-experience',
    color: 'green',
    badge: 'WebXR + MediaPipe',
    features: ['Hand Tracking', 'Pose Detection', 'WebXR natif', 'Intégration Shopify'],
  },
];

/**
 * Section Modules de Démo - Affiche les 5 modules principaux
 * Conforme au plan PROJET 2 - Homepage UI/UX
 */
function DemoModulesSectionContent() {
  return (
    <section id="demo-modules" className="py-24 sm:py-32 bg-white relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16" data-animate="fade-up">
          <span className="inline-block px-3.5 py-1.5 bg-indigo-100 text-indigo-600 text-xs font-semibold rounded-full mb-4 uppercase tracking-wider">
            Modules de Démo
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-gray-900">
            Explorez nos{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              fonctionnalités
            </span>
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            Découvrez nos 5 modules principaux avec des démos interactives. Testez en direct sans créer de compte.
          </p>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {demoModules.map((module, index) => {
            const colors = colorClasses[module.color];
            return (
              <div
                key={module.id}
                className="group bg-white rounded-2xl border border-gray-100 p-8 transition-all hover:-translate-y-2 hover:shadow-xl hover:border-transparent"
                data-animate="fade-up"
                data-delay={index * 100}
              >
                {/* Icon & Badge */}
                <div className="flex items-start justify-between mb-5">
                  <div
                    className={`w-14 h-14 ${colors.bg} ${colors.text} rounded-xl flex items-center justify-center transition-all group-hover:${colors.hover} group-hover:text-white`}
                  >
                    {module.icon}
                  </div>
                  <span
                    className={`px-2.5 py-1 bg-gradient-to-r ${colors.gradient} text-white text-xs font-semibold rounded-full`}
                  >
                    {module.badge}
                  </span>
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-gray-900 mb-2">{module.title}</h3>
                <p className="text-gray-600 leading-relaxed mb-4">{module.description}</p>

                {/* Features */}
                <ul className="space-y-2 mb-6">
                  {module.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-500">
                      <span className={`w-1.5 h-1.5 rounded-full ${colors.bg}`} />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link href={module.href}>
                  <Button
                    variant="outline"
                    className={`w-full border-2 ${colors.border} ${colors.text} hover:${colors.hover} hover:text-white transition-all`}
                  >
                    Tester la démo
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>

        {/* CTA Global */}
        <div className="text-center" data-animate="fade-up" data-delay="500">
          <Link href="/demo">
            <Button
              size="lg"
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-6 text-base font-semibold shadow-lg shadow-indigo-500/50"
            >
              Voir toutes les démos
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

const DemoModulesSectionContentMemo = memo(DemoModulesSectionContent);

/**
 * Section Modules de Démo - Export avec memoization
 */
export function DemoModulesSection() {
  return <DemoModulesSectionContentMemo />;
}
