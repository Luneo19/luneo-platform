'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Eye, Download, Trash2 } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function GDPRPageContent() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Link>

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">
              RGPD & Protection des Données
            </h1>
          </div>
          <p className="text-lg text-gray-600">
            Luneo est conforme au Règlement Général sur la Protection des Données (RGPD)
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-4 gap-4 mb-12">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <Eye className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900 mb-1">Accéder</h3>
            <p className="text-xs text-gray-600">À vos données</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <Download className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900 mb-1">Exporter</h3>
            <p className="text-xs text-gray-600">Vos données</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 text-center">
            <Shield className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900 mb-1">Modifier</h3>
            <p className="text-xs text-gray-600">Vos préférences</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4 text-center">
            <Trash2 className="w-8 h-8 text-red-600 mx-auto mb-2" />
            <h3 className="font-semibold text-gray-900 mb-1">Supprimer</h3>
            <p className="text-xs text-gray-600">Votre compte</p>
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Responsable du Traitement</h2>
            <p className="text-gray-700 leading-relaxed">
              <strong>Luneo SAS</strong><br />
              Adresse : [Adresse à compléter]<br />
              Email DPO : <a href="mailto:dpo@luneo.app" className="text-blue-600 hover:text-blue-700 underline">dpo@luneo.app</a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Données Collectées</h2>
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Données d'identification :</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-1">
                <li>Nom et prénom</li>
                <li>Adresse email</li>
                <li>Nom d'entreprise (optionnel)</li>
              </ul>

              <h3 className="font-semibold text-gray-900 mb-3 mt-6">Données de création :</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-1">
                <li>Designs et créations</li>
                <li>Configurations produits</li>
                <li>Fichiers uploadés</li>
              </ul>

              <h3 className="font-semibold text-gray-900 mb-3 mt-6">Données techniques :</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-1">
                <li>Adresse IP</li>
                <li>Type de navigateur</li>
                <li>Logs d'activité</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Base Légale du Traitement</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Exécution du contrat :</strong> Fourniture des services Luneo</li>
              <li><strong>Consentement :</strong> Marketing et cookies non essentiels</li>
              <li><strong>Intérêt légitime :</strong> Sécurité et prévention de la fraude</li>
              <li><strong>Obligation légale :</strong> Facturation et comptabilité</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Vos Droits RGPD</h2>
            <div className="space-y-4">
              <div className="bg-blue-50 border-l-4 border-blue-600 p-4">
                <h3 className="font-semibold text-gray-900 mb-2">✓ Droit d'accès</h3>
                <p className="text-gray-700 text-sm">Accédez à toutes vos données via votre dashboard</p>
              </div>

              <div className="bg-green-50 border-l-4 border-green-600 p-4">
                <h3 className="font-semibold text-gray-900 mb-2">✓ Droit de rectification</h3>
                <p className="text-gray-700 text-sm">Modifiez vos informations dans Settings → Profile</p>
              </div>

              <div className="bg-purple-50 border-l-4 border-purple-600 p-4">
                <h3 className="font-semibold text-gray-900 mb-2">✓ Droit à l'effacement</h3>
                <p className="text-gray-700 text-sm">Supprimez votre compte dans Settings → Delete Account</p>
              </div>

              <div className="bg-orange-50 border-l-4 border-orange-600 p-4">
                <h3 className="font-semibold text-gray-900 mb-2">✓ Droit à la portabilité</h3>
                <p className="text-gray-700 text-sm">Exportez vos données en JSON via Settings → Export Data</p>
              </div>

              <div className="bg-red-50 border-l-4 border-red-600 p-4">
                <h3 className="font-semibold text-gray-900 mb-2">✓ Droit d'opposition</h3>
                <p className="text-gray-700 text-sm">Refusez le marketing dans Settings → Communication</p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Sécurité des Données</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Chiffrement AES-256</strong> pour les données au repos</li>
              <li><strong>HTTPS/TLS</strong> pour les données en transit</li>
              <li><strong>Authentification 2FA</strong> disponible</li>
              <li><strong>Audits de sécurité</strong> réguliers</li>
              <li><strong>Backups</strong> quotidiens chiffrés</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Conservation des Données</h2>
            <table className="min-w-full border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Type de données</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Durée</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-700">Compte actif</td>
                  <td className="px-4 py-3 text-sm text-gray-700">Durée de l'abonnement</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-700">Designs</td>
                  <td className="px-4 py-3 text-sm text-gray-700">Tant que le compte existe</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-700">Logs</td>
                  <td className="px-4 py-3 text-sm text-gray-700">90 jours</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-700">Facturation</td>
                  <td className="px-4 py-3 text-sm text-gray-700">10 ans (obligation légale)</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Transferts de Données</h2>
            <p className="text-gray-700 leading-relaxed">
              Vos données sont hébergées dans l'Union Européenne (AWS eu-west-1, Paris). 
              Certains sous-traitants peuvent être hors UE (USA) avec garanties appropriées (Standard Contractual Clauses).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Contact DPO</h2>
            <div className="bg-gray-50 rounded-lg p-6">
              <p className="text-gray-700 mb-2">
                Pour toute question RGPD ou exercer vos droits :
              </p>
              <p className="text-gray-900 font-semibold">
                📧 Email : <a href="mailto:dpo@luneo.app" className="text-blue-600 hover:text-blue-700 underline">dpo@luneo.app</a>
              </p>
              <p className="text-gray-700 mt-4 text-sm">
                Vous pouvez également contacter la CNIL en cas de litige : <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 underline">www.cnil.fr</a>
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
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
