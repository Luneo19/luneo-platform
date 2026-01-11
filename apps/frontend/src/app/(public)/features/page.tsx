'use client';

import React, { memo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Palette, Box, Camera, Sparkles, Zap, Shield } from 'lucide-react';
import { PageHero, SectionHeader, FeatureCard } from '@/components/marketing/shared';
import { CTASectionNew } from '@/components/marketing/home';

function FeaturesPageContent() {
  const features = [
    { 
      icon: <Palette className="w-6 h-6" />, 
      title: 'Customizer 2D', 
      description: 'Éditeur visuel puissant avec Konva.js pour personnaliser vos produits en temps réel avec des layers illimités',
      color: 'blue' as const
    },
    { 
      icon: <Box className="w-6 h-6" />, 
      title: 'Configurator 3D', 
      description: 'Visualisation 3D photoréaliste avec Three.js et matériaux PBR pour un rendu de qualité professionnelle',
      color: 'purple' as const
    },
    { 
      icon: <Camera className="w-6 h-6" />, 
      title: 'Virtual Try-On', 
      description: 'Essayage virtuel en temps réel avec MediaPipe pour une expérience AR immersive sur mobile et web',
      color: 'green' as const
    },
    { 
      icon: <Sparkles className="w-6 h-6" />, 
      title: 'AI Generation', 
      description: 'Génération IA avec DALL-E 3 et bulk generation pour créer des milliers de designs en quelques minutes',
      color: 'orange' as const
    },
    { 
      icon: <Zap className="w-6 h-6" />, 
      title: 'Performance', 
      description: 'Optimisations avancées avec 60 FPS, lazy loading et code splitting pour des performances optimales',
      color: 'cyan' as const
    },
    { 
      icon: <Shield className="w-6 h-6" />, 
      title: 'Security', 
      description: 'Sécurité enterprise avec OAuth, JWT, RBAC et chiffrement de bout en bout pour protéger vos données',
      color: 'indigo' as const
    },
  ];

  return (
    <>
      <PageHero
        title="Fonctionnalités"
        description="Une plateforme complète de personnalisation produits avec tous les outils dont vous avez besoin pour réussir"
        badge="Fonctionnalités"
        gradient="from-blue-600 via-purple-600 to-pink-600"
      />

      <section className="py-24 sm:py-32 bg-gray-50 relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="Tout ce dont vous avez besoin pour réussir"
            description="Des fonctionnalités puissantes conçues pour vous aider à créer, lancer et faire croître vos produits personnalisés"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <FeatureCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                color={feature.color}
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

const MemoizedFeaturesPageContent = memo(FeaturesPageContent);

export default function FeaturesPage() {
  return (
    <ErrorBoundary level="page" componentName="FeaturesPage">
      <MemoizedFeaturesPageContent />
    </ErrorBoundary>
  );
}
