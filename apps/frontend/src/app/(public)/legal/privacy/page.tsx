'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white/90">
      <div className="relative py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Link>

          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              Politique de confidentialité
            </h1>
            <p className="text-white/60 text-sm">
              Dernière mise à jour : Février 2026
            </p>
          </div>

          <Card className="p-8 md:p-10 bg-zinc-900/80 border border-white/[0.06] backdrop-blur-sm">
            <div className="prose prose-invert max-w-none prose-p:text-white/80 prose-li:text-white/80 prose-headings:text-white">
              {/* 1. Introduction et responsable du traitement */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">
                  1. Introduction et responsable du traitement
                </h2>
                <p className="text-white/80 leading-relaxed mb-4">
                  La présente politique de confidentialité (« Politique ») décrit la manière dont Luneo Tech Sarl (« Luneo », « nous », « notre ») collecte, utilise, partage et protège les données à caractère personnel des utilisateurs de sa plateforme SaaS de personnalisation de produits (conception 2D/3D, essayage virtuel, génération par IA, intégrations e-commerce), en conformité avec la loi fédérale suisse sur la protection des données (nLPD/nDSG, en vigueur depuis septembre 2023), le Règlement général sur la protection des données de l&apos;Union européenne (RGPD) et la directive ePrivacy relative aux cookies.
                </p>
                <p className="text-white/80 leading-relaxed">
                  <strong>Responsable du traitement :</strong> Luneo Tech Sarl, Rue du Seyon 10, 2000 Neuchâtel, Neuchâtel, Suisse. Identification (IDE) : CHE-000.000.000. Pour toute question relative à la protection des données : <a href="mailto:privacy@luneo.app" className="text-blue-400 hover:text-blue-300 underline">privacy@luneo.app</a>. Délégué à la protection des données (DPO) : <a href="mailto:dpo@luneo.app" className="text-blue-400 hover:text-blue-300 underline">dpo@luneo.app</a>.
                </p>
              </section>

              {/* 2. Définitions */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">
                  2. Définitions
                </h2>
                <ul className="list-disc list-inside space-y-2 text-white/80">
                  <li><strong>Données personnelles :</strong> toute information se rapportant à une personne physique identifiée ou identifiable (nom, email, adresse IP, identifiants de compte, etc.).</li>
                  <li><strong>Traitement :</strong> toute opération effectuée sur des données personnelles (collecte, enregistrement, conservation, modification, consultation, communication, effacement).</li>
                  <li><strong>Sous-traitant :</strong> toute personne physique ou morale qui traite des données personnelles pour le compte du responsable du traitement (hébergeur, prestataire de paiement, etc.).</li>
                  <li><strong>Personne concernée :</strong> la personne physique dont les données sont traitées (utilisateur de la plateforme, visiteur du site).</li>
                  <li><strong>Consentement :</strong> manifestation de volonté libre, spécifique, éclairée et univoque par laquelle la personne concernée accepte le traitement de ses données.</li>
                  <li><strong>Finalité :</strong> objectif précis et légitime pour lequel les données sont collectées et traitées.</li>
                </ul>
              </section>

              {/* 3. Données collectées */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">
                  3. Données collectées
                </h2>
                <p className="text-white/80 leading-relaxed mb-4">
                  Nous collectons les catégories de données suivantes, dans la mesure nécessaire aux finalités décrites à la section 4.
                </p>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">3.1 Données d&apos;inscription</h3>
                    <p className="text-white/80">
                      Nom, prénom ou raison sociale, adresse e-mail, mot de passe (stocké de manière sécurisée par hachage), et éventuellement nom d&apos;entreprise et numéro de téléphone lorsque vous créez un compte ou souscrivez à un abonnement.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">3.2 Données de profil et préférences</h3>
                    <p className="text-white/80">
                      Préférences de langue, paramètres d&apos;affichage, préférences de notification, et toute information que vous choisissez d&apos;ajouter à votre profil (photo, bio, etc.).
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">3.3 Données de paiement</h3>
                    <p className="text-white/80">
                      Les paiements sont traités par Stripe. Nous ne stockons pas les numéros de carte bancaire ni les codes CVV. Nous pouvons conserver les identifiants de facturation (nom, adresse de facturation), l&apos;historique des abonnements et des factures, ainsi que les identifiants Stripe (customer ID, subscription ID) pour la gestion des abonnements et du support.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">3.4 Données d&apos;utilisation</h3>
                    <p className="text-white/80">
                      Logs d&apos;accès et d&apos;utilisation de la plateforme, pages visitées, actions réalisées (création de designs, export, intégrations), métriques d&apos;analytics et Web Vitals (performance, erreurs) pour assurer le bon fonctionnement et améliorer le service.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">3.5 Données de contenu</h3>
                    <p className="text-white/80">
                      Designs, configurations de personnalisation, images et fichiers que vous uploadez (par exemple pour l&apos;essayage virtuel ou la génération par IA), et tout contenu que vous créez ou stockez sur la plateforme. Ce contenu peut contenir des données personnelles si vous y intégrez des informations identifiantes.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">3.6 Données techniques</h3>
                    <p className="text-white/80">
                      Adresse IP, type de navigateur et version (user-agent), système d&apos;exploitation, identifiants de session, cookies et technologies similaires (voir section 6), et données de localisation approximative déduites de l&apos;IP si nécessaire pour la sécurité ou la conformité.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">3.7 Données de communication</h3>
                    <p className="text-white/80">
                      Échanges par e-mail ou via le support (tickets, demandes d&apos;assistance), contenu des messages et pièces jointes, et historique des communications pour le suivi des demandes et l&apos;amélioration du service.
                    </p>
                  </div>
                </div>
              </section>

              {/* 4. Finalités et bases légales */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">
                  4. Finalités du traitement et bases légales
                </h2>
                <p className="text-white/80 leading-relaxed mb-4">
                  Nous traitons vos données pour les finalités suivantes, sur les bases juridiques indiquées (nLPD/nDSG et RGPD).
                </p>
                <ul className="list-disc list-inside space-y-2 text-white/80">
                  <li><strong>Exécution du contrat :</strong> fourniture de la plateforme, gestion du compte, facturation, support technique, sauvegarde et restitution de vos designs et contenus.</li>
                  <li><strong>Consentement :</strong> envoi de newsletters et communications marketing, dépôt de cookies non strictement nécessaires, et tout traitement pour lequel nous recueillons explicitement votre accord.</li>
                  <li><strong>Intérêt légitime :</strong> amélioration des services, analytics agrégés, sécurité et prévention des abus, défense en justice, et optimisation technique (logs, Web Vitals).</li>
                  <li><strong>Obligation légale :</strong> conservation de pièces comptables et fiscales, réponse aux demandes des autorités compétentes dans le cadre légal.</li>
                </ul>
              </section>

              {/* 5. Traitement par IA */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">
                  5. Traitement par intelligence artificielle
                </h2>
                <p className="text-white/80 leading-relaxed mb-4">
                  Certaines fonctionnalités de la plateforme (génération d&apos;images, de textes ou de suggestions) s&apos;appuient sur des services fournis par OpenAI. Les prompts et données que vous envoyez dans le cadre de ces fonctionnalités sont transmis à OpenAI pour la génération des réponses. Conformément à notre configuration et aux conditions d&apos;OpenAI applicables aux entreprises, ces données ne sont pas utilisées par OpenAI pour l&apos;entraînement de ses modèles. Le traitement reste sous notre maîtrise en tant que responsable du traitement ; OpenAI agit en tant que sous-traitant pour cette finalité.
                </p>
              </section>

              {/* 6. Cookies */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">
                  6. Cookies et technologies similaires
                </h2>
                <p className="text-white/80 leading-relaxed">
                  Nous utilisons des cookies et technologies similaires (stockage local, pixels) pour le fonctionnement du site, la session utilisateur, l&apos;analytics et, le cas échéant, le marketing. Une politique détaillée des cookies, incluant les types de cookies, leurs finalités et les modalités de gestion de votre consentement, est disponible sur notre page dédiée : <Link href="/legal/cookies" className="text-blue-400 hover:text-blue-300 underline">Politique des cookies</Link>. Nous nous conformons à la directive ePrivacy et au consentement préalable lorsque requis.
                </p>
              </section>

              {/* 7. Partage et transferts */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">
                  7. Partage et transferts de données
                </h2>
                <h3 className="text-lg font-semibold text-white mb-2">7.1 Sous-traitants</h3>
                <p className="text-white/80 mb-4">
                  Nous faisons appel à des sous-traitants qui traitent des données personnelles pour notre compte, dans le cadre de contrats encadrant la confidentialité et la sécurité. Principaux sous-traitants et finalités :
                </p>
                <ul className="list-disc list-inside space-y-1 text-white/80 mb-4">
                  <li><strong>Stripe :</strong> traitement des paiements et abonnements ; aucune donnée de carte stockée par nous.</li>
                  <li><strong>Cloudinary :</strong> hébergement et traitement des images et médias uploadés.</li>
                  <li><strong>OpenAI :</strong> génération de contenu par IA (prompts/réponses) ; pas d&apos;utilisation pour l&apos;entraînement.</li>
                  <li><strong>Vercel :</strong> hébergement de l&apos;application frontend et exécution serverless.</li>
                  <li><strong>AWS / Neon :</strong> hébergement des bases de données et des services backend.</li>
                  <li><strong>SendGrid (ou équivalent) :</strong> envoi d&apos;e-mails transactionnels et de notification.</li>
                  <li><strong>Sentry :</strong> surveillance des erreurs et performance pour améliorer la stabilité du service.</li>
                </ul>
                <h3 className="text-lg font-semibold text-white mb-2">7.2 Transferts internationaux</h3>
                <p className="text-white/80 mb-4">
                  Vos données peuvent être traitées dans des pays situés en Suisse, dans l&apos;Espace économique européen (EEE) ou en dehors (notamment aux États-Unis). La Suisse est reconnue par l&apos;UE comme offrant un niveau de protection adéquat. Pour les transferts vers des pays tiers (ex. États-Unis), nous nous appuions sur les clauses contractuelles types de la Commission européenne (CCT) ou d&apos;autres mécanismes reconnus (certifications, garanties appropriées) afin d&apos;assurer un niveau de protection suffisant.
                </p>
                <h3 className="text-lg font-semibold text-white mb-2">7.3 Pas de vente de données</h3>
                <p className="text-white/80">
                  Nous ne vendons pas vos données personnelles à des tiers. Toute communication à des tiers (hors sous-traitants et autorités en cas d&apos;obligation légale) vous sera explicitement indiquée et, le cas échéant, soumise à votre consentement.
                </p>
              </section>

              {/* 8. Durées de conservation */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">
                  8. Durées de conservation
                </h2>
                <p className="text-white/80 leading-relaxed mb-4">
                  Nous conservons vos données uniquement pendant la durée nécessaire aux finalités pour lesquelles elles ont été collectées, ou conformément aux obligations légales. À titre indicatif :
                </p>
                <div className="overflow-x-auto my-4">
                  <table className="w-full border border-white/10 text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5">
                        <th className="p-3 text-white font-semibold">Type de données</th>
                        <th className="p-3 text-white font-semibold">Durée de conservation</th>
                      </tr>
                    </thead>
                    <tbody className="text-white/80">
                      <tr className="border-b border-white/10"><td className="p-3">Données de compte (inscription, profil)</td><td className="p-3">Durée du compte + 3 ans après clôture (sauf obligation légale plus longue)</td></tr>
                      <tr className="border-b border-white/10"><td className="p-3">Données de paiement / facturation</td><td className="p-3">10 ans à compter de la clôture de l&apos;exercice (obligations comptables suisses)</td></tr>
                      <tr className="border-b border-white/10"><td className="p-3">Contenu (designs, images, configurations)</td><td className="p-3">Durée du compte ; export possible avant suppression</td></tr>
                      <tr className="border-b border-white/10"><td className="p-3">Logs et données d&apos;utilisation</td><td className="p-3">12 à 24 mois selon finalité (sécurité, analytics)</td></tr>
                      <tr className="border-b border-white/10"><td className="p-3">Données de communication (support)</td><td className="p-3">3 ans après clôture du ticket</td></tr>
                      <tr className="border-b border-white/10"><td className="p-3">Cookies (selon type)</td><td className="p-3">Voir Politique des cookies</td></tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-white/80 leading-relaxed">
                  À l&apos;issue de ces délais, les données sont supprimées ou anonymisées de manière irréversible, sauf conservation imposée par la loi.
                </p>
              </section>

              {/* 9. Sécurité */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">
                  9. Sécurité des données
                </h2>
                <p className="text-white/80 leading-relaxed mb-4">
                  Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données contre l&apos;accès non autorisé, la perte, la destruction ou l&apos;altération :
                </p>
                <ul className="list-disc list-inside space-y-2 text-white/80">
                  <li><strong>Chiffrement :</strong> données sensibles au repos avec chiffrement AES-256 lorsque pertinent ; communications via HTTPS/TLS.</li>
                  <li><strong>Authentification :</strong> mots de passe stockés au moyen de fonctions de hachage adaptées (bcrypt, Argon2 ou équivalent), jamais en clair.</li>
                  <li><strong>Accès restreint :</strong> accès aux données personnelles limité aux personnes habilitées et selon le besoin d&apos;en connaître.</li>
                  <li>Surveillance des incidents, sauvegardes régulières et procédures de réponse en cas de violation, conformément à la section 13.</li>
                </ul>
              </section>

              {/* 10. Droits des personnes concernées */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">
                  10. Droits des personnes concernées
                </h2>
                <p className="text-white/80 leading-relaxed mb-4">
                  Sous réserve des conditions prévues par le nLPD/nDSG et le RGPD, vous disposez des droits suivants. Pour les exercer, contactez-nous à <a href="mailto:privacy@luneo.app" className="text-blue-400 hover:text-blue-300 underline">privacy@luneo.app</a> ou à notre DPO <a href="mailto:dpo@luneo.app" className="text-blue-400 hover:text-blue-300 underline">dpo@luneo.app</a>. Nous répondrons dans le délai légal (généralement un mois, prolongeable si nécessaire).
                </p>
                <ul className="list-disc list-inside space-y-2 text-white/80">
                  <li><strong>Droit d&apos;accès :</strong> obtenir la confirmation que vos données sont traitées et une copie de ces données.</li>
                  <li><strong>Droit de rectification :</strong> faire corriger des données inexactes ou incomplètes.</li>
                  <li><strong>Droit à l&apos;effacement :</strong> demander la suppression de vos données dans les cas prévus par la loi (consentement retiré, données non nécessaires, opposition légitime, etc.).</li>
                  <li><strong>Droit à la portabilité :</strong> recevoir les données que vous nous avez fournies dans un format structuré et couramment utilisé, lorsque le traitement est fondé sur le consentement ou l&apos;exécution d&apos;un contrat.</li>
                  <li><strong>Droit d&apos;opposition :</strong> vous opposer au traitement fondé sur l&apos;intérêt légitime (ex. prospection), sous réserve des exceptions légales.</li>
                  <li><strong>Droit à la limitation du traitement :</strong> demander que le traitement soit limité (conservation sans utilisation active) dans les situations prévues par la loi.</li>
                  <li><strong>Droit de retirer le consentement :</strong> à tout moment, pour les traitements fondés sur le consentement, sans affecter la licéité du traitement antérieur.</li>
                  <li><strong>Droit de déposer une plainte :</strong> vous pouvez introduire une réclamation auprès d&apos;une autorité de contrôle, notamment le Préposé fédéral à la protection des données et à la transparence (PFPDT) en Suisse (<a href="https://www.edoeb.admin.ch" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">www.edoeb.admin.ch</a>), ou, si vous résidez dans l&apos;EEE, auprès de l&apos;autorité compétente de votre pays (ex. CNIL en France).</li>
                </ul>
              </section>

              {/* 11. Mineurs */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">
                  11. Protection des données des mineurs
                </h2>
                <p className="text-white/80 leading-relaxed">
                  La plateforme Luneo n&apos;est pas destinée aux personnes âgées de moins de 16 ans. Nous ne collectons pas sciemment de données personnelles concernant des mineurs de moins de 16 ans. Si vous constatez qu&apos;un mineur nous a fourni des données personnelles, merci de nous en informer à <a href="mailto:privacy@luneo.app" className="text-blue-400 hover:text-blue-300 underline">privacy@luneo.app</a> ; nous prendrons les mesures appropriées pour supprimer ces données.
                </p>
              </section>

              {/* 12. Profilage */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">
                  12. Profilage et décisions automatisées
                </h2>
                <p className="text-white/80 leading-relaxed">
                  Nous n&apos;utilisons pas vos données personnelles pour prendre des décisions produisant des effets juridiques vous concernant ou vous affectant de manière significative, uniquement sur la base d&apos;un traitement automatisé (profilage à des fins de décision automatisée). Les outils d&apos;analytics ou d&apos;amélioration du service peuvent produire des traitements statistiques ou agrégés, mais ne sont pas utilisés pour ce type de décision individuelle. Si cette pratique venait à changer, nous vous en informerions et, le cas échéant, recueillerions votre consentement ou vous garantirions le droit d&apos;obtenir une intervention humaine.
                </p>
              </section>

              {/* 13. Notification de violation */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">
                  13. Notification de violation de données
                </h2>
                <p className="text-white/80 leading-relaxed">
                  En cas de violation de données à caractère personnel susceptible d&apos;engendrer un risque élevé pour vos droits et libertés, nous nous engageons à notifier l&apos;autorité de contrôle compétente (PFPDT pour la Suisse, autorité de l&apos;EEE le cas échéant) dans les délais prévus par la loi (72 heures pour le RGPD lorsque applicable), et à vous informer sans délai injustifié lorsque la violation est susceptible d&apos;engendrer un risque élevé pour vous. Les procédures internes de gestion des incidents et de notification sont en place et régulièrement revues.
                </p>
              </section>

              {/* 14. Modifications */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-white mb-4">
                  14. Modifications de la politique
                </h2>
                <p className="text-white/80 leading-relaxed">
                  Nous nous réservons le droit de modifier la présente politique de confidentialité pour refléter les évolutions de nos pratiques, de la réglementation ou du service. La version en vigueur est celle publiée sur cette page, avec indication de la date de dernière mise à jour (Février 2026). En cas de changement substantiel, nous vous en informerons par e-mail ou via un avis prominent sur la plateforme, et, lorsque la loi l&apos;exige, nous recueillerons à nouveau votre consentement. Nous vous encourageons à consulter régulièrement cette page.
                </p>
              </section>

              {/* 15. Contact DPO et autorité */}
              <section className="mb-4">
                <h2 className="text-2xl font-bold text-white mb-4">
                  15. Contact – DPO et autorité de contrôle
                </h2>
                <p className="text-white/80 leading-relaxed mb-4">
                  Pour toute question relative à la protection de vos données, à l&apos;exercice de vos droits ou à cette politique :
                </p>
                <ul className="list-none space-y-1 text-white/80">
                  <li>E-mail général : <a href="mailto:privacy@luneo.app" className="text-blue-400 hover:text-blue-300 underline">privacy@luneo.app</a></li>
                  <li>Délégué à la protection des données (DPO) : <a href="mailto:dpo@luneo.app" className="text-blue-400 hover:text-blue-300 underline">dpo@luneo.app</a></li>
                  <li>Adresse postale : Luneo Tech Sarl, Rue du Seyon 10, 2000 Neuchâtel, Neuchâtel, Suisse</li>
                </ul>
                <p className="text-white/80 leading-relaxed mt-4">
                  Vous avez le droit de déposer une plainte auprès du Préposé fédéral à la protection des données et à la transparence (PFPDT), Monbijoustrasse 61, 3003 Berne, Suisse (<a href="https://www.edoeb.admin.ch" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">www.edoeb.admin.ch</a>). Si vous résidez dans l&apos;EEE, vous pouvez également vous adresser à l&apos;autorité de protection des données de votre pays (ex. CNIL pour la France).
                </p>
              </section>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
