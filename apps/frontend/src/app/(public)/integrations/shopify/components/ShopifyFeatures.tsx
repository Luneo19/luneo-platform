'use client';

import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import {
  ShoppingBag,
  Sparkles,
  Zap,
  Package,
  BarChart3,
  CreditCard,
} from 'lucide-react';
import { useMemo } from 'react';

const featuresData = [
  {
    icon: ShoppingBag,
    title: 'Installation en 1-clic',
    description: 'Installez l\'app Shopify directement depuis le Shopify App Store. Configuration automatique en moins de 2 minutes.',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: Sparkles,
    title: 'Personnalisation produits en live',
    description: 'Widget de personnalisation intégré directement dans vos pages produits Shopify. Personnalisation 2D/3D en temps réel.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Zap,
    title: 'AR Try-On intégré',
    description: 'Essayage virtuel AR directement dans votre boutique. Compatible iOS AR Quick Look et Android Scene Viewer.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Package,
    title: 'Export print-ready automatique',
    description: 'Génération automatique de fichiers print-ready 300 DPI avec bleed et crop marks pour vos imprimeurs.',
    color: 'from-orange-500 to-red-500',
  },
  {
    icon: BarChart3,
    title: 'Sync inventaire temps réel',
    description: 'Synchronisation bidirectionnelle automatique entre Luneo et Shopify. Mise à jour des stocks en temps réel.',
    color: 'from-indigo-500 to-purple-500',
  },
  {
    icon: CreditCard,
    title: 'Prix dynamiques',
    description: 'Calcul automatique des prix selon les options de personnalisation. Intégration native avec Shopify Checkout.',
    color: 'from-green-500 to-teal-500',
  },
];

export function ShopifyFeatures() {
  const features = useMemo(() => featuresData.map((f) => ({
    ...f,
    icon: <f.icon className="w-6 h-6" />,
  })), []);

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Fonctionnalités Complètes
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Tout ce dont vous avez besoin pour transformer votre boutique Shopify en expérience de personnalisation premium
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6 h-full bg-gray-800/50 border-gray-700 hover:border-green-500/50 transition-all">
                <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center text-white mb-4`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
