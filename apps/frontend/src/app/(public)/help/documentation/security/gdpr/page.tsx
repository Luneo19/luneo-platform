'use client';

import React, { memo, useMemo } from 'react';

import { Shield, Download, Trash2, Lock, Eye, CheckCircle, FileText, Users, Database, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function GDPRPageContent() {
  const rights = useMemo(() => [
    {
      icon: <Eye className="w-6 h-6" />,
      title: 'Droit d\'accès',
      description: 'Consultez toutes les données que nous détenons sur vous',
      api: 'GET /api/gdpr/export'
    },
    {
      icon: <Download className="w-6 h-6" />,
      title: 'Droit à la portabilité',
      description: 'Téléchargez vos données dans un format structuré',
      api: 'GET /api/gdpr/export'
    },
    {
      icon: <Trash2 className="w-6 h-6" />,
      title: 'Droit à l\'oubli',
      description: 'Supprimez définitivement votre compte et vos données',
      api: 'DELETE /api/gdpr/delete-account'
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: 'Droit de rectification',
      description: 'Modifiez vos informations personnelles à tout moment',
      api: 'PATCH /api/profile'
    }
  ], []);

  const exportDataItems = useMemo(() => [
    'Profil utilisateur',
    'Designs créés',
    'Produits',
    'Commandes',
    'Intégrations',
    'Paramètres'
  ], []);

  const protectionMeasures = useMemo(() => [
    {
      icon: <Database className="w-6 h-6" />,
      title: 'Chiffrement des données',
      description: 'Chiffrement AES-256 au repos et TLS 1.3 en transit'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Hébergement sécurisé',
      description: 'Données hébergées dans l\'UE (conformité RGPD)'
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Minimisation des données',
      description: 'Collecte uniquement des données nécessaires'
    },
    {
      icon: <FileText className="w-6 h-6" />,
      title: 'Audit logs',
      description: 'Traçabilité complète de tous les accès'
    }
  ], []);

  return (
    <DocPageTemplate
      title="Conformité RGPD"
      description="Luneo Platform est 100% conforme au Règlement Général sur la Protection des Données"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'Sécurité', href: '/help/documentation/security' },
        { label: 'RGPD', href: '/help/documentation/security/gdpr' }
      ]}
      relatedLinks={[
        { title: 'Sécurité', href: '/help/documentation/security', description: 'Retour à la sécurité' },
        { title: 'SSL/TLS', href: '/help/documentation/security/ssl-tls', description: 'Sécurisation HTTPS' }
      ]}
    >
      <motion
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-12"
      >
        <Card className="bg-blue-900/20 border-blue-700 p-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <CheckCircle className="w-6 h-6 mr-2 text-green-400" />
            Nous respectons vos données
          </h2>
          <p className="text-gray-300">
            Luneo Platform implémente toutes les exigences du RGPD pour garantir la protection de vos données personnelles et celles de vos clients.
          </p>
        </Card>
      </motion>

      <motion
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-12"
      >
        <h2 className="text-3xl font-bold mb-6">Vos Droits RGPD</h2>
        <div className="grid min-[480px]:grid-cols-2 gap-4 sm:gap-6">
          {rights.map((right, index) => (
            <Card key={index} className="bg-gray-800/50 border-gray-700 p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-400">
                  {right.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold mb-2">{right.title}</h3>
                  <p className="text-sm text-gray-400 mb-3">{right.description}</p>
                  <code className="text-xs bg-gray-900 px-2 py-1 rounded text-blue-300">
                    {right.api}
                  </code>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </motion>

      <motion
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-12"
      >
        <h2 className="text-3xl font-bold mb-6">API GDPR</h2>
        <Card className="bg-gray-800/50 border-gray-700 p-6 mb-6">
          <h3 className="text-xl font-bold mb-4">Exporter vos données</h3>
          <p className="text-gray-400 mb-4">
            Récupérez toutes vos données dans un format JSON structuré
          </p>
          <div className="bg-gray-900 p-4 rounded-lg mb-4">
            <code className="text-sm text-green-400">
              GET /api/gdpr/export<br />
              Authorization: Bearer YOUR_TOKEN
            </code>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            Retourne un fichier JSON contenant:
          </p>
          <ul className="space-y-2 mb-4">
            {exportDataItems.map((item, i) => (
              <li key={i} className="flex items-center text-sm text-gray-300">
                <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                {item}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700 p-6">
          <h3 className="text-xl font-bold mb-4 text-red-400">Supprimer votre compte</h3>
          <p className="text-gray-400 mb-4">
            Suppression définitive et irréversible de toutes vos données
          </p>
          <div className="bg-gray-900 p-4 rounded-lg mb-4">
            <code className="text-sm text-red-400">
              DELETE /api/gdpr/delete-account<br />
              Authorization: Bearer YOUR_TOKEN
            </code>
          </div>
          <div className="bg-red-900/20 border border-red-700 p-4 rounded-lg">
            <p className="text-sm text-red-300">
              ⚠️ <strong>Attention:</strong> Cette action est irréversible. Toutes vos données seront définitivement supprimées de nos serveurs dans un délai de 30 jours.
            </p>
          </div>
        </Card>
      </motion>

      <motion
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-12"
      >
        <h2 className="text-3xl font-bold mb-6">Nos Mesures de Protection</h2>
        <div className="grid min-[480px]:grid-cols-2 gap-4 sm:gap-6">
          {protectionMeasures.map((measure, index) => (
            <div key={index} className="flex items-start space-x-4 p-4 bg-gray-800/30 rounded-lg">
              <div className="flex-shrink-0 text-blue-400">
                {measure.icon}
              </div>
              <div>
                <h3 className="font-bold mb-1">{measure.title}</h3>
                <p className="text-sm text-gray-400">{measure.description}</p>
              </div>
            </div>
          ))}
        </div>
      </motion>

      <motion
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-center bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-700 rounded-xl p-6 sm:p-8"
      >
        <h2 className="text-2xl font-bold mb-4">Des questions sur le RGPD?</h2>
        <p className="text-gray-400 mb-6">
          Notre équipe juridique est à votre disposition
        </p>
        <Link href="/contact">
          <Button size="lg" variant="outline" className="border-blue-500 text-blue-400 hover:bg-blue-600 hover:text-white">
            Nous contacter
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </Link>
      </motion>
    </DocPageTemplate>
  );
}

const GDPRPageMemo = memo(GDPRPageContent);

export default function GDPRPage() {
  return (
    <ErrorBoundary componentName="GDPRPage">
      <GDPRPageMemo />
    </ErrorBoundary>
  );
}
