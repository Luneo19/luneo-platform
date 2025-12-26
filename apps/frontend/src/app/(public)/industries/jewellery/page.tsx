'use client';

import React from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  Gem,
  Eye,
  Sparkles,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Smartphone,
  Users,
  Zap,
} from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Jewellery Industry Page
 * Page professionnelle pour l'industrie de la joaillerie
 */
export default function JewelleryIndustryPage() {
  const features = [
    {
      icon: <Eye className="w-6 h-6" />,
      title: 'Virtual Try-On AR',
      description: 'Essayage virtuel en réalité augmentée pour bijoux et montres',
    },
    {
      icon: <Gem className="w-6 h-6" />,
      title: 'Visualisation 3D Photoréaliste',
      description: 'Rendu haute qualité pour montrer chaque détail de vos créations',
    },
    {
      icon: <Smartphone className="w-6 h-6" />,
      title: 'Expérience Mobile Native',
      description: 'Optimisé pour iOS et Android avec support ARKit et ARCore',
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: 'Personnalisation Avancée',
      description: 'Personnalisez matériaux, tailles et finitions en temps réel',
    },
  ];

  const benefits = [
    'Réduction des retours de 70%',
    'Taux de conversion +55%',
    'Temps d\'engagement +3x',
    'Satisfaction client +80%',
  ];

  const useCases = [
    {
      title: 'Bagues & Alliances',
      description: 'Essayage virtuel avec ajustement de taille en temps réel',
      image: '💍',
    },
    {
      title: 'Montres de Luxe',
      description: 'Visualisation 3D avec différents cadrans et bracelets',
      image: '⌚',
    },
    {
      title: 'Colliers & Pendentifs',
      description: 'Prévisualisation sur différents types de chaînes',
      image: '📿',
    },
    {
      title: 'Boucles d\'Oreilles',
      description: 'Essayage AR avec simulation de port',
      image: '💎',
    },
  ];

  return (
    <ErrorBoundary componentName="JewelleryIndustryPage">
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-r from-amber-600 via-yellow-500 to-orange-500 text-white py-20 overflow-hidden">
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="mb-4 bg-white/20 text-white border-white/30">
                <Gem className="w-3 h-3 mr-1" />
                Joaillerie & Luxe
              </Badge>
              <h1 className="text-5xl md:text-6xl font-bold mb-6">
                Révolutionnez l'expérience d'achat de bijoux
              </h1>
              <p className="text-xl text-amber-100 mb-8 max-w-3xl">
                Virtual Try-On AR, visualisation 3D photoréaliste et personnalisation avancée
                pour transformer l'expérience client dans la joaillerie.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-white text-amber-600 hover:bg-amber-50"
                >
                  <Link href="/register">
                    Démarrer gratuitement
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10"
                >
                  <Link href="/demo/virtual-try-on">
                    Essayer AR
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Technologies de pointe pour la joaillerie
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Des outils professionnels conçus spécifiquement pour l'industrie du luxe
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full border-2 hover:border-amber-500 transition-colors">
                    <CardHeader>
                      <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center text-amber-600 mb-4">
                        {feature.icon}
                      </div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-base">
                        {feature.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Cas d'usage par type de bijoux
              </h2>
              <p className="text-xl text-gray-600">
                Des solutions adaptées à chaque catégorie de produits
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {useCases.map((useCase, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full text-center p-6 hover:shadow-lg transition-shadow">
                    <div className="text-5xl mb-4">{useCase.image}</div>
                    <CardTitle className="mb-2">{useCase.title}</CardTitle>
                    <CardDescription>{useCase.description}</CardDescription>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl font-bold text-gray-900 mb-6">
                  Résultats exceptionnels pour les joailliers
                </h2>
                <p className="text-lg text-gray-600 mb-8">
                  Les marques de joaillerie qui utilisent Luneo constatent des améliorations
                  significatives sur tous les indicateurs clés.
                </p>
                <div className="space-y-4">
                  {benefits.map((benefit, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                      <span className="text-lg text-gray-700">{benefit}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
              <div className="relative">
                <Card className="p-8 bg-gradient-to-br from-amber-50 to-yellow-50 shadow-xl">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Taux de conversion</p>
                        <p className="text-3xl font-bold text-amber-600">+55%</p>
                      </div>
                      <TrendingUp className="w-12 h-12 text-amber-500" />
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '55%' }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="h-full bg-gradient-to-r from-amber-500 to-yellow-500"
                      />
                    </div>
                    <div className="pt-6 border-t border-amber-200">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="w-4 h-4" />
                        <span>Basé sur 50+ marques de joaillerie</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-amber-600 to-orange-500 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold mb-6">
              Prêt à transformer l'expérience de vos clients ?
            </h2>
            <p className="text-xl text-amber-100 mb-8">
              Rejoignez les marques de joaillerie qui innovent avec Luneo
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-white text-amber-600 hover:bg-amber-50"
              >
                <Link href="/register">
                  Essayer gratuitement
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10"
              >
                <Link href="/contact">
                  Demander une démo
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </ErrorBoundary>
  );
}

