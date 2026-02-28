'use client';

import React, { memo, useMemo } from 'react';
import { LazyMotionDiv as Motion } from '@/lib/performance/dynamic-motion';
import { Settings, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function ConfigurationPageContent() {
  const sections = useMemo(() => [
    {
      title: 'Variables d\'environnement',
      description: 'Configurer les variables d\'environnement pour votre déploiement',
      href: '/help/documentation/configuration/environment-variables',
      icon: '🔧'
    },
    {
      title: 'Configuration initiale',
      description: 'Guide de configuration initiale de Luneo',
      href: '/help/documentation/configuration/setup',
      icon: '⚙️'
    },
    {
      title: 'Paramètres avancés',
      description: 'Configuration avancée pour cas d\'usage complexes',
      href: '/help/documentation/configuration/advanced',
      icon: '🚀'
    },
    {
      title: 'Monitoring',
      description: 'Configurez le monitoring et les alertes',
      href: '/help/documentation/configuration/monitoring',
      icon: '📊'
    }
  ], []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-5xl mx-auto">
        <Motion
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Breadcrumbs */}
          <div className="flex items-center text-sm text-gray-400 mb-6">
            <Link href="/help/documentation" className="hover:text-white">Documentation</Link>
            <span className="mx-2">›</span>
            <span className="text-white">Configuration</span>
          </div>

          {/* Header */}
          <div className="mb-12">
            <Settings className="w-16 h-16 mb-6 text-green-400" />
            <h1 className="text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent">
                Configuration
              </span>
            </h1>
            <p className="text-xl text-gray-300">
              Guides de configuration et paramètres pour Luneo Enterprise.
            </p>
          </div>

          {/* Sections Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {sections.map((section, index) => (
              <Motion
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Link href={section.href}>
                  <Card className="bg-gray-800 border-gray-700 p-6 hover:border-green-500/50 transition-all h-full group">
                    <div className="text-3xl mb-4">{section.icon}</div>
                    <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-green-400 transition-colors">
                      {section.title}
                    </h3>
                    <p className="text-gray-300 mb-4">{section.description}</p>
                    <div className="flex items-center text-green-400 text-sm font-medium">
                      Lire la documentation
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </div>
                  </Card>
                </Link>
              </Motion>
            ))}
          </div>
        </Motion>
      </div>
    </div>
  );
}

const ConfigurationPageMemo = memo(ConfigurationPageContent);

export default function ConfigurationPage() {
  return (
    <ErrorBoundary componentName="ConfigurationPage">
      <ConfigurationPageMemo />
    </ErrorBoundary>
  );
}
