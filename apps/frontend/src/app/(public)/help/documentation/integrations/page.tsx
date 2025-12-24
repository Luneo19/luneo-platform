'use client';

import React, { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plug, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function IntegrationsPageContent() {
  const sections = useMemo(() => [
    {
      title: 'Stripe',
      description: 'Intégration des paiements avec Stripe',
      href: '/help/documentation/integrations/stripe',
      icon: '💳'
    },
    {
      title: 'Slack',
      description: 'Notifications dans votre workspace Slack',
      href: '/help/documentation/integrations/slack',
      icon: '💬'
    },
    {
      title: 'SendGrid',
      description: 'Envoi d\'emails transactionnels',
      href: '/help/documentation/integrations/sendgrid',
      icon: '📧'
    },
    {
      title: 'Shopify',
      description: 'Synchronisation avec votre boutique Shopify',
      href: '/help/documentation/integrations/shopify',
      icon: '🛍️'
    },
    {
      title: 'GitHub',
      description: 'Versioning et CI/CD avec GitHub',
      href: '/help/documentation/integrations/github',
      icon: '💻'
    },
    {
      title: 'Figma',
      description: 'Import/export de designs Figma',
      href: '/help/documentation/integrations/figma',
      icon: '🎨'
    }
  ], []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 md:p-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center text-sm text-gray-400 mb-6">
            <Link href="/help/documentation" className="hover:text-white">
              Documentation
            </Link>
            <span className="mx-2">›</span>
            <span className="text-white">Intégrations</span>
          </div>

          <div className="mb-12">
            <Plug className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mb-6 text-orange-400" />
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4">
              <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                Intégrations
              </span>
            </h1>
            <p className="text-xl text-gray-300">
              Connectez Luneo à vos outils et services favoris pour automatiser vos workflows.
            </p>
          </div>

          <div className="grid min-[480px]:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {sections.map((section, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Link href={section.href}>
                  <Card className="bg-gray-800 border-gray-700 p-6 hover:border-orange-500/50 transition-all h-full group">
                    <div className="text-4xl mb-4">{section.icon}</div>
                    <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-orange-400 transition-colors">
                      {section.title}
                    </h3>
                    <p className="text-gray-300 mb-4">{section.description}</p>
                    <div className="flex items-center text-orange-400 text-sm font-medium">
                      Lire la documentation
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl p-6 sm:p-8">
            <Plug className="w-10 h-10 sm:w-12 sm:h-12 mb-4" />
            <h2 className="text-2xl font-bold mb-2">API REST Complète</h2>
            <p className="text-orange-100 mb-4">
              Construisez vos propres intégrations avec notre API REST complète et nos webhooks en temps réel.
            </p>
            <Link href="/help/documentation/api-reference">
              <button className="bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white hover:bg-white/20 px-6 py-3 rounded-lg font-semibold transition-colors">
                Documentation API
                <ArrowRight className="w-4 h-4 ml-2 inline" />
              </button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

const IntegrationsPageMemo = memo(IntegrationsPageContent);

export default function IntegrationsPage() {
  return (
    <ErrorBoundary componentName="IntegrationsPage">
      <IntegrationsPageMemo />
    </ErrorBoundary>
  );
}
