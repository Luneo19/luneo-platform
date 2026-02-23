'use client';

import React, { memo, useMemo } from 'react';
import { ArrowRight, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

interface Endpoint {
  method: string;
  path: string;
  description: string;
  docLink?: string;
  color: string;
}

function EndpointsPageContent() {
  const baseUrl = useMemo(() => 'https://api.luneo.app/api/v1', []);

  const authEndpoints: Endpoint[] = useMemo(() => [
    { method: 'POST', path: '/auth/signup', description: 'Créer un nouveau compte utilisateur', color: 'bg-green-600' },
    { method: 'POST', path: '/auth/login', description: 'Authentification et obtention du JWT', color: 'bg-green-600' },
    { method: 'POST', path: '/auth/refresh', description: 'Renouveler le token d\'accès', color: 'bg-green-600' },
    { method: 'POST', path: '/auth/logout', description: 'Révoquer le refresh token', color: 'bg-green-600' },
    { method: 'GET', path: '/auth/me', description: 'Récupérer le profil de l\'utilisateur connecté', color: 'bg-blue-600' },
  ], []);

  const agentEndpoints: Endpoint[] = useMemo(() => [
    { method: 'POST', path: '/agents', description: 'Créer un nouvel agent IA', docLink: '/help/documentation/api-reference/designs', color: 'bg-green-600' },
    { method: 'GET', path: '/agents', description: 'Lister tous les agents avec pagination', docLink: '/help/documentation/api-reference/designs', color: 'bg-blue-600' },
    { method: 'GET', path: '/agents/{agentId}', description: 'Récupérer les détails et statistiques d\'un agent', docLink: '/help/documentation/api-reference/designs', color: 'bg-blue-600' },
    { method: 'PATCH', path: '/agents/{agentId}', description: 'Mettre à jour la configuration d\'un agent', docLink: '/help/documentation/api-reference/designs', color: 'bg-yellow-600' },
    { method: 'DELETE', path: '/agents/{agentId}', description: 'Supprimer un agent et ses données', docLink: '/help/documentation/api-reference/designs', color: 'bg-red-600' },
    { method: 'POST', path: '/agents/{agentId}/test', description: 'Tester un agent dans le playground', color: 'bg-green-600' },
  ], []);

  const conversationEndpoints: Endpoint[] = useMemo(() => [
    { method: 'POST', path: '/conversations', description: 'Démarrer une nouvelle conversation', docLink: '/help/documentation/api-reference/orders', color: 'bg-green-600' },
    { method: 'GET', path: '/conversations', description: 'Lister les conversations avec filtres', docLink: '/help/documentation/api-reference/orders', color: 'bg-blue-600' },
    { method: 'GET', path: '/conversations/{conversationId}', description: 'Récupérer une conversation avec ses messages', docLink: '/help/documentation/api-reference/orders', color: 'bg-blue-600' },
    { method: 'POST', path: '/conversations/{conversationId}/messages', description: 'Envoyer un message (réponse synchrone)', docLink: '/help/documentation/api-reference/orders', color: 'bg-green-600' },
    { method: 'POST', path: '/conversations/{conversationId}/messages/stream', description: 'Envoyer un message (réponse en streaming SSE)', docLink: '/help/documentation/api-reference/orders', color: 'bg-green-600' },
    { method: 'PATCH', path: '/conversations/{conversationId}', description: 'Clôturer ou archiver une conversation', docLink: '/help/documentation/api-reference/orders', color: 'bg-yellow-600' },
  ], []);

  const knowledgeEndpoints: Endpoint[] = useMemo(() => [
    { method: 'POST', path: '/knowledge-bases', description: 'Créer une base de connaissances', color: 'bg-green-600' },
    { method: 'GET', path: '/knowledge-bases', description: 'Lister les bases de connaissances', color: 'bg-blue-600' },
    { method: 'GET', path: '/knowledge-bases/{kbId}', description: 'Détails d\'une base de connaissances', color: 'bg-blue-600' },
    { method: 'POST', path: '/knowledge-bases/{kbId}/documents', description: 'Ajouter un document (PDF, URL, texte)', color: 'bg-green-600' },
    { method: 'GET', path: '/knowledge-bases/{kbId}/documents', description: 'Lister les documents indexés', color: 'bg-blue-600' },
    { method: 'DELETE', path: '/knowledge-bases/{kbId}/documents/{docId}', description: 'Supprimer un document de la base', color: 'bg-red-600' },
    { method: 'POST', path: '/knowledge-bases/{kbId}/search', description: 'Recherche sémantique dans la base', color: 'bg-green-600' },
  ], []);

  const widgetEndpoints: Endpoint[] = useMemo(() => [
    { method: 'POST', path: '/widget/init', description: 'Initialiser une session widget (clé publique)', docLink: '/help/documentation/api-reference/js-sdk', color: 'bg-green-600' },
    { method: 'POST', path: '/widget/message', description: 'Envoyer un message depuis le widget', docLink: '/help/documentation/api-reference/js-sdk', color: 'bg-green-600' },
    { method: 'GET', path: '/widget/config/{agentId}', description: 'Récupérer la config du widget pour un agent', color: 'bg-blue-600' },
  ], []);

  const analyticsEndpoints: Endpoint[] = useMemo(() => [
    { method: 'GET', path: '/analytics/overview', description: 'Métriques globales du compte', color: 'bg-blue-600' },
    { method: 'GET', path: '/analytics/agents/{agentId}', description: 'Métriques détaillées d\'un agent', color: 'bg-blue-600' },
    { method: 'GET', path: '/analytics/conversations', description: 'Statistiques des conversations', color: 'bg-blue-600' },
    { method: 'GET', path: '/analytics/satisfaction', description: 'Scores de satisfaction CSAT', color: 'bg-blue-600' },
    { method: 'GET', path: '/analytics/export', description: 'Export CSV des données analytics', color: 'bg-blue-600' },
  ], []);

  const webhookEndpoints: Endpoint[] = useMemo(() => [
    { method: 'POST', path: '/webhooks', description: 'Enregistrer un endpoint webhook', color: 'bg-green-600' },
    { method: 'GET', path: '/webhooks', description: 'Lister les webhooks configurés', color: 'bg-blue-600' },
    { method: 'DELETE', path: '/webhooks/{webhookId}', description: 'Supprimer un webhook', color: 'bg-red-600' },
    { method: 'POST', path: '/webhooks/{webhookId}/test', description: 'Envoyer un événement de test', color: 'bg-green-600' },
  ], []);

  const sections = useMemo(() => [
    { title: 'Authentification', endpoints: authEndpoints },
    { title: 'Agents', endpoints: agentEndpoints },
    { title: 'Conversations', endpoints: conversationEndpoints },
    { title: 'Bases de connaissances', endpoints: knowledgeEndpoints },
    { title: 'Widget', endpoints: widgetEndpoints },
    { title: 'Analytics', endpoints: analyticsEndpoints },
    { title: 'Webhooks', endpoints: webhookEndpoints },
  ], [authEndpoints, agentEndpoints, conversationEndpoints, knowledgeEndpoints, widgetEndpoints, analyticsEndpoints, webhookEndpoints]);

  return (
    <DocPageTemplate
      title="Endpoints principaux"
      description="Référence complète de tous les endpoints de l'API REST Luneo"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'API Reference', href: '/help/documentation/api-reference' },
        { label: 'Endpoints', href: '/help/documentation/api-reference/endpoints' }
      ]}
      relatedLinks={[
        { title: 'Agents API', href: '/help/documentation/api-reference/designs', description: 'Documentation détaillée des agents' },
        { title: 'Conversations API', href: '/help/documentation/api-reference/orders', description: 'Documentation des conversations' },
        { title: 'Widget SDK', href: '/help/documentation/api-reference/js-sdk', description: 'Intégration du widget chat' }
      ]}
    >
      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4">URL de base</h2>
        <div className="bg-gray-900 rounded-lg p-4">
          <code className="text-blue-400 text-lg">{baseUrl}</code>
        </div>
        <p className="text-gray-400 text-sm mt-3">
          Toutes les requêtes nécessitent le header <code className="text-blue-400">Authorization: Bearer YOUR_JWT_TOKEN</code> sauf les endpoints widget (clé publique) et auth (signup/login).
        </p>
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 mb-8">
        <h2 className="text-lg font-bold mb-3">Légende des méthodes</h2>
        <div className="flex flex-wrap gap-3">
          <span className="bg-green-600 text-white px-3 py-1 rounded text-sm font-mono">POST</span>
          <span className="text-gray-400 text-sm">Création / Action</span>
          <span className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-mono">GET</span>
          <span className="text-gray-400 text-sm">Lecture</span>
          <span className="bg-yellow-600 text-white px-3 py-1 rounded text-sm font-mono">PATCH</span>
          <span className="text-gray-400 text-sm">Mise à jour</span>
          <span className="bg-red-600 text-white px-3 py-1 rounded text-sm font-mono">DELETE</span>
          <span className="text-gray-400 text-sm">Suppression</span>
        </div>
      </div>

      {sections.map((section) => (
        <section key={section.title} className="bg-gray-800 border border-gray-700 rounded-2xl p-6 mb-6">
          <h2 className="text-2xl font-bold mb-6">{section.title}</h2>
          <div className="space-y-4">
            {section.endpoints.map((endpoint, index) => (
              <div key={index} className="bg-gray-900 rounded-lg p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
                  <span className={`${endpoint.color} text-white px-2 py-1 rounded text-sm font-mono w-fit`}>
                    {endpoint.method}
                  </span>
                  <code className="text-blue-400 text-sm">{endpoint.path}</code>
                </div>
                <p className="text-gray-300 text-sm mb-2">{endpoint.description}</p>
                {endpoint.docLink && (
                  <Link href={endpoint.docLink} className="text-blue-400 hover:underline text-sm">
                    Voir la documentation →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}

      <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 mb-6">
        <h2 className="text-2xl font-bold mb-4">Codes de réponse</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-gray-400 border-b border-gray-700">
              <tr>
                <th className="py-2 pr-4">Code</th>
                <th className="py-2">Description</th>
              </tr>
            </thead>
            <tbody className="text-gray-300">
              <tr className="border-b border-gray-800">
                <td className="py-2 pr-4 font-mono text-green-400">200</td>
                <td className="py-2">Succès</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-2 pr-4 font-mono text-green-400">201</td>
                <td className="py-2">Ressource créée</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-2 pr-4 font-mono text-yellow-400">400</td>
                <td className="py-2">Requête invalide (paramètres manquants ou incorrects)</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-2 pr-4 font-mono text-yellow-400">401</td>
                <td className="py-2">Non authentifié (token manquant ou expiré)</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-2 pr-4 font-mono text-yellow-400">403</td>
                <td className="py-2">Accès interdit (permissions insuffisantes ou limite de plan)</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-2 pr-4 font-mono text-yellow-400">404</td>
                <td className="py-2">Ressource non trouvée</td>
              </tr>
              <tr className="border-b border-gray-800">
                <td className="py-2 pr-4 font-mono text-red-400">429</td>
                <td className="py-2">Rate limit dépassé — réessayez après le délai indiqué dans Retry-After</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-mono text-red-400">500</td>
                <td className="py-2">Erreur serveur interne</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-12 flex flex-col sm:flex-row gap-4">
        <Link href="/help/documentation/api-reference/designs">
          <button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center">
            Agents API
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </Link>
        <Link href="/help/documentation/api-reference/orders">
          <button className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center">
            Conversations API
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </Link>
        <Link href="/help/documentation/api-reference/js-sdk">
          <button className="w-full sm:w-auto bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center">
            Widget SDK
            <ExternalLink className="w-4 h-4 ml-2" />
          </button>
        </Link>
      </div>
    </DocPageTemplate>
  );
}

const EndpointsPageMemo = memo(EndpointsPageContent);

export default function EndpointsPage() {
  return (
    <ErrorBoundary componentName="EndpointsPage">
      <EndpointsPageMemo />
    </ErrorBoundary>
  );
}
