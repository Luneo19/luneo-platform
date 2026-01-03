'use client';

import React, { memo, useMemo } from 'react';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { Shield, Lock, CheckCircle, AlertTriangle, ArrowRight, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function SSLTLSPageContent() {
  const certificates = useMemo(() => [
    {
      name: 'Certificats Let\'s Encrypt',
      color: 'text-green-400',
      features: [
        'Renouvellement automatique',
        'Validation ACME',
        'Support multi-domaines',
        'Gratuit et fiable'
      ]
    },
    {
      name: 'Certificats Enterprise',
      color: 'text-blue-400',
      features: [
        'Validation étendue (EV)',
        'Support 24/7',
        'Assurance garantie',
        'Personnalisation avancée'
      ]
    }
  ], []);

  const tlsVersions = useMemo(() => [
    { version: 'TLS 1.3', status: 'Recommandé', icon: CheckCircle, color: 'text-green-400' },
    { version: 'TLS 1.2', status: 'Supporté', icon: CheckCircle, color: 'text-green-400' },
    { version: 'TLS 1.1', status: 'Déprécié', icon: AlertTriangle, color: 'text-red-400' },
    { version: 'TLS 1.0', status: 'Déprécié', icon: AlertTriangle, color: 'text-red-400' }
  ], []);

  const nginxConfig = useMemo(() => `server {
  listen 443 ssl http2;
  server_name api.luneo.app;
  
  ssl_certificate /etc/letsencrypt/live/api.luneo.app/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/api.luneo.app/privkey.pem;
  
  # TLS Configuration
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
  ssl_prefer_server_ciphers off;
  
  # Security Headers
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  add_header X-Frame-Options DENY always;
  add_header X-Content-Type-Options nosniff always;
}`, []);

  const securityFeatures = useMemo(() => [
    {
      title: 'Perfect Forward Secrecy',
      description: 'Chaque session utilise des clés uniques, protégeant les communications passées même en cas de compromission.',
      code: 'ECDHE + ChaCha20-Poly1305',
      color: 'text-purple-400'
    },
    {
      title: 'OCSP Stapling',
      description: 'Vérification en temps réel du statut des certificats sans latence supplémentaire.',
      code: 'ssl_stapling on;',
      color: 'text-blue-400'
    },
    {
      title: 'HSTS (HTTP Strict Transport Security)',
      description: 'Force l\'utilisation de HTTPS et empêche les attaques de downgrade.',
      code: 'Strict-Transport-Security: max-age=31536000',
      color: 'text-green-400'
    },
    {
      title: 'Certificate Transparency',
      description: 'Surveillance publique des certificats pour détecter les certificats malveillants.',
      code: 'Expect-CT: max-age=86400',
      color: 'text-orange-400'
    }
  ], []);

  const testTools = useMemo(() => [
    {
      name: 'SSL Labs Test',
      description: 'Testez la configuration SSL de votre domaine avec l\'outil de référence.',
      url: 'https://www.ssllabs.com/ssltest/analyze.html?d=api.luneo.app'
    },
    {
      name: 'Mozilla SSL Configuration Generator',
      description: 'Générateur de configuration SSL recommandée par Mozilla.',
      url: 'https://ssl-config.mozilla.org/'
    }
  ], []);

  return (
    <DocPageTemplate
      title="SSL/TLS"
      description="Sécurisation des communications avec chiffrement SSL/TLS de niveau bancaire"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'Sécurité', href: '/help/documentation/security' },
        { label: 'SSL/TLS', href: '/help/documentation/security/ssl-tls' }
      ]}
      relatedLinks={[
        { title: 'Conformité RGPD', href: '/help/documentation/security/gdpr', description: 'Protection des données' },
        { title: 'Bonnes pratiques', href: '/help/documentation/security/best-practices', description: 'Recommandations sécurité' }
      ]}
    >
      <section className="bg-gray-800 border border-gray-700 rounded-2xl p-6 mb-6">
        <div className="flex items-center mb-6">
          <Shield className="w-8 h-8 text-green-400 mr-3" />
          <h2 className="text-2xl font-bold">Certificats SSL</h2>
        </div>
        <div className="grid min-[480px]:grid-cols-2 gap-4 sm:gap-6">
          {certificates.map((cert, index) => (
            <div key={index} className="bg-gray-900 rounded-lg p-6">
              <h3 className={`text-lg font-semibold ${cert.color} mb-3`}>{cert.name}</h3>
              <ul className="space-y-2 text-gray-300">
                {cert.features.map((feature, i) => (
                  <li key={i}>• {feature}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gray-800 border border-gray-700 rounded-2xl p-6 mb-6">
        <div className="flex items-center mb-6">
          <Lock className="w-8 h-8 text-blue-400 mr-3" />
          <h2 className="text-2xl font-bold">Configuration TLS</h2>
        </div>
        <div className="bg-gray-900 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-3">Versions TLS Supportées</h3>
          <div className="grid min-[480px]:grid-cols-2 gap-4">
            {tlsVersions.map((tls, index) => {
              const Icon = tls.icon;
              return (
                <div key={index} className="flex items-center">
                  <Icon className={`w-5 h-5 ${tls.color} mr-2`} />
                  <span className="text-gray-300">{tls.version} ({tls.status})</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-gray-900 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3">Configuration Nginx</h3>
          <pre className="text-sm text-gray-300 overflow-x-auto">
            <code>{nginxConfig}</code>
          </pre>
        </div>
      </section>

      <section className="bg-gray-800 border border-gray-700 rounded-2xl p-6 mb-6">
        <h2 className="text-2xl font-bold mb-6">Fonctionnalités de Sécurité</h2>
        <div className="grid min-[480px]:grid-cols-2 gap-4 sm:gap-6">
          {securityFeatures.map((feature, index) => (
            <div key={index} className="bg-gray-900 rounded-lg p-6">
              <h3 className={`text-lg font-semibold ${feature.color} mb-3`}>{feature.title}</h3>
              <p className="text-gray-300 text-sm mb-3">{feature.description}</p>
              <div className="bg-gray-800 rounded p-3">
                <code className="text-blue-400 text-sm">{feature.code}</code>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
        <h2 className="text-2xl font-bold mb-6">Tests de Sécurité</h2>
        <div className="space-y-4">
          {testTools.map((tool, index) => (
            <div key={index} className="bg-gray-900 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2">{tool.name}</h3>
              <p className="text-gray-300 text-sm mb-3">{tool.description}</p>
              <div className="bg-gray-800 rounded p-3">
                <code className="text-blue-400 text-sm">{tool.url}</code>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-12 flex flex-col sm:flex-row gap-4">
        <Link href="/help/documentation/security/gdpr">
          <button className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center">
            Conformité RGPD
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </Link>
        <Link href="/help/documentation/security/best-practices">
          <button className="w-full sm:w-auto bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center">
            Bonnes pratiques
            <ExternalLink className="w-4 h-4 ml-2" />
          </button>
        </Link>
      </div>
    </DocPageTemplate>
  );
}

const SSLTLSPageMemo = memo(SSLTLSPageContent);

export default function SSLTLSPage() {
  return (
    <ErrorBoundary componentName="SSLTLSPage">
      <SSLTLSPageMemo />
    </ErrorBoundary>
  );
}
