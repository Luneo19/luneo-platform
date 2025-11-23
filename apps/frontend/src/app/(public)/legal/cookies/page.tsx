import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Politique Cookies - Luneo',
  description: 'Politique d\'utilisation des cookies de Luneo',
};

export default function CookiesPolicyPage() {
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Politique d'Utilisation des Cookies
          </h1>
          <p className="text-lg text-gray-600">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Qu'est-ce qu'un Cookie ?</h2>
            <p className="text-gray-700 leading-relaxed">
              Les cookies sont de petits fichiers texte stockés sur votre appareil lorsque vous visitez notre site. 
              Ils nous permettent de mémoriser vos préférences et d'améliorer votre expérience.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Types de Cookies Utilisés</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Cookies Essentiels</h3>
                <p className="text-gray-700">
                  Nécessaires au fonctionnement du site. Ils permettent la navigation, l'authentification et l'accès aux zones sécurisées.
                </p>
                <ul className="list-disc pl-6 mt-2 text-gray-700">
                  <li>Cookie de session (auth_token)</li>
                  <li>Préférences de cookies (cookie_consent)</li>
                  <li>CSRF protection</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Cookies Analytiques</h3>
                <p className="text-gray-700">
                  Nous aident à comprendre comment vous utilisez notre site pour améliorer nos services.
                </p>
                <ul className="list-disc pl-6 mt-2 text-gray-700">
                  <li>Google Analytics (_ga, _gid)</li>
                  <li>Vercel Analytics</li>
                  <li>Données de performance</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Cookies Marketing</h3>
                <p className="text-gray-700">
                  Utilisés pour personnaliser le contenu publicitaire et mesurer l'efficacité de nos campagnes.
                </p>
                <ul className="list-disc pl-6 mt-2 text-gray-700">
                  <li>Cookies publicitaires tiers</li>
                  <li>Retargeting</li>
                  <li>Mesure de conversion</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Gérer vos Cookies</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Vous pouvez personnaliser vos préférences de cookies via notre bannière de consentement ou directement 
              dans les paramètres de votre navigateur.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>Note :</strong> Désactiver certains cookies peut affecter les fonctionnalités du site.
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Durée de Conservation</h2>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Cookies de session :</strong> Supprimés à la fermeture du navigateur</li>
              <li><strong>Cookies persistants :</strong> 1 an maximum</li>
              <li><strong>Cookies analytiques :</strong> 2 ans (Google Analytics)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Cookies Tiers</h2>
            <p className="text-gray-700 leading-relaxed">
              Nous utilisons des services tiers qui peuvent déposer leurs propres cookies :
            </p>
            <ul className="list-disc pl-6 mt-4 text-gray-700 space-y-2">
              <li><strong>Google Analytics :</strong> Statistiques de visite</li>
              <li><strong>Stripe :</strong> Paiements sécurisés</li>
              <li><strong>Vercel :</strong> Analytics et performance</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Vos Droits</h2>
            <p className="text-gray-700 leading-relaxed">
              Conformément au RGPD, vous avez le droit de :
            </p>
            <ul className="list-disc pl-6 mt-4 text-gray-700 space-y-2">
              <li>Accepter ou refuser les cookies non essentiels</li>
              <li>Modifier vos préférences à tout moment</li>
              <li>Accéder aux données collectées</li>
              <li>Supprimer vos cookies via votre navigateur</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Contact</h2>
            <p className="text-gray-700 leading-relaxed">
              Pour toute question concernant notre utilisation des cookies :{' '}
              <a href="mailto:privacy@luneo.app" className="text-blue-600 hover:text-blue-700 underline">
                privacy@luneo.app
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
