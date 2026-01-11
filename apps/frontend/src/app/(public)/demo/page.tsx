'use client';

import React, { memo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Eye, Camera, Box, Layers, Code } from 'lucide-react';
import { PageHero, SectionHeader, FeatureCard } from '@/components/marketing/shared';
import { CTASectionNew } from '@/components/marketing/home';

function DemoHubPageContent() {
  const demos = [
    {
      title: 'Virtual Try-On',
      description: 'Essayage AR en temps réel avec tracking facial MediaPipe pour une expérience immersive',
      icon: <Camera className="w-6 h-6" />,
      href: '/demo/virtual-try-on',
      color: 'cyan' as const,
      badge: 'MediaPipe + Three.js'
    },
    {
      title: '3D Configurator',
      description: 'Configurateur 3D interactif avec matériaux PBR et rendu haute qualité',
      icon: <Box className="w-6 h-6" />,
      href: '/demo/3d-configurator',
      color: 'purple' as const,
      badge: 'Three.js + WebGL'
    },
    {
      title: 'Bulk Generation',
      description: 'Génération IA massive avec DALL-E 3 pour créer des milliers de designs en quelques minutes',
      icon: <Layers className="w-6 h-6" />,
      href: '/demo/bulk-generation',
      color: 'orange' as const,
      badge: 'BullMQ + Redis'
    },
    {
      title: 'AR Export',
      description: 'Export AR pour iOS, Android et WebXR avec formats USDZ et GLB',
      icon: <Eye className="w-6 h-6" />,
      href: '/demo/ar-export',
      color: 'green' as const,
      badge: 'USDZ + GLB'
    },
    {
      title: 'Code Playground',
      description: 'Testez notre SDK en direct avec un environnement de développement intégré',
      icon: <Code className="w-6 h-6" />,
      href: '/demo/playground',
      color: 'indigo' as const,
      badge: 'Live Code'
    }
  ];

  return (
    <>
      <PageHero
        title="Démos Interactives"
        description="Explorez nos fonctionnalités avec des démos interactives. Virtual Try-On, 3D, IA, AR - tout en live !"
        badge="Démos"
        gradient="from-blue-600 via-purple-600 to-pink-600"
      />

      <section className="py-24 sm:py-32 bg-gray-50 relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="Testez Luneo en direct"
            description="Découvrez nos fonctionnalités avec des démos interactives. Pas besoin de compte pour essayer !"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {demos.map((demo, index) => (
              <FeatureCard
                key={demo.title}
                icon={demo.icon}
                title={demo.title}
                description={demo.description}
                href={demo.href}
                color={demo.color}
                badge={demo.badge}
                delay={index * 100}
              />
            ))}
          </div>
        </div>
      </section>

      <CTASectionNew />
    </>
  );
}

const MemoizedDemoHubPageContent = memo(DemoHubPageContent);

export default function DemoHubPage() {
  return (
    <ErrorBoundary level="page" componentName="DemoHubPage">
      <MemoizedDemoHubPageContent />
    </ErrorBoundary>
  );
}
