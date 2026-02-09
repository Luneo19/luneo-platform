'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import {
  Target,
  Eye,
  Heart,
  Zap,
  Shield,
  Users,
  ArrowRight
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PageHero, SectionHeader, FeatureCard } from '@/components/marketing/shared';
import { CTASectionNew } from '@/components/marketing/home';
import { ScrollReveal } from '@/components/marketing/shared/scroll-reveal';

const values = [
  {
    icon: <Zap className="w-6 h-6" />,
    title: 'Innovation',
    description: 'Toujours à la pointe de la technologie IA, 3D et AR pour offrir les meilleures solutions',
    color: 'orange' as const
  },
  {
    icon: <Heart className="w-6 h-6" />,
    title: 'Simplicité',
    description: 'Des outils puissants, mais intuitifs et accessibles pour tous les niveaux',
    color: 'pink' as const
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: 'Fiabilité',
    description: 'Infrastructure enterprise-grade avec 99.9% uptime SLA pour garantir votre succès',
    color: 'blue' as const
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: 'Support',
    description: 'Accompagnement personnalisé 24/7 pour vous aider à réussir avec Luneo',
    color: 'purple' as const
  }
];

const milestones = [
  { year: '2024', title: 'Lancement', description: 'Création de Luneo et premiers utilisateurs beta' },
  { year: '2024', title: 'IA Générative', description: 'Intégration DALL-E 3 pour génération automatique' },
  { year: '2024', title: '3D & AR', description: 'Lancement configurateur 3D et Virtual Try-On' },
  { year: '2025', title: 'Scale', description: '10 000+ créateurs, 500M+ designs générés' }
];

const team = [
  { name: 'Emmanuel A.', role: 'CEO & Founder', avatar: 'EA', color: 'blue' as const },
  { name: 'Tech Team', role: 'Engineering', avatar: 'TT', color: 'purple' as const },
  { name: 'Design Team', role: 'Product Design', avatar: 'DT', color: 'green' as const }
];

function AboutPageContent() {
  return (
    <>
      <PageHero
        title="Notre Mission"
        description="Démocratiser la création de designs professionnels grâce à l'IA et rendre la personnalisation produit accessible à tous"
        badge="À propos"
        gradient="from-blue-600 via-purple-600 to-pink-600"
      />

      {/* Mission & Vision */}
      <section className="dark-section relative noise-overlay py-24 sm:py-32">
        <div className="absolute inset-0 gradient-mesh-purple" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ScrollReveal>
              <Card className="p-8 bg-dark-card/60 backdrop-blur-sm border border-white/[0.04]" data-animate="fade-right">
                <Target className="w-16 h-16 mb-6 text-purple-400" />
                <h2 className="text-3xl font-bold mb-4 text-white">Notre Mission</h2>
                <p className="text-slate-300 leading-relaxed">
                    Transformer le workflow créatif des marques en combinant l'intelligence artificielle, la visualisation 3D et la réalité augmentée. Nous permettons à chaque entrepreneur de créer des expériences produits dignes des plus grandes marques.
                  </p>
                </Card>
            </ScrollReveal>

            <ScrollReveal>
              <Card className="p-8 bg-dark-card/60 backdrop-blur-sm border border-white/[0.04]" data-animate="fade-left">
                <Eye className="w-16 h-16 mb-6 text-purple-400" />
                <h2 className="text-3xl font-bold mb-4 text-white">Notre Vision</h2>
                <p className="text-slate-300 leading-relaxed">
                    Un monde où chaque produit peut être personnalisé instantanément, visualisé en 3D photoréaliste, essayé en réalité augmentée, et commandé avec des fichiers print-ready automatiques. Zero friction. 100% automation.
                  </p>
                </Card>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="dark-section relative noise-overlay py-24 sm:py-32">
        <div className="absolute inset-0 gradient-mesh-purple" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <SectionHeader
            title="Nos Valeurs"
            description="Ce qui guide notre travail au quotidien"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <FeatureCard
                key={value.title}
                icon={value.icon}
                title={value.title}
                description={value.description}
                color={value.color}
                delay={index * 100}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="dark-section relative noise-overlay py-24 sm:py-32">
        <div className="absolute inset-0 gradient-mesh-purple" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <SectionHeader
            title="Notre Histoire"
            description="De l'idée à 10 000+ utilisateurs"
          />

          <div className="max-w-4xl mx-auto">
          <div className="space-y-8">
              {milestones.map((milestone, i) => (
                <ScrollReveal key={i} delay={i * 100}>
                  <div className="flex gap-6" data-animate="fade-right" data-delay={i * 100}>
                  <div className="flex-shrink-0">
                      <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold">
                      {milestone.year}
                      </div>
                    </div>
                    <div className="flex-1 pb-8 border-l-2 border-white/[0.04] pl-6">
                      <h3 className="text-2xl font-bold mb-2 text-white">{milestone.title}</h3>
                      <p className="text-slate-400">{milestone.description}</p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
                </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="dark-section relative noise-overlay py-24 sm:py-32">
        <div className="absolute inset-0 gradient-mesh-purple" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <SectionHeader
            title="L'Équipe"
            description="Experts en IA, 3D et E-commerce"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {team.map((member, i) => (
              <ScrollReveal key={i} delay={i * 100}>
                <Card className="p-6 bg-dark-card/60 backdrop-blur-sm border border-white/[0.04] text-center hover:-translate-y-1 transition-all" data-animate="fade-up" data-delay={i * 100}>
                  <div className={`w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br ${
                    member.color === 'blue' ? 'from-blue-500 to-cyan-500' :
                    member.color === 'purple' ? 'from-purple-500 to-pink-500' :
                    'from-green-500 to-emerald-500'
                  } flex items-center justify-center text-white font-bold text-2xl`}>
                      {member.avatar}
                    </div>
                  <h3 className="text-xl font-bold mb-2 text-white">{member.name}</h3>
                  <p className="text-slate-400">{member.role}</p>
                  </Card>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <CTASectionNew />
    </>
  );
}

const MemoizedAboutPageContent = memo(AboutPageContent);

export default function AboutPage() {
  return (
    <ErrorBoundary level="page" componentName="AboutPage">
      <MemoizedAboutPageContent />
    </ErrorBoundary>
  );
}
