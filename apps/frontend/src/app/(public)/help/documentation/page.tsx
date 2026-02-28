'use client';

import React, { memo, useMemo, useCallback } from 'react';
import Link from 'next/link';

import { ArrowRight, Book, Code, Zap, Bot, MessageSquare, Brain, Package, Lock, Webhook, FileCode, BarChart, Plug } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function DocumentationPageContent() {
  const sections = useMemo(() => [
    {
      title: 'Démarrage rapide',
      icon: <Zap className="w-6 h-6 sm:w-8 sm:h-8" />,
      color: 'orange',
      description: 'Déployez votre premier agent IA en 10 minutes',
      links: [
        { title: 'Créer un compte', href: '/help/documentation/quickstart/signup', time: '2 min' },
        { title: 'Créer un agent', href: '/help/documentation/quickstart/create-agent', time: '5 min' },
        { title: 'Ajouter une base de connaissances', href: '/help/documentation/quickstart/knowledge-base', time: '5 min' },
        { title: 'Intégrer le widget', href: '/help/documentation/quickstart/widget', time: '3 min' },
        { title: 'Déployer en production', href: '/help/documentation/quickstart/deploy', time: '5 min' }
      ]
    },
    {
      title: 'API Reference',
      icon: <Code className="w-6 h-6 sm:w-8 sm:h-8" />,
      color: 'blue',
      description: 'Documentation complète de l\'API REST',
      links: [
        { title: 'Agents API', href: '/help/documentation/api-reference/designs', badge: 'REST' },
        { title: 'Conversations API', href: '/help/documentation/api-reference/orders', badge: 'REST' },
        { title: 'Knowledge Bases API', href: '/help/documentation/api-reference/knowledge', badge: 'REST' },
        { title: 'Widget API', href: '/help/documentation/api-reference/widget', badge: 'REST' },
        { title: 'Analytics API', href: '/help/documentation/api-reference/analytics', badge: 'REST' },
        { title: 'Tous les endpoints', href: '/help/documentation/api-reference/endpoints', badge: 'Référence' }
      ]
    },
    {
      title: 'SDKs & Widget',
      icon: <Package className="w-6 h-6 sm:w-8 sm:h-8" />,
      color: 'purple',
      description: 'Intégrez le chat IA sur votre site',
      links: [
        { title: 'Vue d\'ensemble des SDKs', href: '/help/documentation/api-reference/sdk', badge: 'Guide' },
        { title: 'Widget JavaScript SDK', href: '/help/documentation/api-reference/js-sdk', badge: 'NPM' },
        { title: 'Client REST API', href: '/help/documentation/sdks/rest-client', badge: 'HTTP' },
        { title: 'Exemples d\'intégration', href: '/help/documentation/sdks/examples', badge: 'Code' }
      ]
    },
    {
      title: 'Agents IA',
      icon: <Bot className="w-6 h-6 sm:w-8 sm:h-8" />,
      color: 'cyan',
      description: 'Créez et configurez vos agents conversationnels',
      links: [
        { title: 'Créer un agent', href: '/help/documentation/agents/create', time: '5 min' },
        { title: 'Personnalité et instructions', href: '/help/documentation/agents/personality', badge: 'Guide' },
        { title: 'Modèles IA disponibles', href: '/help/documentation/agents/models', badge: 'GPT-4o' },
        { title: 'Tests et itérations', href: '/help/documentation/agents/testing', badge: 'Playground' }
      ]
    },
    {
      title: 'Bases de connaissances',
      icon: <Brain className="w-6 h-6 sm:w-8 sm:h-8" />,
      color: 'green',
      description: 'Indexation de documents avec RAG',
      links: [
        { title: 'Créer une base', href: '/help/documentation/knowledge/create', time: '5 min' },
        { title: 'Importer des documents', href: '/help/documentation/knowledge/import', badge: 'PDF, Web' },
        { title: 'Synchronisation automatique', href: '/help/documentation/knowledge/sync', badge: 'Cron' },
        { title: 'Optimiser la recherche', href: '/help/documentation/knowledge/optimize', badge: 'Avancé' }
      ]
    },
    {
      title: 'Canaux & Intégrations',
      icon: <Plug className="w-6 h-6 sm:w-8 sm:h-8" />,
      color: 'teal',
      description: 'Connectez vos agents partout',
      links: [
        { title: 'Widget Web', href: '/help/documentation/integrations/widget', badge: 'JavaScript' },
        { title: 'Slack', href: '/help/documentation/integrations/slack', badge: 'Bot' },
        { title: 'WhatsApp', href: '/help/documentation/integrations/whatsapp', badge: 'Business' },
        { title: 'Email', href: '/help/documentation/integrations/email', badge: 'SMTP' },
        { title: 'Shopify', href: '/help/documentation/integrations/shopify', badge: 'App' },
        { title: 'Zapier / Make', href: '/help/documentation/integrations/zapier', badge: 'Automation' }
      ]
    },
    {
      title: 'Webhooks & Events',
      icon: <Webhook className="w-6 h-6 sm:w-8 sm:h-8" />,
      color: 'red',
      description: 'Notifications temps réel',
      links: [
        { title: 'Configurer les webhooks', href: '/help/documentation/webhooks/setup', badge: 'POST' },
        { title: 'Types d\'événements', href: '/help/documentation/webhooks/events', badge: '12+ types' },
        { title: 'Sécurité des webhooks', href: '/help/documentation/webhooks/security', badge: 'HMAC' }
      ]
    },
    {
      title: 'Analytics',
      icon: <BarChart className="w-6 h-6 sm:w-8 sm:h-8" />,
      color: 'emerald',
      description: 'Mesurez la performance de vos agents',
      links: [
        { title: 'Tableau de bord', href: '/help/documentation/analytics/dashboard', badge: 'Temps réel' },
        { title: 'Métriques des agents', href: '/help/documentation/analytics/agents', badge: 'KPIs' },
        { title: 'Satisfaction utilisateur', href: '/help/documentation/analytics/satisfaction', badge: 'CSAT' },
        { title: 'Export de données', href: '/help/documentation/analytics/export', badge: 'CSV / API' }
      ]
    },
    {
      title: 'Sécurité & Conformité',
      icon: <Lock className="w-6 h-6 sm:w-8 sm:h-8" />,
      color: 'gray',
      description: 'Sécurité enterprise-grade',
      links: [
        { title: 'Authentification & SSO', href: '/help/documentation/security/authentication', badge: 'OAuth' },
        { title: 'Chiffrement des données', href: '/help/documentation/security/encryption', badge: 'AES-256' },
        { title: 'Conformité RGPD', href: '/help/documentation/security/gdpr', badge: 'EU' },
        { title: 'Logs d\'audit', href: '/help/documentation/security/audit', badge: 'Tracking' }
      ]
    }
  ], []);

  const quickLinks = useMemo(() => ['Démarrage rapide', 'API Reference', 'Widget SDK', 'Agents IA'], []);

  const exampleCode = useMemo(() => `<!-- Intégrez le chat Luneo en une ligne -->
<script
  src="https://cdn.luneo.app/widget.js"
  data-agent-id="agent_abc123"
  data-token="pk_live_xxxxxxxx"
  data-lang="fr"
  data-theme="dark"
  async
></script>`, []);

  const handleCopyCode = useCallback(() => {
    navigator.clipboard.writeText(exampleCode);
  }, [exampleCode]);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <section className="bg-gradient-to-br from-[#0a0a0f] via-black to-blue-900/30 py-12 sm:py-16 md:py-20 lg:py-24 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <motion
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 mb-6 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                <Book className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
                Documentation Luneo
              </h1>
              
              <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-8">
                Guides complets, API references et exemples de code pour créer et déployer vos agents IA conversationnels
              </p>
            </motion>

            <div className="relative max-w-2xl mx-auto">
              <input
                type="text"
                placeholder="Rechercher dans la documentation..."
                className="w-full px-4 sm:px-6 py-3 sm:py-4 rounded-full bg-white/5 border border-white/10 focus:border-white/30 focus:outline-none text-sm sm:text-base text-white placeholder-white/40"
              />
              <Button className="absolute right-2 top-2 bg-gradient-to-r from-blue-600 to-purple-600 text-sm sm:text-base">
                Rechercher
              </Button>
            </div>

            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-6 sm:mt-8">
              {quickLinks.map(link => (
                <Link key={link} href={`#${link.toLowerCase().replace(/ /g, '-')}`}>
                  <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                    {link}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 md:py-20 bg-white/[0.03]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {sections.map((section, index) => (
              <motion
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-4 sm:p-6 h-full bg-white/15 border-white/30 hover:border-white/50 hover:bg-white/25 transition-all group backdrop-blur-sm">
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 mb-4 rounded-lg bg-gradient-to-br from-${section.color}-500 to-${section.color}-600 flex items-center justify-center text-white`}>
                    {section.icon}
                  </div>
                  
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                    {section.title}
                  </h3>
                  
                  <p className="text-xs sm:text-sm text-gray-400 mb-4">{section.description}</p>
                  
                  <ul className="space-y-2">
                    {section.links.map(link => (
                      <li key={link.title}>
                        <Link
                          href={link.href}
                          className="flex items-center justify-between text-xs sm:text-sm text-gray-300 hover:text-blue-400 transition-colors group/link py-1"
                        >
                          <span className="group-hover/link:underline">{link.title}</span>
                          {link.badge && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300 font-medium">
                              {link.badge}
                            </span>
                          )}
                          {link.time && (
                            <span className="text-xs text-gray-400">{link.time}</span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </Card>
              </motion>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 md:py-20 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-8 sm:mb-12">
            Intégrez le widget chat en 30 secondes
          </h2>
          
          <Card className="p-4 sm:p-6 md:p-8 bg-[#0a0a0f] border border-white/10 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-blue-400" />
                <span className="text-xs sm:text-sm font-mono text-gray-400">index.html</span>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleCopyCode}
                className="text-white border-gray-600 hover:bg-gray-800 text-xs sm:text-sm"
              >
                Copier
              </Button>
            </div>
            
            <pre className="text-xs sm:text-sm overflow-x-auto">
              <code>{exampleCode}</code>
            </pre>
          </Card>
          
          <div className="mt-6 text-center">
            <Link href="/help/documentation/api-reference/js-sdk">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-sm sm:text-base">
                Documentation complète du Widget SDK
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 md:py-20 bg-[#0a0a0f] text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8">
          <MessageSquare className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-6 text-blue-400" />
          
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
            Besoin d'aide ?
          </h2>
          
          <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-8">
            Notre équipe technique est là pour vous accompagner
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 w-full sm:w-auto">
                Contacter le support
              </Button>
            </Link>
            <Link href="/help/support">
              <Button size="lg" variant="outline" className="bg-white/20 border-2 border-white/50 text-white hover:bg-white/30 w-full sm:w-auto">
                Centre d'aide
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

const DocumentationPageMemo = memo(DocumentationPageContent);

export default function DocumentationPage() {
  return (
    <ErrorBoundary componentName="DocumentationPage">
      <DocumentationPageMemo />
    </ErrorBoundary>
  );
}
