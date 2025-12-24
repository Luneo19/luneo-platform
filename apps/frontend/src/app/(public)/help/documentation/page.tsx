'use client';

import React, { memo, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ArrowRight, Book, Code, Zap, Box, Eye, Palette, Webhook, Terminal, FileCode, BarChart, Lock,
  Globe, Package, Settings, MessageSquare
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function DocumentationPageContent() {
  const sections = useMemo(() => [
    {
      title: 'Démarrage rapide',
      icon: <Zap className="w-6 h-6 sm:w-8 sm:h-8" />,
      color: 'orange',
      description: 'Intégrez Luneo en 15 minutes',
      links: [
        { title: 'Installation', href: '/help/documentation/quickstart/installation', time: '5 min' },
        { title: 'Configuration', href: '/help/documentation/quickstart/configuration', time: '5 min' },
        { title: 'Premier customizer', href: '/help/documentation/quickstart/first-customizer', time: '5 min' },
        { title: 'Deploy production', href: '/help/documentation/quickstart/deploy', time: '10 min' }
      ]
    },
    {
      title: 'API Reference',
      icon: <Code className="w-6 h-6 sm:w-8 sm:h-8" />,
      color: 'blue',
      description: 'Documentation complète de l\'API REST',
      links: [
        { title: 'Authentication', href: '/help/documentation/api/authentication', badge: 'OAuth 2.0' },
        { title: 'Products API', href: '/help/documentation/api/products', badge: 'REST' },
        { title: 'Designs API', href: '/help/documentation/api/designs', badge: 'REST' },
        { title: 'Orders API', href: '/help/documentation/api/orders', badge: 'REST' },
        { title: 'Webhooks API', href: '/help/documentation/api/webhooks', badge: 'Events' },
        { title: 'Rate Limiting', href: '/help/documentation/api/rate-limiting', badge: 'Important' }
      ]
    },
    {
      title: 'SDKs & Libraries',
      icon: <Package className="w-6 h-6 sm:w-8 sm:h-8" />,
      color: 'purple',
      description: 'Intégration dans votre stack préférée',
      links: [
        { title: 'JavaScript / TypeScript', href: '/help/documentation/sdks/javascript', badge: 'NPM' },
        { title: 'React Components', href: '/help/documentation/sdks/react', badge: 'NPM' },
        { title: 'Node.js SDK', href: '/help/documentation/sdks/node', badge: 'NPM' },
        { title: 'Python SDK', href: '/help/documentation/sdks/python', badge: 'PyPI' }
      ]
    },
    {
      title: 'CLI Tools',
      icon: <Terminal className="w-6 h-6 sm:w-8 sm:h-8" />,
      color: 'green',
      description: 'Gérez Luneo depuis votre terminal',
      links: [
        { title: 'Installation CLI', href: '/help/documentation/cli/installation', badge: 'npm/yarn' },
        { title: 'Commandes essentielles', href: '/help/documentation/cli/commands', badge: '20+ cmds' },
        { title: 'Workflows CI/CD', href: '/help/documentation/cli/workflows', badge: 'Automation' }
      ]
    },
    {
      title: 'Customizer 2D',
      icon: <Palette className="w-6 h-6 sm:w-8 sm:h-8" />,
      color: 'pink',
      description: 'Canvas 2D avec Konva.js',
      links: [
        { title: 'Getting Started', href: '/help/documentation/customizer/getting-started', time: '10 min' },
        { title: 'Configuration options', href: '/help/documentation/customizer/configuration', badge: 'JSON' },
        { title: 'Advanced features', href: '/help/documentation/customizer/advanced', badge: 'Plugins' },
        { title: 'Exemples complets', href: '/help/documentation/customizer/examples', badge: 'Code' }
      ]
    },
    {
      title: 'Configurator 3D',
      icon: <Box className="w-6 h-6 sm:w-8 sm:h-8" />,
      color: 'cyan',
      description: 'Visualisation 3D avec Three.js',
      links: [
        { title: 'Setup 3D Models', href: '/help/documentation/3d/setup', badge: 'GLB/GLTF' },
        { title: 'Gestion modèles', href: '/help/documentation/3d/models', badge: 'Import' },
        { title: 'Materials & Textures', href: '/help/documentation/3d/materials', badge: 'PBR' },
        { title: 'Export & Render', href: '/help/documentation/3d/export', badge: 'HD' }
      ]
    },
    {
      title: 'Virtual Try-On & AR',
      icon: <Eye className="w-6 h-6 sm:w-8 sm:h-8" />,
      color: 'indigo',
      description: 'AR experiences avec WebXR',
      links: [
        { title: 'Setup AR viewer', href: '/help/documentation/ar/setup', badge: 'WebXR' },
        { title: 'QR Codes AR', href: '/help/documentation/ar/qr-codes', badge: 'Mobile' },
        { title: 'Tracking & Analytics', href: '/help/documentation/ar/tracking', badge: 'Metrics' }
      ]
    },
    {
      title: 'AI Design Hub',
      icon: <Zap className="w-6 h-6 sm:w-8 sm:h-8" />,
      color: 'yellow',
      description: 'Génération designs avec IA',
      links: [
        { title: 'Image generation', href: '/help/documentation/ai/generation', badge: 'DALL-E 3' },
        { title: 'Prompts effectifs', href: '/help/documentation/ai/prompts', badge: 'Guide' },
        { title: 'Modèles IA', href: '/help/documentation/ai/models', badge: 'Comparison' }
      ]
    },
    {
      title: 'Webhooks & Events',
      icon: <Webhook className="w-6 h-6 sm:w-8 sm:h-8" />,
      color: 'red',
      description: 'Automation temps réel',
      links: [
        { title: 'Setup webhooks', href: '/help/documentation/webhooks/setup', badge: 'POST' },
        { title: 'Event types', href: '/help/documentation/webhooks/events', badge: '15+ types' },
        { title: 'API Webhooks', href: '/help/documentation/api/webhooks', badge: 'REST' }
      ]
    },
    {
      title: 'Analytics & Tracking',
      icon: <BarChart className="w-6 h-6 sm:w-8 sm:h-8" />,
      color: 'emerald',
      description: 'Mesurez votre performance',
      links: [
        { title: 'Analytics Overview', href: '/help/documentation/analytics/overview', badge: 'Real-time' },
        { title: 'Événements trackés', href: '/help/documentation/analytics/events', badge: 'Tracking' },
        { title: 'Dashboards', href: '/help/documentation/analytics/dashboards', badge: 'Visualisation' }
      ]
    },
    {
      title: 'Intégrations',
      icon: <Globe className="w-6 h-6 sm:w-8 sm:h-8" />,
      color: 'teal',
      description: 'Connectez vos outils favoris',
      links: [
        { title: 'Shopify', href: '/help/documentation/integrations/shopify', badge: 'E-commerce' },
        { title: 'WooCommerce', href: '/help/documentation/integrations/woocommerce', badge: 'WordPress' },
        { title: 'BigCommerce', href: '/help/documentation/integrations/bigcommerce', badge: 'E-commerce' },
        { title: 'Magento', href: '/help/documentation/integrations/magento', badge: 'Enterprise' },
        { title: 'PrestaShop', href: '/help/documentation/integrations/prestashop', badge: 'E-commerce' },
        { title: 'Printful', href: '/help/documentation/integrations/printful', badge: 'POD' },
        { title: 'Printify', href: '/help/documentation/integrations/printify', badge: 'POD' },
        { title: 'Zapier', href: '/help/documentation/integrations/zapier', badge: 'Automation' },
        { title: 'Make', href: '/help/documentation/integrations/make', badge: 'Automation' },
        { title: 'Stripe', href: '/help/documentation/integrations/stripe', badge: 'Payments' }
      ]
    },
    {
      title: 'Security & Compliance',
      icon: <Lock className="w-6 h-6 sm:w-8 sm:h-8" />,
      color: 'gray',
      description: 'Sécurité enterprise-grade',
      links: [
        { title: 'Authentication & SSO', href: '/help/documentation/security/authentication', badge: 'OAuth' },
        { title: 'Best Practices', href: '/help/documentation/security/best-practices', badge: 'Guide' },
        { title: 'GDPR Compliance', href: '/help/documentation/security/gdpr', badge: 'EU' },
        { title: 'SSL/TLS', href: '/help/documentation/security/ssl-tls', badge: 'Encryption' },
        { title: 'Audit logs', href: '/help/documentation/security/audit', badge: 'Tracking' }
      ]
    },
    {
      title: 'Configuration',
      icon: <Settings className="w-6 h-6 sm:w-8 sm:h-8" />,
      color: 'slate',
      description: 'Paramètres et configuration',
      links: [
        { title: 'Variables d\'environnement', href: '/help/documentation/configuration/environment-variables', badge: 'Env' },
        { title: 'Configuration initiale', href: '/help/documentation/configuration/setup', badge: 'Setup' },
        { title: 'Paramètres avancés', href: '/help/documentation/configuration/advanced', badge: 'Advanced' },
        { title: 'Monitoring', href: '/help/documentation/configuration/monitoring', badge: 'Metrics' }
      ]
    },
    {
      title: 'Deployment',
      icon: <Zap className="w-6 h-6 sm:w-8 sm:h-8" />,
      color: 'violet',
      description: 'Déploiement et infrastructure',
      links: [
        { title: 'Vercel', href: '/help/documentation/deployment/vercel', badge: 'Serverless' },
        { title: 'Docker', href: '/help/documentation/deployment/docker', badge: 'Container' },
        { title: 'Kubernetes', href: '/help/documentation/deployment/kubernetes', badge: 'K8s' },
        { title: 'CDN & Caching', href: '/help/documentation/deployment/cdn', badge: 'Performance' }
      ]
    }
  ], []);

  const quickLinks = useMemo(() => ['Démarrage rapide', 'API Reference', 'Exemples', 'Vidéos'], []);

  const exampleCode = useMemo(() => `import { LuneoCustomizer } from '@luneo/react';

function ProductPage() {
  return (
    <LuneoCustomizer
      productId="prod_abc123"
      apiKey={process.env.LUNEO_API_KEY}
      onSave={(design) => {
        router.push(\`/checkout?design=\${design.id}\`);
      }}
      features={{
        textTool: true,
        imageTool: true,
        templates: true,
        aiGeneration: true
      }}
    />
  );
}`, []);

  const handleCopyCode = useCallback(() => {
    navigator.clipboard.writeText(exampleCode);
  }, [exampleCode]);

  return (
    <div className="min-h-screen bg-gray-900">
      <section className="bg-gradient-to-br from-gray-900 via-black to-blue-900 py-12 sm:py-16 md:py-20 lg:py-24 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
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
                Guides complets, API references, exemples de code et best practices pour maîtriser la plateforme Luneo
              </p>
            </motion.div>

            <div className="relative max-w-2xl mx-auto">
              <input
                type="text"
                placeholder="Rechercher dans la documentation..."
                className="w-full px-4 sm:px-6 py-3 sm:py-4 rounded-full bg-gray-800/50 border-2 border-gray-600 focus:border-blue-400 focus:outline-none text-sm sm:text-base text-white placeholder-gray-400"
              />
              <Button className="absolute right-2 top-2 bg-gradient-to-r from-blue-600 to-purple-600 text-sm sm:text-base">
                Rechercher
              </Button>
            </div>

            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-6 sm:mt-8">
              {quickLinks.map(link => (
                <Link key={link} href={`#${link.toLowerCase().replace(' ', '-')}`}>
                  <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                    {link}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 md:py-20 bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {sections.map((section, index) => (
              <motion.div
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
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-8 sm:mb-12">
            Exemple: Intégrer le Customizer en 5 minutes
          </h2>
          
          <Card className="p-4 sm:p-6 md:p-8 bg-gray-900 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-blue-400" />
                <span className="text-xs sm:text-sm font-mono text-gray-400">customizer.tsx</span>
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
            <Link href="/help/documentation/quickstart">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-sm sm:text-base">
                Voir le guide complet
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 md:py-20 bg-gray-900 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8">
          <MessageSquare className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-6 text-blue-400" />
          
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
            Besoin d'aide?
          </h2>
          
          <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-8">
            Notre équipe technique est là pour vous accompagner 24/7
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 w-full sm:w-auto">
                Contacter le support
              </Button>
            </Link>
            <Link href="/help">
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
