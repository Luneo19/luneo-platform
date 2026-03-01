'use client';

import React, { memo, useMemo } from 'react';

import { Shield, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function SecurityPageContent() {
  const sections = useMemo(() => [
    {
      title: 'Authentification',
      description: 'JWT, OAuth, et gestion des tokens',
      href: '/help/documentation/security/authentication',
      icon: '🔑'
    },
    {
      title: 'SSL/TLS',
      description: 'Certificats SSL et sécurisation HTTPS',
      href: '/help/documentation/security/ssl-tls',
      icon: '🔒'
    },
    {
      title: 'RGPD',
      description: 'Conformité RGPD et protection des données',
      href: '/help/documentation/security/gdpr',
      icon: '🛡️'
    },
    {
      title: 'Bonnes pratiques',
      description: 'Recommandations de sécurité pour votre intégration',
      href: '/help/documentation/security/best-practices',
      icon: '✅'
    }
  ], []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 md:p-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <motion
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center text-sm text-gray-400 mb-6">
            <Link href="/help/documentation" className="hover:text-white">
              Documentation
            </Link>
            <span className="mx-2">›</span>
            <span className="text-white">Sécurité</span>
          </div>

          <div className="mb-12">
            <Shield className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mb-6 text-purple-400" />
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4">
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Sécurité
              </span>
            </h1>
            <p className="text-xl text-gray-300">
              Bonnes pratiques et guides de sécurité pour protéger votre intégration Luneo.
            </p>
          </div>

          <div className="grid min-[480px]:grid-cols-2 gap-4 sm:gap-6">
            {sections.map((section, index) => (
              <motion
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Link href={section.href}>
                  <Card className="bg-gray-800 border-gray-700 p-6 hover:border-purple-500/50 transition-all h-full group">
                    <div className="text-4xl mb-4">{section.icon}</div>
                    <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-purple-400 transition-colors">
                      {section.title}
                    </h3>
                    <p className="text-gray-300 mb-4">{section.description}</p>
                    <div className="flex items-center text-purple-400 text-sm font-medium">
                      Lire la documentation
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </div>
                  </Card>
                </Link>
              </motion>
            ))}
          </div>

          <div className="mt-12 bg-purple-900/20 border border-purple-500/50 rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center">
              <Shield className="w-6 h-6 mr-2 text-purple-400" />
              Sécurité de niveau bancaire
            </h2>
            <p className="text-gray-300">
              Luneo utilise les meilleures pratiques de sécurité : chiffrement end-to-end, conformité RGPD/PCI-DSS, audits réguliers, et monitoring 24/7.
            </p>
          </div>
        </motion>
      </div>
    </div>
  );
}

const SecurityPageMemo = memo(SecurityPageContent);

export default function SecurityPage() {
  return (
    <ErrorBoundary componentName="SecurityPage">
      <SecurityPageMemo />
    </ErrorBoundary>
  );
}
