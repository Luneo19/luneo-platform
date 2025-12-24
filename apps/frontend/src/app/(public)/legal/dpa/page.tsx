'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function DPAPageContent() {
  const lastUpdate = useMemo(() => new Date().toLocaleDateString('fr-FR'), []);
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
            <FileText className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">
              Accord de Traitement des Données (DPA)
            </h1>
          </div>
          <p className="text-lg text-gray-600">
            Data Processing Agreement conforme au RGPD - Article 28
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Version 1.0 - Dernière mise à jour : {lastUpdate}
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Définitions</h2>
            <dl className="space-y-4">
              <div>
                <dt className="font-semibold text-gray-900">Responsable du traitement :</dt>
                <dd className="text-gray-700 ml-4">Vous, le client utilisant les services Luneo</dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-900">Sous-traitant :</dt>
                <dd className="text-gray-700 ml-4">Luneo SAS, fournisseur de la plateforme</dd>
              </div>
              <div>
                <dt className="font-semibold text-gray-900">Données personnelles :</dt>
                <dd className="text-gray-700 ml-4">Toute information relative aux utilisateurs finaux de votre service</dd>
              </div>
            </dl>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Objet du Traitement</h2>
            <p className="text-gray-700 leading-relaxed">
              Luneo agit en qualité de sous-traitant pour traiter les données personnelles nécessaires à :
            </p>
            <ul className="list-disc pl-6 mt-4 text-gray-700 space-y-2">
              <li>La génération de designs personnalisés</li>
              <li>Le stockage des créations</li>
              <li>La gestion des commandes</li>
              <li>L'export de fichiers (2D/3D/AR)</li>
              <li>Les analytics d'utilisation</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Nature des Données Traitées</h2>
            <div className="bg-gray-50 rounded-lg p-6">
              <ul className="space-y-2 text-gray-700">
                <li>✓ Identifiants clients (email, nom)</li>
                <li>✓ Données de création (designs, images, textes)</li>
                <li>✓ Métadonnées techniques (IP, user-agent)</li>
                <li>✓ Données de paiement (via Stripe - pas stockées par Luneo)</li>
                <li>✗ Pas de données sensibles (santé, religion, etc.)</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Obligations du Sous-Traitant (Luneo)</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-green-600 font-bold">✓</span>
                <p className="text-gray-700">
                  <strong>Sécurité :</strong> Chiffrement AES-256, HTTPS obligatoire, audits réguliers
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-600 font-bold">✓</span>
                <p className="text-gray-700">
                  <strong>Confidentialité :</strong> Personnel formé, accès restreints, NDA signés
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-600 font-bold">✓</span>
                <p className="text-gray-700">
                  <strong>Notification :</strong> Violation de données signalée sous 72h
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-600 font-bold">✓</span>
                <p className="text-gray-700">
                  <strong>Assistance :</strong> Aide aux demandes des personnes concernées
                </p>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-green-600 font-bold">✓</span>
                <p className="text-gray-700">
                  <strong>Audits :</strong> Mise à disposition des éléments de conformité
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Sous-Traitants Ultérieurs</h2>
            <p className="text-gray-700 mb-4">
              Luneo peut faire appel à des sous-traitants autorisés :
            </p>
            <table className="min-w-full border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Service</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Localisation</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Garanties</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-700">AWS (hosting)</td>
                  <td className="px-4 py-3 text-sm text-gray-700">🇪🇺 EU (Paris)</td>
                  <td className="px-4 py-3 text-sm text-gray-700">Certifié ISO 27001</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-700">Stripe (paiements)</td>
                  <td className="px-4 py-3 text-sm text-gray-700">🇪🇺 EU</td>
                  <td className="px-4 py-3 text-sm text-gray-700">PCI-DSS Level 1</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-700">Vercel (CDN)</td>
                  <td className="px-4 py-3 text-sm text-gray-700">🌍 Global</td>
                  <td className="px-4 py-3 text-sm text-gray-700">SOC 2 Type II</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-700">OpenAI (DALL-E)</td>
                  <td className="px-4 py-3 text-sm text-gray-700">🇺🇸 USA</td>
                  <td className="px-4 py-3 text-sm text-gray-700">SCC + DPF</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Durée du Traitement</h2>
            <p className="text-gray-700 leading-relaxed">
              Le traitement des données dure pendant toute la durée du contrat et jusqu'à 30 jours après sa résiliation 
              (sauf obligations légales de conservation plus longues).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Suppression des Données</h2>
            <p className="text-gray-700 leading-relaxed">
              À la fin du contrat, Luneo s'engage à :
            </p>
            <ul className="list-disc pl-6 mt-4 text-gray-700 space-y-2">
              <li>Supprimer toutes les données dans les 30 jours</li>
              <li>Fournir une attestation de destruction sur demande</li>
              <li>Ou renvoyer les données dans un format structuré (JSON)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Contact</h2>
            <div className="bg-blue-50 rounded-lg p-6">
              <p className="text-gray-700 mb-4">
                Pour toute question concernant cet accord :
              </p>
              <div className="space-y-2">
                <p className="text-gray-900">
                  <strong>Email DPO :</strong>{' '}
                  <a href="mailto:dpo@luneo.app" className="text-blue-600 hover:text-blue-700 underline">
                    dpo@luneo.app
                  </a>
                </p>
                <p className="text-gray-900">
                  <strong>Email légal :</strong>{' '}
                  <a href="mailto:legal@luneo.app" className="text-blue-600 hover:text-blue-700 underline">
                    legal@luneo.app
                  </a>
                </p>
              </div>
            </div>
          </section>

          {/* Download DPA */}
          <div className="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
            <h3 className="text-xl font-bold mb-2">Télécharger le DPA signé</h3>
            <p className="mb-4 text-blue-100">
              Pour les clients Enterprise, un DPA personnalisé et signé est disponible sur demande.
            </p>
            <button className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
              Demander le DPA signé
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const DPAPageMemo = memo(DPAPageContent);

export default function DPAPage() {
  return (
    <ErrorBoundary componentName="DPAPage">
      <DPAPageMemo />
    </ErrorBoundary>
  );
}
