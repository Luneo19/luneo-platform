'use client';

import React, { memo } from 'react';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
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

function AboutPageContent() {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero */}
      <section className="relative overflow-hidden py-16 sm:py-20 md:py-24 lg:py-32">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-blue-900">
          <div className="absolute inset-0 opacity-20">
            <div className="grid grid-cols-8 sm:grid-cols-12 grid-rows-6 h-full w-full">
              {Array.from({ length: 72 }).map((_, i) => (
                <div
                  key={i}
                  className="border border-blue-500/20 animate-pulse"
                  style={{
                    animationDelay: `${(i * 0.1) % 3}s`,
                    animationDuration: '3s'
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 md:px-8 text-center">
          <motion initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">
              Notre{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                mission
              </span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-300 leading-relaxed max-w-3xl mx-auto">
              Démocratiser la création de designs professionnels grâce à l'IA et rendre la personnalisation produit accessible à tous.
            </p>
          </motion>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 sm:py-20 bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12">
            <motion
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="h-full p-6 sm:p-8 bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-400/30">
                <Target className="w-12 h-12 sm:w-16 sm:h-16 mb-6 text-blue-400" />
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Notre Mission</h2>
                <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
                  Transformer le workflow créatif des marques en combinant l'intelligence artificielle, la visualisation 3D et la réalité augmentée. Nous permettons à chaque entrepreneur de créer des expériences produits dignes des plus grandes marques.
                </p>
              </Card>
            </motion>

            <motion
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="h-full p-6 sm:p-8 bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-400/30">
                <Eye className="w-12 h-12 sm:w-16 sm:h-16 mb-6 text-purple-400" />
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Notre Vision</h2>
                <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
                  Un monde où chaque produit peut être personnalisé instantanément, visualisé en 3D photoréaliste, essayé en réalité augmentée, et commandé avec des fichiers print-ready automatiques. Zero friction. 100% automation.
                </p>
              </Card>
            </motion>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 sm:py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <motion
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">Nos Valeurs</h2>
            <p className="text-base sm:text-lg text-gray-400">Ce qui guide notre travail au quotidien</p>
          </motion>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {[
              {
                icon: <Zap className="w-6 h-6 sm:w-8 sm:h-8" />,
                title: 'Innovation',
                description: 'Toujours à la pointe de la technologie IA, 3D et AR',
                gradient: 'from-yellow-500 to-orange-500'
              },
              {
                icon: <Heart className="w-6 h-6 sm:w-8 sm:h-8" />,
                title: 'Simplicité',
                description: 'Des outils puissants, mais intuitifs et accessibles',
                gradient: 'from-pink-500 to-red-500'
              },
              {
                icon: <Shield className="w-6 h-6 sm:w-8 sm:h-8" />,
                title: 'Fiabilité',
                description: 'Infrastructure enterprise-grade, 99.9% uptime SLA',
                gradient: 'from-blue-500 to-cyan-500'
              },
              {
                icon: <Users className="w-6 h-6 sm:w-8 sm:h-8" />,
                title: 'Support',
                description: 'Accompagnement personnalisé 24/7 pour votre succès',
                gradient: 'from-purple-500 to-pink-500'
              }
            ].map((value, i) => (
              <motion
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <Card className="h-full p-6 bg-gray-800/50 backdrop-blur-sm border-gray-700 hover:border-white/30 transition-all">
                  <div
                    className={`w-14 h-14 sm:w-16 sm:h-16 mb-4 rounded-xl bg-gradient-to-r ${value.gradient} flex items-center justify-center text-white`}
                  >
                    {value.icon}
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-3">{value.title}</h3>
                  <p className="text-sm sm:text-base text-gray-400">{value.description}</p>
                </Card>
              </motion>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 sm:py-20 bg-gray-800/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8">
          <motion
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">Notre Histoire</h2>
            <p className="text-base sm:text-lg text-gray-400">De l'idée à 10 000+ utilisateurs</p>
          </motion>

          <div className="space-y-8">
            {[
              { year: '2024', title: 'Lancement', description: 'Création de Luneo et premiers utilisateurs beta' },
              { year: '2024', title: 'IA Générative', description: 'Intégration DALL-E 3 pour génération automatique' },
              { year: '2024', title: '3D & AR', description: 'Lancement configurateur 3D et Virtual Try-On' },
              { year: '2025', title: 'Scale', description: '10 000+ créateurs, 500M+ designs générés' }
            ].map((milestone, i) => (
              <motion
                key={i}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-6"
              >
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base">
                    {milestone.year}
                  </div>
                </div>
                <div className="flex-1 pb-8 border-l-2 border-blue-500/30 pl-6">
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">{milestone.title}</h3>
                  <p className="text-sm sm:text-base text-gray-400">{milestone.description}</p>
                </div>
              </motion>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 sm:py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <motion
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">L'Équipe</h2>
            <p className="text-base sm:text-lg text-gray-400">Experts en IA, 3D et E-commerce</p>
          </motion>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              { name: 'Emmanuel A.', role: 'CEO & Founder', avatar: 'EA', gradient: 'from-blue-500 to-cyan-500' },
              { name: 'Tech Team', role: 'Engineering', avatar: 'TT', gradient: 'from-purple-500 to-pink-500' },
              { name: 'Design Team', role: 'Product Design', avatar: 'DT', gradient: 'from-green-500 to-emerald-500' }
            ].map((member, i) => (
              <motion
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <Card className="p-6 bg-gray-800/50 backdrop-blur-sm border-gray-700 hover:bg-gray-800/70 transition-all text-center">
                  <div
                    className={`w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 rounded-full bg-gradient-to-br ${member.gradient} flex items-center justify-center text-white font-bold text-xl sm:text-2xl`}
                  >
                    {member.avatar}
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2">{member.name}</h3>
                  <p className="text-sm text-gray-400">{member.role}</p>
                </Card>
              </motion>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 text-center">
          <motion initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
              Prêt à rejoindre l'aventure ?
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-blue-100 mb-8 sm:mb-12">
              Rejoignez 10 000+ créateurs qui transforment leurs idées en réalité
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-50 font-bold text-base sm:text-lg w-full sm:w-auto">
                  Commencer gratuitement
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white/20 border-2 border-white/50 text-white hover:bg-white/30 font-bold text-base sm:text-lg w-full sm:w-auto"
                >
                  Nous contacter
                </Button>
              </Link>
            </div>
          </motion>
        </div>
      </section>
    </div>
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
