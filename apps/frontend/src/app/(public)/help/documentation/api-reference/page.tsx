'use client';

import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Code, Book, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function APIReferencePageContent() {
  const sections = useMemo(() => [
    {
      title: 'Authentification',
      description: 'Configuration de l\'authentification JWT et API Keys',
      href: '/help/documentation/api-reference/authentication',
      icon: '🔐'
    },
    {
      title: 'Endpoints principaux',
      description: 'Liste complète des endpoints de l\'API',
      href: '/help/documentation/api-reference/endpoints',
      icon: '📡'
    },
    {
      title: 'Créer un design',
      description: 'API pour créer des designs personnalisés',
      href: '/help/documentation/api-reference/create-design',
      icon: '🎨'
    },
    {
      title: 'Créer une commande',
      description: 'API pour créer des commandes',
      href: '/help/documentation/api-reference/create-order',
      icon: '🛒'
    },
    {
      title: 'Webhooks',
      description: 'Recevoir des notifications en temps réel',
      href: '/help/documentation/api-reference/webhooks',
      icon: '🔔'
    },
    {
      title: 'SDK JavaScript',
      description: 'SDK officiel pour JavaScript/TypeScript',
      href: '/help/documentation/api-reference/js-sdk',
      icon: '📦'
    },
    {
      title: 'Limites et quotas',
      description: 'Limites de taux et quotas par plan',
      href: '/help/documentation/api-reference/rate-limits',
      icon: '⚡'
    }
  ], []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Breadcrumbs */}
          <div className="flex items-center text-sm text-gray-400 mb-6">
            <Link href="/help/documentation" className="hover:text-white">Documentation</Link>
            <span className="mx-2">›</span>
            <span className="text-white">API Reference</span>
          </div>

          {/* Header */}
          <div className="mb-12">
            <Code className="w-16 h-16 mb-6 text-blue-400" />
            <h1 className="text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                API Reference
              </span>
            </h1>
            <p className="text-xl text-gray-300">
              Documentation complète de l'API REST Luneo. Apprenez à intégrer Luneo dans vos applications.
            </p>
          </div>

          {/* Sections Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {sections.map((section, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Link href={section.href}>
                  <Card className="bg-gray-800 border-gray-700 p-6 hover:border-blue-500/50 transition-all h-full group">
                    <div className="text-3xl mb-4">{section.icon}</div>
                    <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors">
                      {section.title}
                    </h3>
                    <p className="text-gray-300 mb-4">{section.description}</p>
                    <div className="flex items-center text-blue-400 text-sm font-medium">
                      Lire la documentation
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Quick Start */}
          <div className="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8">
            <Book className="w-12 h-12 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Démarrage rapide</h2>
            <p className="text-blue-100 mb-4">
              Nouveau sur l'API Luneo ? Commencez par notre guide de démarrage rapide.
            </p>
            <Link href="/help/quick-start">
              <button className="bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white hover:bg-white/20 px-6 py-3 rounded-lg font-semibold transition-colors">
                Guide de démarrage
                <ArrowRight className="w-4 h-4 ml-2 inline" />
              </button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

const APIReferencePageMemo = memo(APIReferencePageContent);

export default function APIReferencePage() {
  return (
    <ErrorBoundary componentName="APIReferencePage">
      <APIReferencePageMemo />
    </ErrorBoundary>
  );
}
