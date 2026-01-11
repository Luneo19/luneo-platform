'use client';

import React, { useMemo, memo } from 'react';
import { 
  Palette, 
  Box, 
  Camera, 
  Sparkles, 
} from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PageHero, SectionHeader, FeatureCard } from '@/components/marketing/shared';
import { CTASectionNew } from '@/components/marketing/home';

const products = [
  {
    id: 'customizer',
    title: 'Visual Customizer',
    description: 'Éditeur visuel puissant pour personnaliser vos produits en temps réel avec des layers illimités et export PNG/SVG',
    icon: <Palette className="w-6 h-6" />,
    href: '/solutions/customizer',
    color: 'purple' as const,
    badge: 'Populaire',
  },
  {
    id: 'configurator-3d',
    title: 'Configurateur 3D',
    description: 'Visualisation 3D photoréaliste de vos produits avec Three.js, rendu haute qualité et export AR',
    icon: <Box className="w-6 h-6" />,
    href: '/solutions/configurator-3d',
    color: 'blue' as const,
    badge: 'Pro',
  },
  {
    id: 'virtual-try-on',
    title: 'Virtual Try-On',
    description: 'Essayage virtuel en temps réel avec MediaPipe et réalité augmentée pour mobile et web',
    icon: <Camera className="w-6 h-6" />,
    href: '/solutions/virtual-try-on',
    color: 'cyan' as const,
    badge: 'Innovant',
  },
  {
    id: 'ai-design-hub',
    title: 'AI Design Hub',
    description: 'Générez des milliers de designs avec l\'IA DALL-E 3 en quelques minutes avec variantes automatiques',
    icon: <Sparkles className="w-6 h-6" />,
    href: '/solutions/ai-design-hub',
    color: 'pink' as const,
    badge: 'Nouveau',
  },
];

function ProductsHubPageContent() {
  return (
    <>
      <PageHero
        title="Nos Produits"
        description="Découvrez notre suite complète d'outils pour transformer votre e-commerce et offrir des expériences de personnalisation exceptionnelles"
        badge="Produits"
        gradient="from-blue-600 via-purple-600 to-pink-600"
        cta={{
          label: 'Essayer gratuitement',
          href: '/register'
        }}
      />

      <section className="py-24 sm:py-32 bg-gray-50 relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="Tous nos produits en un seul endroit"
            description="Une suite complète d'outils pour créer, personnaliser et vendre vos produits avec une expérience client exceptionnelle"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {products.map((product, index) => (
              <FeatureCard
                key={product.id}
                icon={product.icon}
                title={product.title}
                description={product.description}
                href={product.href}
                color={product.color}
                badge={product.badge}
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

const ProductsHubPageMemo = memo(ProductsHubPageContent);

export default function ProductsHubPage() {
  return (
    <ErrorBoundary level="page" componentName="ProductsHubPage">
      <ProductsHubPageMemo />
    </ErrorBoundary>
  );
}
