'use client';

import React, { useMemo } from 'react';
import { Palette, Box, Camera, Sparkles, Store, Megaphone, Share2, Briefcase } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PageHero, SectionHeader, FeatureCard } from '@/components/marketing/shared';

function SolutionsHubPageContent() {
  const solutions = useMemo(() => [
    { 
      title: 'Virtual Try-On', 
      description: 'Essayage virtuel en temps réel avec MediaPipe et réalité augmentée pour une expérience client immersive', 
      icon: <Camera className="w-6 h-6" />, 
      href: '/solutions/virtual-try-on', 
      color: 'cyan' as const
    },
    { 
      title: 'Configurator 3D', 
      description: 'Visualisation 3D photoréaliste de vos produits avec Three.js et rendu haute qualité', 
      icon: <Box className="w-6 h-6" />, 
      href: '/solutions/configurator-3d', 
      color: 'blue' as const
    },
    { 
      title: 'Visual Customizer', 
      description: 'Éditeur visuel puissant avec Konva.js pour personnaliser vos produits en temps réel', 
      icon: <Palette className="w-6 h-6" />, 
      href: '/solutions/customizer', 
      color: 'purple' as const
    },
    { 
      title: '3D Asset Hub', 
      description: 'Gestion professionnelle de vos assets 3D avec bibliothèque centralisée et optimisée', 
      icon: <Sparkles className="w-6 h-6" />, 
      href: '/solutions/3d-asset-hub', 
      color: 'green' as const
    },
    { 
      title: 'AI Design Hub', 
      description: 'Générez des milliers de designs avec l\'IA DALL-E 3 en quelques minutes', 
      icon: <Sparkles className="w-6 h-6" />, 
      href: '/solutions/ai-design-hub', 
      color: 'pink' as const
    },
    { 
      title: 'Branding', 
      description: 'Brand kit complet pour maintenir la cohérence visuelle de votre marque', 
      icon: <Briefcase className="w-6 h-6" />, 
      href: '/solutions/branding', 
      color: 'indigo' as const
    },
    { 
      title: 'E-commerce', 
      description: 'Intégrations natives avec Shopify, WooCommerce et autres plateformes', 
      icon: <Store className="w-6 h-6" />, 
      href: '/solutions/ecommerce', 
      color: 'green' as const
    },
    { 
      title: 'Marketing', 
      description: 'Campagnes marketing automatisées avec génération de visuels en masse', 
      icon: <Megaphone className="w-6 h-6" />, 
      href: '/solutions/marketing', 
      color: 'orange' as const
    },
    { 
      title: 'Social Media', 
      description: 'Gestion et création de contenu pour tous vos réseaux sociaux', 
      icon: <Share2 className="w-6 h-6" />, 
      href: '/solutions/social', 
      color: 'pink' as const
    },
  ], []);

  return (
    <>
      <PageHero
        title="Nos Solutions"
        description="9 solutions professionnelles pour transformer votre business e-commerce et offrir des expériences de personnalisation exceptionnelles"
        badge="Solutions"
        gradient="from-indigo-600 via-purple-600 to-pink-600"
      />

      <section className="py-24 sm:py-32 bg-gray-50 relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="Choisissez la solution adaptée à vos besoins"
            description="Chaque solution est conçue pour répondre à des besoins spécifiques et s'intègre parfaitement dans votre workflow"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {solutions.map((solution, index) => (
              <FeatureCard
                key={solution.title}
                icon={solution.icon}
                title={solution.title}
                description={solution.description}
                href={solution.href}
                color={solution.color}
                delay={index * 100}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export default function SolutionsHubPage() {
  return (
    <ErrorBoundary level="page" componentName="SolutionsHubPage">
      <SolutionsHubPageContent />
    </ErrorBoundary>
  );
}
