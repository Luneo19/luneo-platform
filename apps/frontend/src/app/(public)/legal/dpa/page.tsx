import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Accord de traitement des données (DPA) - Luneo Tech',
  description:
    'Data Processing Agreement Luneo Tech conforme au RGPD Article 28. Sous-traitance et sécurité des données.',
  openGraph: {
    title: 'DPA - Accord de traitement des données - Luneo Tech',
    description: 'Data Processing Agreement conforme RGPD Article 28.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DPA - Luneo Tech',
    description: 'Accord de traitement des données (DPA) Luneo Tech.',
  },
};

function DPAPageContent() {
  const lastUpdate = new Date().toLocaleDateString('fr-FR');
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900">
      <div className="dark-section relative noise-overlay py-12">
        <div className="absolute inset-0 gradient-mesh-purple" />
        <div className="relative z-10 max-w-4xl mx-auto px-4">
          {/* Back Button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-300 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Link>

          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-10 h-10 text-blue-400" />
              <h1 className="text-4xl font-bold text-white">
                Accord de Traitement des Données (DPA)
              </h1>
            </div>
            <p className="text-lg text-slate-300">
              Data Processing Agreement conforme au RGPD - Article 28
            </p>
            <p className="text-sm text-slate-500 mt-2">
              Version 1.0 - Dernière mise à jour : {lastUpdate}
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-lg max-w-none prose-invert">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">1. Définitions</h2>
              <dl className="space-y-4">
                <div>
                  <dt className="font-semibold text-white">Responsable du traitement :</dt>
                  <dd className="text-slate-300 ml-4">Vous, le client utilisant les services Luneo Tech</dd>
                </div>
                <div>
                  <dt className="font-semibold text-white">Sous-traitant :</dt>
                  <dd className="text-slate-300 ml-4">Luneo Tech, fournisseur de la plateforme</dd>
                </div>
                <div>
                  <dt className="font-semibold text-white">Données personnelles :</dt>
                  <dd className="text-slate-300 ml-4">Toute information relative aux utilisateurs finaux de votre service</dd>
                </div>
              </dl>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">2. Objet du Traitement</h2>
              <p className="text-slate-300 leading-relaxed">
                Luneo Tech agit en qualité de sous-traitant pour traiter les données personnelles nécessaires à :
              </p>
              <ul className="list-disc pl-6 mt-4 text-slate-300 space-y-2">
                <li>La génération de designs personnalisés</li>
                <li>Le stockage des créations</li>
                <li>La gestion des commandes</li>
                <li>L'export de fichiers (2D/3D/AR)</li>
                <li>Les analytics d'utilisation</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">3. Nature des Données Traitées</h2>
              <div className="bg-dark-card/60 backdrop-blur-sm border border-white/[0.04] rounded-lg p-6">
                <ul className="space-y-2 text-slate-300">
                  <li>✓ Identifiants clients (email, nom)</li>
                  <li>✓ Données de création (designs, images, textes)</li>
                  <li>✓ Métadonnées techniques (IP, user-agent)</li>
                  <li>✓ Données de paiement (via Stripe - pas stockées par Luneo Tech)</li>
                  <li>✗ Pas de données sensibles (santé, religion, etc.)</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">4. Obligations du Sous-Traitant (Luneo Tech)</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-green-400 font-bold">✓</span>
                  <p className="text-slate-300">
                    <strong className="text-white">Sécurité :</strong> Chiffrement AES-256, HTTPS obligatoire, audits réguliers
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-400 font-bold">✓</span>
                  <p className="text-slate-300">
                    <strong className="text-white">Confidentialité :</strong> Personnel formé, accès restreints, NDA signés
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-400 font-bold">✓</span>
                  <p className="text-slate-300">
                    <strong className="text-white">Notification :</strong> Violation de données signalée sous 72h
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-400 font-bold">✓</span>
                  <p className="text-slate-300">
                    <strong className="text-white">Assistance :</strong> Aide aux demandes des personnes concernées
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-400 font-bold">✓</span>
                  <p className="text-slate-300">
                    <strong className="text-white">Audits :</strong> Mise à disposition des éléments de conformité
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">5. Sous-Traitants Ultérieurs</h2>
              <p className="text-slate-300 mb-4">
                Luneo Tech peut faire appel à des sous-traitants autorisés :
              </p>
              <table className="min-w-full border border-white/[0.04]">
                <thead className="bg-dark-card/60">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">Service</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">Localisation</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-white">Garanties</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  <tr>
                    <td className="px-4 py-3 text-sm text-slate-300">AWS (hosting)</td>
                    <td className="px-4 py-3 text-sm text-slate-300">🇪🇺 EU / Suisse</td>
                    <td className="px-4 py-3 text-sm text-slate-300">Certifié ISO 27001</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-slate-300">Stripe (paiements)</td>
                    <td className="px-4 py-3 text-sm text-slate-300">🇪🇺 EU</td>
                    <td className="px-4 py-3 text-sm text-slate-300">PCI-DSS Level 1</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-slate-300">Vercel (CDN)</td>
                    <td className="px-4 py-3 text-sm text-slate-300">🌍 Global</td>
                    <td className="px-4 py-3 text-sm text-slate-300">SOC 2 Type II</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm text-slate-300">OpenAI (DALL-E)</td>
                    <td className="px-4 py-3 text-sm text-slate-300">🇺🇸 USA</td>
                    <td className="px-4 py-3 text-sm text-slate-300">SCC + DPF</td>
                  </tr>
                </tbody>
              </table>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">6. Durée du Traitement</h2>
              <p className="text-slate-300 leading-relaxed">
                Le traitement des données dure pendant toute la durée du contrat et jusqu'à 30 jours après sa résiliation 
                (sauf obligations légales de conservation plus longues).
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">7. Suppression des Données</h2>
              <p className="text-slate-300 leading-relaxed">
                À la fin du contrat, Luneo Tech s'engage à :
              </p>
              <ul className="list-disc pl-6 mt-4 text-slate-300 space-y-2">
                <li>Supprimer toutes les données dans les 30 jours</li>
                <li>Fournir une attestation de destruction sur demande</li>
                <li>Ou renvoyer les données dans un format structuré (JSON)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">8. Contact</h2>
              <div className="bg-dark-card/60 backdrop-blur-sm border border-white/[0.04] rounded-lg p-6">
                <p className="text-slate-300 mb-4">
                  Pour toute question concernant cet accord :
                </p>
                <div className="space-y-2">
                  <p className="text-white">
                    <strong>Email DPO :</strong>{' '}
                    <a href="mailto:dpo@luneo.app" className="text-blue-400 hover:text-blue-300 underline">
                      dpo@luneo.app
                    </a>
                  </p>
                  <p className="text-white">
                    <strong>Email légal :</strong>{' '}
                    <a href="mailto:legal@luneo.app" className="text-blue-400 hover:text-blue-300 underline">
                      legal@luneo.app
                    </a>
                  </p>
                </div>
              </div>
            </section>

            {/* Download DPA */}
            <div className="mt-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6 text-white">
              <h3 className="text-xl font-bold mb-2">Télécharger le DPA signé</h3>
              <p className="mb-4 text-purple-100">
                Pour les clients Enterprise, un DPA personnalisé et signé est disponible sur demande.
              </p>
              <button className="bg-white text-purple-600 px-6 py-2 rounded-lg font-semibold hover:bg-purple-50 transition-colors" aria-label="Request signed DPA">
                Demander le DPA signé
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DPAPage() {
  return <DPAPageContent />;
}
