'use client';

import React, { memo, useMemo } from 'react';
import { LazyMotionDiv as Motion } from '@/lib/performance/dynamic-motion';
import { Code, Book, ArrowRight, Bot, MessageSquare, Brain, Globe, BarChart, Puzzle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function APIReferencePageContent() {
  const sections = useMemo(() => [
    {
      title: 'Agents',
      description: 'Créez, configurez et gérez vos agents IA conversationnels',
      href: '/help/documentation/api-reference/designs',
      icon: <Bot className="w-8 h-8 text-blue-400" />
    },
    {
      title: 'Conversations',
      description: 'Gérez les sessions de chat entre vos agents et vos utilisateurs',
      href: '/help/documentation/api-reference/orders',
      icon: <MessageSquare className="w-8 h-8 text-purple-400" />
    },
    {
      title: 'Bases de connaissances',
      description: 'Indexez vos documents pour alimenter le RAG de vos agents',
      href: '/help/documentation/api-reference/knowledge',
      icon: <Brain className="w-8 h-8 text-green-400" />
    },
    {
      title: 'Canaux',
      description: 'Configurez les canaux de communication : web, Slack, WhatsApp, email',
      href: '/help/documentation/api-reference/channels',
      icon: <Globe className="w-8 h-8 text-cyan-400" />
    },
    {
      title: 'Widget',
      description: 'Intégrez le widget chat sur votre site avec le SDK JavaScript',
      href: '/help/documentation/api-reference/js-sdk',
      icon: <Puzzle className="w-8 h-8 text-orange-400" />
    },
    {
      title: 'Analytics',
      description: 'Accédez aux métriques de performance de vos agents',
      href: '/help/documentation/api-reference/analytics',
      icon: <BarChart className="w-8 h-8 text-emerald-400" />
    },
    {
      title: 'Endpoints principaux',
      description: 'Référence complète de tous les endpoints de l\'API',
      href: '/help/documentation/api-reference/endpoints',
      icon: <Code className="w-8 h-8 text-red-400" />
    },
    {
      title: 'SDKs',
      description: 'Vue d\'ensemble des SDKs et clients disponibles',
      href: '/help/documentation/api-reference/sdk',
      icon: <Book className="w-8 h-8 text-yellow-400" />
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
          <div className="flex items-center text-sm text-gray-400 mb-6">
            <Link href="/help/documentation" className="hover:text-white">Documentation</Link>
            <span className="mx-2">›</span>
            <span className="text-white">API Reference</span>
          </div>

          <div className="mb-12">
            <Code className="w-16 h-16 mb-6 text-blue-400" />
            <h1 className="text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                API Reference
              </span>
            </h1>
            <p className="text-xl text-gray-300 mb-6">
              Documentation complète de l'API REST Luneo. Construisez des expériences conversationnelles IA sur mesure.
            </p>
            <div className="flex flex-wrap gap-3 text-sm text-gray-400">
              <span className="bg-gray-800 px-3 py-1 rounded-full">Base URL : https://api.luneo.app/api/v1</span>
              <span className="bg-gray-800 px-3 py-1 rounded-full">Auth : Bearer JWT</span>
              <span className="bg-gray-800 px-3 py-1 rounded-full">Format : JSON</span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {sections.map((section, index) => (
              <Motion
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Link href={section.href}>
                  <Card className="bg-gray-800 border-gray-700 p-6 hover:border-blue-500/50 transition-all h-full group">
                    <div className="mb-4">{section.icon}</div>
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
              </Motion>
            ))}
          </div>

          <div className="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8">
            <Book className="w-12 h-12 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Démarrage rapide</h2>
            <p className="text-blue-100 mb-4">
              Nouveau sur l'API Luneo ? Déployez votre premier agent IA en quelques minutes.
            </p>
            <Link href="/help/documentation/quickstart/create-agent">
              <button className="bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white hover:bg-white/20 px-6 py-3 rounded-lg font-semibold transition-colors">
                Créer votre premier agent
                <ArrowRight className="w-4 h-4 ml-2 inline" />
              </button>
            </Link>
          </div>
        </Motion>
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
