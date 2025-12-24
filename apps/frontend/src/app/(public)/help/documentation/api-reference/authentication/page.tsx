'use client';

import React, { memo, useMemo } from 'react';
import { Shield, Key, Lock, ArrowRight, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function AuthenticationPageContent() {
  const jwtLoginExample = useMemo(() => `POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password"
}`, []);

  const jwtTokenExample = useMemo(() => `Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`, []);

  const oauthProviders = useMemo(() => [
    {
      name: 'Google OAuth',
      description: 'Redirection vers Google',
      endpoint: 'GET /api/auth/google'
    },
    {
      name: 'GitHub OAuth',
      description: 'Redirection vers GitHub',
      endpoint: 'GET /api/auth/github'
    }
  ], []);

  const apiKeyCreateExample = useMemo(() => `POST /api/api-keys
Authorization: Bearer <jwt_token>
{
  "name": "Mon Application",
  "permissions": ["read", "write"]
}`, []);

  const apiKeyUseExample = useMemo(() => `Authorization: Bearer luneo_sk_1234567890abcdef...`, []);

  const bestPractices = useMemo(() => ({
    do: [
      'Utilisez HTTPS en production',
      'Stockez les tokens de manière sécurisée',
      'Renouvelez les tokens régulièrement',
      'Utilisez des scopes OAuth appropriés',
      'Validez les tokens côté serveur'
    ],
    dont: [
      'Exposer les tokens dans les logs',
      'Stocker les tokens en local storage',
      'Partager les clés API publiquement',
      'Ignorer les erreurs d\'authentification',
      'Utiliser des tokens expirés'
    ]
  }), []);

  return (
    <DocPageTemplate
      title="Authentification"
      description="Sécurisez votre intégration avec JWT, OAuth et les clés API"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'API Reference', href: '/help/documentation/api-reference' },
        { label: 'Authentification', href: '/help/documentation/api-reference/authentication' }
      ]}
      relatedLinks={[
        { title: 'Endpoints principaux', href: '/help/documentation/api-reference/endpoints', description: 'Liste des endpoints' },
        { title: 'Bonnes pratiques sécurité', href: '/help/documentation/security/best-practices', description: 'Guide sécurité' }
      ]}
    >
      <section className="bg-gray-800 border border-gray-700 rounded-2xl p-6 mb-6">
        <div className="flex items-center mb-6">
          <Key className="w-8 h-8 text-blue-400 mr-3" />
          <h2 className="text-2xl font-bold">JWT (JSON Web Token)</h2>
        </div>
        <p className="text-gray-300 mb-4">
          Méthode recommandée pour l'authentification API. Obtenez un token via OAuth ou connexion directe.
        </p>
        <div className="bg-gray-900 rounded-lg p-4 mb-4">
          <h3 className="text-lg font-semibold mb-2">Endpoint de connexion</h3>
          <pre className="text-sm text-gray-300 overflow-x-auto">
            <code>{jwtLoginExample}</code>
          </pre>
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Utilisation du token</h3>
          <pre className="text-sm text-gray-300 overflow-x-auto">
            <code>{jwtTokenExample}</code>
          </pre>
        </div>
      </section>

      <section className="bg-gray-800 border border-gray-700 rounded-2xl p-6 mb-6">
        <div className="flex items-center mb-6">
          <Lock className="w-8 h-8 text-green-400 mr-3" />
          <h2 className="text-2xl font-bold">OAuth 2.0</h2>
        </div>
        <p className="text-gray-300 mb-4">
          Authentification via Google, GitHub et autres fournisseurs OAuth.
        </p>
        <div className="grid min-[480px]:grid-cols-2 gap-4">
          {oauthProviders.map((provider, index) => (
            <div key={index} className="bg-gray-900 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2">{provider.name}</h3>
              <p className="text-gray-300 text-sm mb-2">{provider.description}</p>
              <code className="text-blue-400 text-sm">{provider.endpoint}</code>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gray-800 border border-gray-700 rounded-2xl p-6 mb-6">
        <div className="flex items-center mb-6">
          <Key className="w-8 h-8 text-purple-400 mr-3" />
          <h2 className="text-2xl font-bold">Clés API</h2>
        </div>
        <p className="text-gray-300 mb-4">
          Pour les intégrations server-to-server et les applications tierces.
        </p>
        <div className="bg-gray-900 rounded-lg p-4 mb-4">
          <h3 className="text-lg font-semibold mb-2">Créer une clé API</h3>
          <pre className="text-sm text-gray-300 overflow-x-auto">
            <code>{apiKeyCreateExample}</code>
          </pre>
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Utiliser la clé API</h3>
          <pre className="text-sm text-gray-300 overflow-x-auto">
            <code>{apiKeyUseExample}</code>
          </pre>
        </div>
      </section>

      <section className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
        <h2 className="text-2xl font-bold mb-6">Bonnes pratiques de sécurité</h2>
        <div className="grid min-[480px]:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-green-400 mb-3">✅ À faire</h3>
            <ul className="space-y-2 text-gray-300">
              {bestPractices.do.map((item, index) => (
                <li key={index}>• {item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-red-400 mb-3">❌ À éviter</h3>
            <ul className="space-y-2 text-gray-300">
              {bestPractices.dont.map((item, index) => (
                <li key={index}>• {item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <div className="mt-12 flex flex-col sm:flex-row gap-4">
        <Link href="/help/documentation/api-reference/endpoints">
          <button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center">
            Endpoints principaux
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </Link>
        <Link href="/help/documentation/security/best-practices">
          <button className="w-full sm:w-auto bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center">
            Bonnes pratiques sécurité
            <ExternalLink className="w-4 h-4 ml-2" />
          </button>
        </Link>
      </div>
    </DocPageTemplate>
  );
}

const AuthenticationPageMemo = memo(AuthenticationPageContent);

export default function AuthenticationPage() {
  return (
    <ErrorBoundary componentName="AuthenticationPage">
      <AuthenticationPageMemo />
    </ErrorBoundary>
  );
}
