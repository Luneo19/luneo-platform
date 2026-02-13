import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Shield, Eye, Download, Trash2 } from 'lucide-react';
import { ExportLabel } from '../ExportLabel';

export const metadata: Metadata = {
  title: 'nDSG & Protection des données - Luneo Tech',
  description:
    'Luneo Tech est conforme à la loi fédérale suisse sur la protection des données (nDSG/nLPD). Droits d\'accès, rectification, effacement et portabilité.',
  openGraph: {
    title: 'nDSG & Protection des données - Luneo Tech',
    description: 'Conformité nDSG et droits des personnes concernées.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'nDSG & Protection des données - Luneo Tech',
    description: 'nDSG et protection des données Luneo Tech.',
  },
};

function NDSGPageContent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900">
      <div className="dark-section relative noise-overlay py-12">
        <div className="absolute inset-0 gradient-mesh-purple" />
        <div className="relative z-10 max-w-4xl mx-auto px-4">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-300 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Link>

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-10 h-10 text-blue-400" />
            <h1 className="text-4xl font-bold text-white">
              nDSG & Protection des Données
            </h1>
          </div>
          <p className="text-lg text-gray-300">
            Luneo Tech s&apos;engage à respecter la loi fédérale suisse sur la protection des données (nDSG/nLPD), en vigueur depuis le 1er septembre 2023
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-4 gap-4 mb-12">
          <div className="bg-blue-500/20 rounded-lg p-4 text-center border border-blue-500/30">
            <Eye className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <h3 className="font-semibold text-white mb-1">Accéder</h3>
            <p className="text-xs text-gray-400">À vos données</p>
          </div>
          <div className="bg-green-500/20 rounded-lg p-4 text-center border border-green-500/30">
            <Download className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <h3 className="font-semibold text-white mb-1">Exporter</h3>
            <p className="text-xs text-gray-400">Vos données</p>
          </div>
          <div className="bg-orange-500/20 rounded-lg p-4 text-center border border-orange-500/30">
            <Shield className="w-8 h-8 text-orange-400 mx-auto mb-2" />
            <h3 className="font-semibold text-white mb-1">Modifier</h3>
            <p className="text-xs text-gray-400">Vos préférences</p>
          </div>
          <div className="bg-red-500/20 rounded-lg p-4 text-center border border-red-500/30">
            <Trash2 className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <h3 className="font-semibold text-white mb-1">Supprimer</h3>
            <p className="text-xs text-gray-400">Votre compte</p>
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none prose-invert">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
            <p className="text-gray-300 leading-relaxed">
              Luneo Tech s&apos;engage à respecter la loi fédérale suisse sur la protection des données (nDSG/nLPD), 
              entrée en vigueur le 1er septembre 2023. Cette page décrit comment nous traitons vos données 
              personnelles conformément aux exigences du droit suisse.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">2. Responsable du Traitement</h2>
            <p className="text-gray-300 leading-relaxed">
              <strong>Luneo Tech</strong><br />
              Siège : Neuchâtel, Suisse<br />
              Email contact protection des données : <a href="mailto:dpo@luneo.app" className="text-blue-400 hover:text-blue-300 underline">dpo@luneo.app</a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">3. Base Légale du Traitement</h2>
            <ul className="list-disc pl-6 text-gray-300 space-y-2">
              <li><strong>Consentement :</strong> Marketing et cookies non essentiels</li>
              <li><strong>Exécution du contrat :</strong> Fourniture des services Luneo Tech</li>
              <li><strong>Intérêts légitimes :</strong> Sécurité et prévention de la fraude</li>
              <li><strong>Obligations légales :</strong> Facturation et comptabilité</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">4. Catégories de Données</h2>
            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
              <h3 className="font-semibold text-white mb-3">Données personnelles :</h3>
              <ul className="list-disc pl-6 text-gray-300 space-y-1">
                <li>Nom et prénom</li>
                <li>Adresse email</li>
                <li>Nom d&apos;entreprise (optionnel)</li>
              </ul>

              <h3 className="font-semibold text-white mb-3 mt-6">Données d&apos;utilisation :</h3>
              <ul className="list-disc pl-6 text-gray-300 space-y-1">
                <li>Designs et créations</li>
                <li>Configurations produits</li>
                <li>Fichiers uploadés</li>
                <li>Logs d&apos;activité</li>
              </ul>

              <h3 className="font-semibold text-white mb-3 mt-6">Données de paiement :</h3>
              <ul className="list-disc pl-6 text-gray-300 space-y-1">
                <li>Traitées par Stripe (conformément à leurs normes de sécurité)</li>
                <li>Informations de facturation</li>
              </ul>

              <h3 className="font-semibold text-white mb-3 mt-6">Données techniques :</h3>
              <ul className="list-disc pl-6 text-gray-300 space-y-1">
                <li>Adresse IP</li>
                <li>Type de navigateur</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">5. Finalités du Traitement</h2>
            <ul className="list-disc pl-6 text-gray-300 space-y-2">
              <li><strong>Fourniture des services :</strong> Accès à la plateforme et aux fonctionnalités</li>
              <li><strong>Facturation :</strong> Gestion des abonnements et paiements</li>
              <li><strong>Analytique :</strong> Amélioration de nos services (données agrégées)</li>
              <li><strong>Fonctionnalités IA :</strong> Génération de designs et personnalisation</li>
              <li><strong>Support client :</strong> Réponse à vos demandes et assistance</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">6. Transferts de Données</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Vos données peuvent être transférées hors de Suisse vers des pays tiers. Dans ce cas, nous nous assurons 
              de garanties appropriées conformément au nDSG :
            </p>
            <ul className="list-disc pl-6 text-gray-300 space-y-2">
              <li><strong>Décisions d&apos;adéquation :</strong> Pays reconnus comme offrant un niveau de protection suffisant</li>
              <li><strong>Clauses contractuelles types :</strong> Garanties contractuelles approuvées (SCC)</li>
              <li>Transferts vers l&apos;UE/EEE bénéficient de la reconnaissance de l&apos;adéquation suisse</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">7. Conservation des Données</h2>
            <table className="min-w-full border border-gray-700">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-white">Type de données</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-white">Durée</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-300">Compte actif</td>
                  <td className="px-4 py-3 text-sm text-gray-300">Durée de l&apos;abonnement</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-300">Designs et créations</td>
                  <td className="px-4 py-3 text-sm text-gray-300">Tant que le compte existe</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-300">Logs</td>
                  <td className="px-4 py-3 text-sm text-gray-300">90 jours</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm text-gray-300">Facturation</td>
                  <td className="px-4 py-3 text-sm text-gray-300">10 ans (obligation légale)</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">8. Droits des Personnes Concernées</h2>
            <div className="space-y-4">
              <div className="bg-blue-500/20 border-l-4 border-blue-400 p-4 border border-blue-500/30">
                <h3 className="font-semibold text-white mb-2">✓ Droit à l&apos;information</h3>
                <p className="text-gray-300 text-sm">Accédez à toutes vos données via votre dashboard</p>
              </div>

              <div className="bg-green-500/20 border-l-4 border-green-400 p-4 border border-green-500/30">
                <h3 className="font-semibold text-white mb-2">✓ Droit de rectification</h3>
                <p className="text-gray-300 text-sm">Modifiez vos informations dans Settings → Profile</p>
              </div>

              <div className="bg-purple-500/20 border-l-4 border-purple-400 p-4 border border-purple-500/30">
                <h3 className="font-semibold text-white mb-2">✓ Droit à l&apos;effacement</h3>
                <p className="text-gray-300 text-sm">Supprimez votre compte dans Settings → Delete Account</p>
              </div>

              <div className="bg-orange-500/20 border-l-4 border-orange-400 p-4 border border-orange-500/30">
                <h3 className="font-semibold text-white mb-2">✓ Droit à la portabilité</h3>
                <p className="text-gray-300 text-sm">Exportez vos données en JSON via Settings → Export Data</p>
              </div>

              <div className="bg-red-500/20 border-l-4 border-red-400 p-4 border border-red-500/30">
                <h3 className="font-semibold text-white mb-2">✓ Droit d&apos;opposition</h3>
                <p className="text-gray-300 text-sm">Refusez le marketing dans Settings → Communication</p>
              </div>

              <div className="bg-amber-500/20 border-l-4 border-amber-400 p-4 border border-amber-500/30">
                <h3 className="font-semibold text-white mb-2">✓ Restriction du traitement</h3>
                <p className="text-gray-300 text-sm">Demandez la limitation du traitement dans certaines circonstances</p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">9. Analyses d&apos;Impact (DPIA)</h2>
            <p className="text-gray-300 leading-relaxed">
              Luneo Tech réalise des analyses d&apos;impact relatives à la protection des données (DPIA) pour les 
              traitements présentant un risque élevé pour les droits et libertés des personnes concernées, 
              conformément aux exigences du nDSG.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">10. Notification de Violation de Données</h2>
            <p className="text-gray-300 leading-relaxed">
              En cas de violation de données présentant un risque élevé pour les droits et libertés des personnes 
              concernées, Luneo Tech notifiera le Préposé fédéral à la protection des données et à la transparence (PFPDT) 
              dans un délai de 72 heures, conformément à l&apos;article 24 du nDSG. Les personnes concernées seront 
              également informées lorsque la violation présente un risque élevé pour elles.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">11. Contact</h2>
            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
              <p className="text-gray-300 mb-2">
                Pour toute question relative à la protection des données ou pour exercer vos droits :
              </p>
              <p className="text-white font-semibold">
                📧 Email : <a href="mailto:dpo@luneo.app" className="text-blue-400 hover:text-blue-300 underline">dpo@luneo.app</a>
              </p>
              <p className="text-gray-300 mt-4 text-sm">
                Vous pouvez également contacter le Préposé fédéral à la protection des données et à la transparence (PFPDT) 
                en cas de litige : <a href="https://www.edoeb.admin.ch" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">www.edoeb.admin.ch</a>
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">12. Mises à Jour</h2>
            <p className="text-gray-300 leading-relaxed">
              Cette page a été mise à jour le <strong>12 février 2025</strong>. Nous nous réservons le droit de 
              modifier cette politique pour refléter les changements juridiques ou organisationnels.
            </p>
          </section>
        </div>
        </div>
      </div>
    </div>
  );
}

export default function NDSGPage() {
  return <NDSGPageContent />;
}
