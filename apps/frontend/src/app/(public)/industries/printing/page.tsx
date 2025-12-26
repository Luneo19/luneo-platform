'use client';

import React from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  Printer,
  Package,
  Zap,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Palette,
  Layers,
  Globe,
} from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Printing & POD Industry Page
 * Page professionnelle pour l'industrie de l'impression et Print-on-Demand
 */
export default function PrintingIndustryPage() {
  const features = [
    {
      icon: <Printer className="w-6 h-6" />,
      title: 'Web-to-Print Automatisé',
      description: 'Intégration complète avec vos systèmes d\'impression existants',
    },
    {
      icon: <Package className="w-6 h-6" />,
      title: 'Gestion Multi-Produits',
      description: 'T-shirts, mugs, posters, stickers - tout en un seul endroit',
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Production Rapide',
      description: 'Workflow optimisé pour réduire les délais de production',
    },
    {
      icon: <Palette className="w-6 h-6" />,
      title: 'Personnalisation Illimitée',
      description: 'Designs uniques pour chaque client sans surcoût',
    },
  ];

  const benefits = [
    'Réduction des coûts d\'inventaire de 80%',
    'Temps de production divisé par 3',
    'Taux de conversion +45%',
    'Satisfaction client +60%',
  ];

  const integrations = [
    { name: 'Printful', logo: '🖨️', status: 'Active' },
    { name: 'Printify', logo: '📦', status: 'Active' },
    { name: 'Gooten', logo: '🚀', status: 'Active' },
    { name: 'AOP+', logo: '✨', status: 'Active' },
  ];

  return (
    <ErrorBoundary componentName="PrintingIndustryPage">
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-20 overflow-hidden">
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="mb-4 bg-white/20 text-white border-white/30">
                <Printer className="w-3 h-3 mr-1" />
                Printing & POD
              </Badge>
              <h1 className="text-5xl md:text-6xl font-bold mb-6">
                Transformez votre activité Print-on-Demand
              </h1>
              <p className="text-xl text-blue-100 mb-8 max-w-3xl">
                La plateforme de personnalisation n°1 pour l'industrie de l'impression.
                Automatisez votre workflow, boostez vos ventes et réduisez vos coûts.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-blue-50"
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
                  <Link href="/demo/customizer">
                    Voir la démo
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
                Fonctionnalités dédiées à l'impression
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Tout ce dont vous avez besoin pour gérer votre activité POD efficacement
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
                  <Card className="h-full border-2 hover:border-blue-500 transition-colors">
                    <CardHeader>
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-4">
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

        {/* Benefits Section */}
        <section className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl font-bold text-gray-900 mb-6">
                  Résultats mesurables pour votre activité
                </h2>
                <p className="text-lg text-gray-600 mb-8">
                  Rejoignez les centaines d'entreprises qui ont transformé leur activité POD avec Luneo.
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
                <Card className="p-8 bg-white shadow-xl">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Taux de conversion</p>
                        <p className="text-3xl font-bold text-green-600">+45%</p>
                      </div>
                      <TrendingUp className="w-12 h-12 text-green-500" />
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '45%' }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                      />
                    </div>
                    <div className="pt-6 border-t">
                      <p className="text-sm text-gray-600">
                        Moyenne constatée sur 6 mois d'utilisation
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Integrations Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Intégrations POD populaires
              </h2>
              <p className="text-xl text-gray-600">
                Connectez-vous aux principales plateformes d'impression
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {integrations.map((integration, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="text-center p-6 hover:shadow-lg transition-shadow">
                    <div className="text-4xl mb-4">{integration.logo}</div>
                    <h3 className="font-semibold text-gray-900 mb-2">{integration.name}</h3>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      {integration.status}
                    </Badge>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold mb-6">
              Prêt à transformer votre activité POD ?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Rejoignez des milliers d'entreprises qui font confiance à Luneo
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-white text-blue-600 hover:bg-blue-50"
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
                  Parler à un expert
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </ErrorBoundary>
  );
}

