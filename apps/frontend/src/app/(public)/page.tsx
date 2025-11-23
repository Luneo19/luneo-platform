'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Star,
  Users,
  Zap,
  Package,
  Box,
  Eye,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function HomePage() {
  const [showTopBar, setShowTopBar] = useState(true);

  const gridItems = useMemo(() => Array.from({ length: 72 }, (_, i) => i), []);
  const particles = useMemo(
    () =>
      Array.from({ length: 15 }, (_, i) => ({
        left: `${(i * 37) % 100}%`,
        top: `${(i * 59) % 100}%`,
        delay: `${((i * 13) % 30) / 10}s`,
        duration: `${2.2 + ((i * 7) % 20) / 10}s`,
      })),
    []
  );
  const topStats = useMemo(
    () => [
      { value: '10K+', label: 'Créateurs', icon: <Users className="w-4 h-4 sm:w-5 sm:h-5" /> },
      { value: '500M+', label: 'Designs', icon: <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" /> },
      { value: '3.2s', label: 'Temps moy.', icon: <Zap className="w-4 h-4 sm:w-5 sm:h-5" /> },
    ],
    []
  );
  const industries = useMemo(
    () => ['Printing', 'Fashion', 'Sports', 'E-commerce', 'Luxury'],
    []
  );
  const successStories = useMemo(
    () => [
      {
        metric: '+500%',
        label: 'Croissance',
        company: 'LA FABRIQUE À SACHETS',
        quote: 'De 100 à 600 commandes/mois sans embaucher. Luneo a permis notre scale.',
        author: 'Marie B.',
        role: 'CEO',
        avatar: 'MB',
        gradient: 'from-blue-500 to-cyan-500',
      },
      {
        metric: '100%',
        label: 'Sell-out',
        company: 'DESIGN ITALIAN SHOES',
        quote: 'Visualisation 3D premium = zéro échantillon inutile. 100% de sell-out.',
        author: 'Francesco C.',
        role: 'COO',
        avatar: 'FC',
        gradient: 'from-purple-500 to-pink-500',
      },
      {
        metric: '-80%',
        label: 'Workflow',
        company: 'KAZE CLUB',
        quote: 'Fichiers print-ready automatiques = game-changer. Plus de 80% de workflow streamliné.',
        author: 'Christian M.',
        role: 'CREATIVE DIRECTOR',
        avatar: 'CM',
        gradient: 'from-green-500 to-emerald-500',
      },
    ],
    []
  );

  return (
    <main id="main-content" className="min-h-screen bg-gray-900">
      {/* Top Banner */}
      <AnimatePresence>
        {showTopBar && (
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-2 sm:py-3 px-4 relative z-50"
          >
            <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 sm:gap-4 text-center">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse flex-shrink-0" />
              <span className="font-semibold text-xs sm:text-sm">NOUVEAU</span>
              <span className="text-xs sm:text-sm">IA Générative 3D + AR + Customization Automatisée</span>
        </div>
            <button
              onClick={() => setShowTopBar(false)}
              className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-200 text-xl sm:text-2xl w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-blue-900">
          {/* Grid */}
          <div className="absolute inset-0 opacity-20">
            <div className="grid grid-cols-8 sm:grid-cols-12 grid-rows-6 sm:grid-rows-8 h-full w-full">
              {gridItems.map((i) => (
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

          {/* Particles */}
          <div className="absolute inset-0">
            {particles.map((particle, i) => (
              <div
                key={i}
                className="absolute w-1 sm:w-2 h-1 sm:h-2 bg-blue-400/40 rounded-full"
                style={{
                  left: particle.left,
                  top: particle.top,
                  animation: `bounce ${particle.duration} ease-in-out infinite`,
                  animationDelay: particle.delay,
                }}
              />
            ))}
          </div>

          {/* Glowing orbs */}
          <div className="absolute inset-0">
            <div className="absolute top-1/4 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
            <div
              className="absolute top-3/4 right-1/4 w-48 sm:w-80 h-48 sm:h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse"
              style={{ animationDelay: '1.5s' }}
            ></div>
          </div>

          {/* Floating code - Hidden on mobile */}
          <div className="hidden sm:block absolute inset-0 opacity-30 font-mono text-sm md:text-base">
            <motion.div
              className="absolute top-20 left-10 text-blue-400"
              animate={{ y: [0, -20, 0], opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              &lt;design&gt;
            </motion.div>
            <motion.div
              className="absolute top-32 right-20 text-purple-400"
              animate={{ y: [0, 15, 0], opacity: [0.2, 1, 0.2] }}
              transition={{ duration: 4, repeat: Infinity, delay: 1 }}
            >
              AI.generate()
            </motion.div>
            <motion.div
              className="absolute bottom-1/4 right-1/3 text-pink-400"
              animate={{ y: [0, -25, 0], opacity: [0.1, 1, 0.1] }}
              transition={{ duration: 5, repeat: Infinity, delay: 0.8 }}
            >
              &lt;3D&gt;
            </motion.div>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 w-full py-12 sm:py-16 md:py-20 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              {/* Left Column */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="text-center lg:text-left"
              >
                {/* Badge */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="inline-flex items-center px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm rounded-full text-xs sm:text-sm font-medium text-white mb-6 sm:mb-8 border border-blue-400/30"
                >
                  <Star className="w-4 h-4 mr-2 text-yellow-400 fill-current flex-shrink-0" />
                  <span className="hidden sm:inline">Utilisé par 10 000+ créateurs dans 150 pays</span>
                  <span className="sm:hidden">10K+ utilisateurs</span>
                </motion.div>

                {/* Headline */}
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                  <span className="text-white">Créez en</span>
                  <br />
                  <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    quelques secondes
                  </span>
                  <br />
                  <span className="text-white">ce qui prenait</span>
                  <br />
                  <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
                    des jours
                  </span>
                </h1>

                {/* Value Proposition */}
                <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-300 mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                  L'<strong className="text-white">intelligence artificielle</strong> qui transforme vos idées en{' '}
                  <strong className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    designs professionnels
                  </strong>
                  ,{' '}
                  <strong className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    modèles 3D photoréalistes
                  </strong>{' '}
                  et{' '}
                  <strong className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    expériences AR immersives
                  </strong>
                  .
                </p>

                <p className="text-xs sm:text-sm md:text-base text-blue-300 mb-8">
                  Sans compétences techniques. Sans designer. Sans photographe.
                </p>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8 sm:mb-12">
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center px-6 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm sm:text-base font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg w-full sm:w-auto"
                  >
                    Commencer gratuitement
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                  <Link
                    href="/demo"
                    className="inline-flex items-center justify-center px-6 py-3 sm:py-4 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white text-sm sm:text-base font-semibold rounded-xl hover:bg-white/20 transition-all w-full sm:w-auto"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Voir la démo
                  </Link>
                    </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {topStats.map((stat, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 + i * 0.1 }}
                      className="text-center lg:text-left"
                    >
                      <div className="flex items-center justify-center lg:justify-start gap-2 mb-1">
                        <div className="text-blue-400">{stat.icon}</div>
                        <div className="text-lg sm:text-xl md:text-2xl font-bold text-white">{stat.value}</div>
                    </div>
                      <div className="text-xs text-gray-400">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Right Column - Demo Visual (Hidden on mobile/tablet) */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="hidden lg:block relative"
              >
                <div className="relative">
                  {/* Glow */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/30 via-purple-400/30 to-pink-400/30 rounded-3xl blur-3xl"></div>

                  {/* Card */}
                  <div className="relative bg-gray-800/80 backdrop-blur-sm rounded-3xl shadow-2xl p-6 sm:p-8 border border-gray-600/50">
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700">
                      {/* Window controls */}
                      <div className="flex items-center mb-6">
                        <div className="w-3 h-3 bg-red-400 rounded-full mr-2"></div>
                        <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
                        <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
                        <div className="ml-4 text-xs text-gray-500 font-mono">luneo-ai-studio</div>
                    </div>

                      {/* Code animation */}
                      <div className="space-y-4 mb-6">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: '75%' }}
                          transition={{ duration: 1.5, delay: 1 }}
                          className="h-4 bg-gradient-to-r from-blue-400 to-purple-400 rounded"
                        />
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: '50%' }}
                          transition={{ duration: 1.5, delay: 1.3 }}
                          className="h-4 bg-gradient-to-r from-purple-400 to-pink-400 rounded"
                        />
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: '65%' }}
                          transition={{ duration: 1.5, delay: 1.6 }}
                          className="h-4 bg-gradient-to-r from-pink-400 to-cyan-400 rounded"
                        />
            </div>

                      {/* Success notification */}
              <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 2 }}
                        className="p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm rounded-xl border border-green-400/30"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-green-400 mb-1 flex items-center">
                              <Sparkles className="w-4 h-4 mr-2" />
                              Génération IA complète
                    </div>
                            <div className="text-xs text-gray-400">
                              Design HD + 3D + AR en <span className="text-green-400 font-bold">3.2s</span>
                    </div>
                  </div>
                          <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                    </div>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-8 sm:py-12 bg-gray-800/50 backdrop-blur-sm border-y border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <p className="text-xs sm:text-sm font-medium text-gray-400 mb-6 sm:mb-8 text-center">
            Utilisé par des marques leaders dans
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 sm:gap-8 items-center">
            {industries.map((industry, i) => (
              <motion.div
                key={industry}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 0.7, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ opacity: 1, scale: 1.05 }}
                className="text-gray-500 font-semibold text-sm sm:text-base md:text-lg text-center"
              >
                {industry}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-gray-900 via-blue-900/50 to-purple-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
              Ils ont transformé leur{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                business avec Luneo
              </span>
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-300">
              Résultats réels. Métriques vérifiables.
            </p>
              </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {successStories.map((story, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                whileHover={{ y: -5 }}
              >
                <Card className="h-full bg-gray-800/50 backdrop-blur-sm border-gray-700 p-4 sm:p-6 md:p-8 hover:bg-gray-800/70 transition-all">
                  {/* Metric */}
                  <div className="mb-6">
                    <div
                      className={`text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r ${story.gradient} bg-clip-text text-transparent mb-2`}
                    >
                      {story.metric}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-400 uppercase tracking-wide font-semibold">
                      {story.label}
                    </div>
                  </div>

                  {/* Quote */}
                  <blockquote className="text-sm sm:text-base text-gray-300 mb-6 leading-relaxed italic">
                    "{story.quote}"
                  </blockquote>

                  {/* Author */}
                  <div className="flex items-center gap-3 border-t border-gray-700 pt-4">
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br ${story.gradient} flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0`}
                    >
                      {story.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-white text-sm">{story.author}</div>
                      <div className="text-xs text-gray-400">{story.role}</div>
                      <div className="text-xs text-gray-500">{story.company}</div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link href="/success-stories">
              <Button size="lg" className="bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white hover:bg-white/20 text-sm sm:text-base">
                Découvrir toutes les success stories
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Technologies */}
      <section className="py-12 sm:py-16 md:py-20 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
              La puissance de l'
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                IA nouvelle génération
              </span>
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-300">
              Technologies d'avenir pour créer des expériences produits qui convertissent
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {[
              {
                icon: <Sparkles className="w-6 h-6 sm:w-8 sm:h-8" />,
                title: 'IA Générative',
                description: 'Créez 1000 designs en 1h au lieu de 1 mois',
                features: ['DALL-E 3', 'Prompts experts', 'HD export', 'Batch generation'],
                gradient: 'from-blue-500 to-cyan-500'
              },
              {
                icon: <Box className="w-6 h-6 sm:w-8 sm:h-8" />,
                title: '3D Photoréaliste',
                description: 'Économisez €50k en photoshoots avec modèles 3D',
                features: ['Three.js', '360° rotation', 'Materials PBR', 'Export GLTF'],
                gradient: 'from-purple-500 to-pink-500'
              },
              {
                icon: <Eye className="w-6 h-6 sm:w-8 sm:h-8" />,
                title: 'AR & Try-On',
                description: '+40% conversion avec essayage virtuel réaliste',
                features: ['WebXR', 'Face tracking', 'Mobile AR', 'Social share'],
                gradient: 'from-cyan-500 to-teal-500'
              },
              {
                icon: <Package className="w-6 h-6 sm:w-8 sm:h-8" />,
                title: 'Print Automation',
                description: '-90% temps production avec fichiers print-ready auto',
                features: ['300 DPI CMYK', 'PDF/X-4', 'Bleed auto', 'Color profile'],
                gradient: 'from-orange-500 to-red-500'
              }
            ].map((tech, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/10 hover:border-white/30 transition-all group"
              >
                <div
                  className={`w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r ${tech.gradient} rounded-2xl flex items-center justify-center mb-4 sm:mb-6 text-white group-hover:scale-110 transition-transform`}
                >
                  {tech.icon}
                </div>

                <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mb-3">{tech.title}</h3>

                <p className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6 leading-relaxed">{tech.description}</p>

                <div className="space-y-2">
                  {tech.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center text-xs sm:text-sm">
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-cyan-400 flex-shrink-0" />
                      <span className="text-gray-300">{feature}</span>
                  </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12 sm:mt-16"
          >
            <Link href="/solutions">
              <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-semibold shadow-lg text-sm sm:text-base">
                <Sparkles className="w-5 h-5 mr-2" />
                Explorer toutes les solutions
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Industries */}
      <section className="py-12 sm:py-16 md:py-20 bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
              Conçu pour votre industrie
            </h2>
            <p className="text-sm sm:text-base text-gray-300">Solutions spécialisées pour 7 secteurs d'activité</p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4 md:gap-6">
            {[
              { name: 'Printing', slug: 'printing', icon: <Package className="w-5 h-5 sm:w-6 sm:h-6" /> },
              { name: 'Fashion', slug: 'fashion', icon: <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" /> },
              { name: 'Sports', slug: 'sports', icon: <Zap className="w-5 h-5 sm:w-6 sm:h-6" /> },
              { name: 'Gadgets', slug: 'gifting', icon: <Box className="w-5 h-5 sm:w-6 sm:h-6" /> },
              { name: 'Jewellery', slug: 'jewellery', icon: <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" /> },
              { name: 'Furniture', slug: 'furniture', icon: <Box className="w-5 h-5 sm:w-6 sm:h-6" /> },
              { name: 'Food', slug: 'food-beverage', icon: <Package className="w-5 h-5 sm:w-6 sm:h-6" /> }
            ].map((industry, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.05 }}
              >
                <Link href={`/industries/${industry.slug}`}>
                  <Card className="p-4 sm:p-6 bg-gray-800/50 backdrop-blur-sm border-gray-700 hover:border-blue-400/50 transition-all cursor-pointer h-full">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 mb-3 sm:mb-4 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white mx-auto">
                      {industry.icon}
                    </div>
                    <h3 className="font-bold text-white text-xs sm:text-sm text-center">{industry.name}</h3>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 opacity-30">
          {Array.from({ length: 10 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 sm:w-2 h-1 sm:h-2 bg-white rounded-full"
              animate={{ y: [0, -1000], opacity: [0, 1, 0] }}
              transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 3 }}
              style={{ left: `${Math.random() * 100}%`, top: '100%' }}
            />
            ))}
          </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 md:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
              Commencez à créer
              <br />
              dès maintenant
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-blue-100 mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed">
              Rejoignez <strong className="text-white">10 000+ créateurs</strong> qui utilisent l'IA pour{' '}
              <strong className="text-white">scaler leur business</strong>.{' '}
              <span className="text-white font-bold">Gratuit</span> pour commencer.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8 sm:mb-12">
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-6 sm:px-8 md:px-10 py-4 sm:py-5 bg-white text-blue-600 font-bold rounded-xl hover:bg-gray-50 transition-all shadow-2xl text-sm sm:text-base md:text-lg w-full sm:w-auto"
              >
                Commencer gratuitement
                <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 ml-3" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center px-6 sm:px-8 md:px-10 py-4 sm:py-5 bg-white/10 backdrop-blur-sm border-2 border-white/50 text-white font-bold rounded-xl hover:bg-white/20 transition-all text-sm sm:text-base md:text-lg w-full sm:w-auto"
              >
                Voir les tarifs
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 sm:gap-6 text-white/80 text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span>Gratuit pour commencer</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span>Annulation à tout moment</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span>Support 24/7</span>
          </div>
          </div>
          </motion.div>
        </div>
      </section>

      {/* Interactive Demos Section - NEW */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-black">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 text-white">
              Essayez Nos Démos Interactives
          </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto px-4">
              Testez chaque solution directement, sans installation
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            <Link href="/demo/virtual-try-on">
              <Card className="bg-gray-900/50 border-cyan-500/20 p-4 sm:p-6 md:p-8 hover:border-cyan-500/50 transition-all group cursor-pointer">
                <Eye className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-cyan-400 mb-3 sm:mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl sm:text-2xl font-bold mb-2 text-white">Virtual Try-On</h3>
                <p className="text-sm sm:text-base text-gray-400 mb-3 sm:mb-4">Essayez en AR avec votre caméra</p>
                <div className="flex items-center gap-2 text-cyan-400 text-sm sm:text-base">
                  <span>Essayer</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Card>
            </Link>

            <Link href="/demo/configurator-3d">
              <Card className="bg-gray-900/50 border-blue-500/20 p-4 sm:p-6 md:p-8 hover:border-blue-500/50 transition-all group cursor-pointer">
                <Box className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-blue-400 mb-3 sm:mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl sm:text-2xl font-bold mb-2 text-white">Configurateur 3D</h3>
                <p className="text-sm sm:text-base text-gray-400 mb-3 sm:mb-4">Configurez en 3D temps réel</p>
                <div className="flex items-center gap-2 text-blue-400 text-sm sm:text-base">
                  <span>Tester</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Card>
            </Link>

            <Link href="/demo/customizer">
              <Card className="bg-gray-900/50 border-purple-500/20 p-4 sm:p-6 md:p-8 hover:border-purple-500/50 transition-all group cursor-pointer">
                <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-purple-400 mb-3 sm:mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl sm:text-2xl font-bold mb-2 text-white">Visual Customizer</h3>
                <p className="text-sm sm:text-base text-gray-400 mb-3 sm:mb-4">Éditeur canvas professionnel</p>
                <div className="flex items-center gap-2 text-purple-400 text-sm sm:text-base">
                  <span>Créer</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Card>
            </Link>

            <Link href="/demo/asset-hub">
              <Card className="bg-gray-900/50 border-green-500/20 p-4 sm:p-6 md:p-8 hover:border-green-500/50 transition-all group cursor-pointer">
                <Package className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-green-400 mb-3 sm:mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl sm:text-2xl font-bold mb-2 text-white">3D Asset Hub</h3>
                <p className="text-sm sm:text-base text-gray-400 mb-3 sm:mb-4">Upload & optimisez assets 3D</p>
                <div className="flex items-center gap-2 text-green-400 text-sm sm:text-base">
                  <span>Uploader</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Card>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
