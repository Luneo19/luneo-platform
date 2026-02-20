'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';

const LAST_UPDATE = 'Février 2026';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="relative py-12">
        <div className="relative z-10 max-w-4xl mx-auto px-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Link>

          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              Conditions générales d&apos;utilisation (CGU)
            </h1>
            <p className="text-white/60 text-sm">
              Dernière mise à jour : {LAST_UPDATE}
            </p>
          </div>

          <Card className="p-8 md:p-10 bg-zinc-900/80 border border-white/[0.06]">
            <div className="prose prose-invert max-w-none text-white/80 space-y-10">
              {/* 1. Définitions */}
              <section>
                <h2 className="text-2xl font-bold text-white mb-4">
                  1. Définitions
                </h2>
                <p className="leading-relaxed mb-4">
                  Les termes suivants, lorsqu&apos;ils sont utilisés avec une majuscule dans les présentes Conditions générales d&apos;utilisation («&nbsp;CGU&nbsp;»), ont les significations suivantes&nbsp;:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-white/80">
                  <li><strong className="text-white">«&nbsp;Plateforme&nbsp;»</strong> ou <strong className="text-white">«&nbsp;Luneo&nbsp;»</strong>&nbsp;: le site internet, les applications et l&apos;ensemble des services en ligne fournis par Luneo Tech Sarl, permettant la personnalisation de produits (conception 2D/3D, virtual try-on, génération par IA, intégrations e-commerce).</li>
                  <li><strong className="text-white">«&nbsp;Utilisateur&nbsp;»</strong> ou <strong className="text-white">«&nbsp;Client&nbsp;»</strong>&nbsp;: toute personne physique ou morale qui accède à la Plateforme, s&apos;y inscrit ou utilise les Services, que ce soit en qualité de consommateur ou de professionnel.</li>
                  <li><strong className="text-white">«&nbsp;Services&nbsp;»</strong>&nbsp;: l&apos;ensemble des fonctionnalités, outils et contenus mis à disposition sur la Plateforme, incluant notamment les outils de design, la génération par intelligence artificielle, les intégrations avec des solutions e-commerce et les API associées.</li>
                  <li><strong className="text-white">«&nbsp;Contenu Utilisateur&nbsp;»</strong>&nbsp;: tout contenu (textes, images, modèles 3D, designs, données) créé, importé ou généré par l&apos;Utilisateur via la Plateforme.</li>
                  <li><strong className="text-white">«&nbsp;Contenu Généré par IA&nbsp;»</strong>&nbsp;: tout contenu produit par les fonctionnalités d&apos;intelligence artificielle de la Plateforme à la demande de l&apos;Utilisateur.</li>
                  <li><strong className="text-white">«&nbsp;Compte&nbsp;»</strong>&nbsp;: l&apos;espace personnel de l&apos;Utilisateur, accessible après inscription et authentification, permettant l&apos;accès aux Services selon le plan souscrit.</li>
                  <li><strong className="text-white">«&nbsp;Abonnement&nbsp;»</strong>&nbsp;: l&apos;engagement contractuel par lequel le Client bénéficie d&apos;un accès aux Services selon un plan tarifaire et une durée déterminés.</li>
                </ul>
              </section>

              {/* 2. Objet et acceptation */}
              <section>
                <h2 className="text-2xl font-bold text-white mb-4">
                  2. Objet et acceptation des conditions
                </h2>
                <p className="leading-relaxed mb-4">
                  Les présentes CGU ont pour objet de définir les conditions et modalités d&apos;accès et d&apos;utilisation de la Plateforme Luneo, ainsi que les droits et obligations des parties dans ce cadre. Elles s&apos;appliquent sans réserve ni restriction à tout Utilisateur de la Plateforme.
                </p>
                <p className="leading-relaxed mb-4">
                  L&apos;accès et l&apos;utilisation de la Plateforme sont subordonnés à l&apos;acceptation et au respect des présentes CGU. En créant un Compte, en cochant la case d&apos;acceptation prévue à cet effet ou en utilisant les Services, l&apos;Utilisateur reconnaît avoir pris connaissance des présentes CGU et les accepter dans leur intégralité. En cas de désaccord avec tout ou partie des présentes conditions, l&apos;Utilisateur est tenu de ne pas utiliser la Plateforme.
                </p>
                <p className="leading-relaxed">
                  Pour les Utilisateurs agissant en qualité de consommateurs au sens du droit de l&apos;Union européenne ou du droit suisse, les dispositions impératives protectrices restent applicables. Les présentes CGU sont rédigées en français ; en cas de traduction, la version française prévaudra en cas de divergence.
                </p>
              </section>

              {/* 3. Description des services */}
              <section>
                <h2 className="text-2xl font-bold text-white mb-4">
                  3. Description des services
                </h2>
                <p className="leading-relaxed mb-4">
                  Luneo est une plateforme SaaS (Software as a Service) dédiée à la personnalisation de produits. Elle permet aux Utilisateurs de concevoir, visualiser et proposer des produits personnalisés à leurs propres clients, dans un cadre professionnel ou personnel.
                </p>
                <p className="leading-relaxed mb-4">
                  Les Services comprennent notamment&nbsp;: (a) des outils de conception et d&apos;édition en 2D et 3D pour personnaliser des produits&nbsp;; (b) des fonctionnalités de virtual try-on (essayage virtuel) pour visualiser le rendu sur des supports ou dans des contextes définis&nbsp;; (c) des capacités de génération de contenus ou d&apos;assistance à la création par intelligence artificielle&nbsp;; (d) des intégrations avec des plateformes e-commerce et des flux de production ou de vente&nbsp;; (e) des API et moyens techniques permettant d&apos;intégrer les fonctionnalités de personnalisation dans des sites ou applications tiers, selon le plan souscrit.
                </p>
                <p className="leading-relaxed mb-4">
                  L&apos;étendue exacte des Services (fonctionnalités, quotas, limites techniques) dépend du plan d&apos;abonnement choisi par le Client. Les descriptions et spécifications des Services sont celles en vigueur sur le site au moment de la souscription ; Luneo s&apos;efforce de maintenir la cohérence de l&apos;offre tout en se réservant le droit d&apos;améliorer, modifier ou faire évoluer les Services dans le respect des engagements contractuels.
                </p>
                <p className="leading-relaxed">
                  La Plateforme est fournie «&nbsp;en l&apos;état&nbsp;» (as is). Luneo ne garantit pas que les Services répondront à tous les besoins spécifiques de l&apos;Utilisateur ou qu&apos;ils seront exempts d&apos;interruptions ou d&apos;erreurs ; elle s&apos;engage en revanche à mettre en œuvre les moyens raisonnables pour assurer leur disponibilité et leur bon fonctionnement conformément à la section 13.
                </p>
              </section>

              {/* 4. Inscription et compte utilisateur */}
              <section>
                <h2 className="text-2xl font-bold text-white mb-4">
                  4. Inscription et compte utilisateur
                </h2>
                <p className="leading-relaxed mb-4">
                  L&apos;accès à certaines fonctionnalités de la Plateforme nécessite la création d&apos;un Compte. L&apos;inscription est ouverte aux personnes physiques majeures ou aux personnes morales représentées par une personne habilitée. En s&apos;inscrivant, l&apos;Utilisateur déclare que les informations fournies sont exactes, complètes et à jour, et s&apos;engage à les maintenir telles pour la durée de l&apos;utilisation des Services.
                </p>
                <p className="leading-relaxed mb-4">
                  L&apos;Utilisateur est responsable de la confidentialité de ses identifiants de connexion et de toute activité réalisée à partir de son Compte. Il doit informer immédiatement Luneo de toute utilisation non autorisée ou de tout incident de sécurité. Luneo ne pourra être tenue responsable des dommages résultant de l&apos;usage par des tiers des identifiants de l&apos;Utilisateur en cas de négligence de celui-ci.
                </p>
                <p className="leading-relaxed">
                  Un Compte est personnel et, sauf offre spécifique (ex. Comptes d&apos;équipe ou multi-utilisateurs selon le plan), ne peut être partagé avec des tiers. Luneo se réserve le droit de refuser une inscription ou de suspendre un Compte en cas de manquement aux présentes CGU, de fausse déclaration ou de comportement préjudiciable à la Plateforme ou à d&apos;autres Utilisateurs.
                </p>
              </section>

              {/* 5. Plans d'abonnement et tarification */}
              <section>
                <h2 className="text-2xl font-bold text-white mb-4">
                  5. Plans d&apos;abonnement et tarification
                </h2>
                <p className="leading-relaxed mb-4">
                  Luneo propose plusieurs plans d&apos;abonnement, dont les caractéristiques et tarifs sont décrits sur la page dédiée du site au moment de la souscription. Les prix sont indiqués en euros (EUR), en dollars américains (USD) ou en francs suisses (CHF), selon la zone ou la devise choisie par le Client. Les tarifs peuvent varier selon la devise et le canal de vente (site, partenaires).
                </p>
                <p className="leading-relaxed mb-4">
                  Les plans proposés incluent typiquement&nbsp;: (a) un plan <strong className="text-white">Free</strong> (gratuit), offrant un accès limité aux fonctionnalités et des quotas restreints, à des fins de découverte et d&apos;évaluation&nbsp;; (b) un plan <strong className="text-white">Starter</strong>, destiné aux particuliers ou très petits projets&nbsp;; (c) un plan <strong className="text-white">Professional</strong>, pour les professionnels et petites équipes&nbsp;; (d) un plan <strong className="text-white">Business</strong>, pour les entreprises avec besoins avancés (intégrations, volume, support)&nbsp;; (e) un plan <strong className="text-white">Enterprise</strong>, sur mesure, avec conditions et engagements spécifiques négociés. La description détaillée de chaque plan (fonctionnalités, limites, prix) est disponible sur la Plateforme.
                </p>
                <p className="leading-relaxed mb-4">
                  Les tarifs sont hors taxes pour les Clients assujettis à la TVA dans leur pays, sauf mention contraire ou obligation légale. Luneo Tech Sarl n&apos;est pas actuellement assujettie à la TVA en Suisse (chiffre d&apos;affaires inférieur au seuil applicable, soit 100&nbsp;000 CHF). Aucune TVA suisse n&apos;est facturée sur les prestations fournies par Luneo Tech Sarl dans ce cadre. Pour les Clients situés dans l&apos;Union européenne ou ailleurs, les obligations fiscales locales (TVA, reverse charge, etc.) restent à la charge du Client selon les règles applicables.
                </p>
                <p className="leading-relaxed">
                  Toute modification des offres ou des prix sera communiquée aux Clients existants dans les conditions prévues à la section 19 (Modification des conditions). Les tarifs en vigueur au jour de la souscription ou du renouvellement s&apos;appliquent pour la période concernée.
                </p>
              </section>

              {/* 6. Essai gratuit */}
              <section>
                <h2 className="text-2xl font-bold text-white mb-4">
                  6. Essai gratuit
                </h2>
                <p className="leading-relaxed mb-4">
                  Luneo peut proposer un essai gratuit d&apos;une durée de quatorze (14) jours sur tout ou partie des Services payants. Les conditions de l&apos;essai (durée, fonctionnalités incluses, éligibilité) sont précisées sur la page d&apos;inscription ou dans l&apos;email de confirmation. L&apos;essai gratuit est destiné à permettre au Client d&apos;évaluer les Services avant de souscrire un abonnement payant.
                </p>
                <p className="leading-relaxed mb-4">
                  À l&apos;issue de la période d&apos;essai, si le Client n&apos;a pas annulé son abonnement ou désactivé le renouvellement automatique conformément aux instructions fournies, l&apos;abonnement payant correspondant sera automatiquement activé et les moyens de paiement enregistrés seront débités selon les conditions du plan choisi. Le Client peut annuler avant la fin de l&apos;essai sans frais, via les paramètres de son Compte ou en contactant le support.
                </p>
                <p className="leading-relaxed">
                  Luneo se réserve le droit de limiter l&apos;accès à l&apos;essai gratuit (par exemple un essai par personne ou par organisation, selon l&apos;adresse email ou d&apos;autres critères) et de modifier ou supprimer l&apos;offre d&apos;essai à tout moment, pour les nouvelles inscriptions, sans préjudice des essais déjà en cours.
                </p>
              </section>

              {/* 7. Paiement et facturation */}
              <section>
                <h2 className="text-2xl font-bold text-white mb-4">
                  7. Paiement et facturation
                </h2>
                <p className="leading-relaxed mb-4">
                  Les paiements sont traités par des prestataires tiers sécurisés, en particulier Stripe. En renseignant ses informations de paiement, le Client accepte les conditions d&apos;utilisation du prestataire de paiement et autorise Luneo à facturer les montants dus selon le plan souscrit et la fréquence de facturation (mensuelle ou annuelle, selon l&apos;offre).
                </p>
                <p className="leading-relaxed mb-4">
                  Les factures sont émises au nom de Luneo Tech Sarl, Rue du Seyon 10, 2000 Neuchâtel, Neuchâtel, Suisse, et sont disponibles dans l&apos;espace Compte du Client ou envoyées par email. Les montants sont libellés en EUR, USD ou CHF selon la proposition choisie. En cas de paiement en devise différente de la devise de facturation, les éventuels frais de conversion ou commissions sont à la charge du Client ou de son établissement bancaire.
                </p>
                <p className="leading-relaxed mb-4">
                  Les sommes dues sont exigibles à la date d&apos;échéance indiquée sur la facture. En cas de défaut de paiement, Luneo peut suspendre l&apos;accès aux Services après mise en demeure restée infructueuse, et appliquer des pénalités de retard conformément au droit suisse (taux d&apos;intérêt légal). Les frais de rappel ou de recouvrement peuvent être facturés au Client en cas de retard répété.
                </p>
                <p className="leading-relaxed">
                  Les tarifs souscrits sont fermes pour la période d&apos;abonnement en cours. En cas de changement de plan (upgrade ou downgrade), les règles d&apos;ajustement prorata temporis ou au prochain renouvellement sont décrites sur la Plateforme ou communiquées sur demande.
                </p>
              </section>

              {/* 8. Droit de rétractation */}
              <section>
                <h2 className="text-2xl font-bold text-white mb-4">
                  8. Droit de rétractation
                </h2>
                <p className="leading-relaxed mb-4">
                  Conformément au droit de la consommation de l&apos;Union européenne (directive 2011/83/UE et droits nationaux de transposition), le consommateur qui contracte à distance dispose d&apos;un délai de quatorze (14) jours calendaires à compter du jour de la conclusion du contrat pour exercer son droit de rétractation, sans avoir à justifier de motifs ni à payer de pénalités.
                </p>
                <p className="leading-relaxed mb-4">
                  Si l&apos;Utilisateur exerce ce droit dans le délai imparti, Luneo lui remboursera tous les paiements reçus, y compris les frais de livraison des prestations (s&apos;il en existe), sans retard excessif et au plus tard dans les quatorze (14) jours suivant la notification de la rétractation. Le remboursement pourra être effectué par le même moyen de paiement que celui utilisé pour la transaction initiale, sauf accord exprès pour un autre moyen.
                </p>
                <p className="leading-relaxed mb-4">
                  L&apos;Utilisateur peut perdre son droit de rétractation s&apos;il a expressément demandé l&apos;exécution des Services avant la fin du délai de 14 jours et que les prestations ont été entièrement fournies. Il peut également y renoncer explicitement après avoir été informé de ce droit. Pour exercer la rétractation, le Client peut utiliser le formulaire type ou envoyer une déclaration non équivoque à l&apos;adresse legal@luneo.app.
                </p>
                <p className="leading-relaxed">
                  Les Clients professionnels (B2B) ou les Utilisateurs hors Union européenne ne bénéficient du droit de rétractation que dans la mesure où le droit applicable le prévoit. En Suisse, le droit de la consommation (LPC) peut prévoir des délais ou conditions spécifiques selon le type de contrat.
                </p>
              </section>

              {/* 9. Propriété intellectuelle */}
              <section>
                <h2 className="text-2xl font-bold text-white mb-4">
                  9. Propriété intellectuelle
                </h2>
                <p className="leading-relaxed mb-4">
                  La Plateforme Luneo, incluant mais sans s&apos;y limiter son code source, son design, sa structure, ses bases de données, ses marques, logos, textes et contenus éditoriaux, est protégée par le droit d&apos;auteur, le droit des marques et le droit suisse et international applicable. Luneo Tech Sarl et/ou ses concédants de licence en sont les titulaires exclusifs. Aucune disposition des présentes CGU ne transfère à l&apos;Utilisateur de droits de propriété intellectuelle sur la Plateforme elle-même.
                </p>
                <p className="leading-relaxed mb-4">
                  Les Contenus Utilisateur restent la propriété de l&apos;Utilisateur qui les a créés ou importés. L&apos;Utilisateur garantit qu&apos;il dispose des droits nécessaires sur ces contenus pour les utiliser sur la Plateforme et pour accorder les licences prévues ci-dessous. En publiant ou en utilisant des contenus sur la Plateforme, l&apos;Utilisateur accorde à Luneo Tech Sarl une licence mondiale, non exclusive, transférable (sous-licenciable), libre de redevances, pour utiliser, reproduire, adapter, afficher et distribuer ces contenus dans le cadre de la fourniture et de l&apos;exploitation des Services (hébergement, traitement, affichage, intégration dans les flux e-commerce, etc.), et pour la durée nécessaire à la fourniture des Services et au respect des obligations légales.
                </p>
                <p className="leading-relaxed">
                  Les Contenus Générés par IA font l&apos;objet de la section 11. Sous réserve de ces dispositions, Luneo ne revendique aucun droit de propriété sur les Contenus Utilisateur et s&apos;engage à ne pas les utiliser en dehors du cadre des Services sans accord explicite de l&apos;Utilisateur, sauf obligation légale ou décision de justice.
                </p>
              </section>

              {/* 10. Licence d'utilisation de la plateforme */}
              <section>
                <h2 className="text-2xl font-bold text-white mb-4">
                  10. Licence d&apos;utilisation de la plateforme
                </h2>
                <p className="leading-relaxed mb-4">
                  Sous réserve du respect des présentes CGU et du paiement des sommes dues, Luneo Tech Sarl accorde à l&apos;Utilisateur une licence personnelle, non exclusive, non transférable, révocable et mondiale, d&apos;accéder et d&apos;utiliser la Plateforme et les Services, pour la durée de l&apos;Abonnement ou de l&apos;accès gratuit, conformément aux fonctionnalités et limites du plan souscrit.
                </p>
                <p className="leading-relaxed mb-4">
                  Cette licence est accordée à titre d&apos;usage (right to use). L&apos;Utilisateur ne peut en aucun cas&nbsp;: (a) copier, modifier, décompiler, désassembler ou créer des œuvres dérivées à partir de la Plateforme ou de tout élément protégé&nbsp;; (b) contourner les mesures techniques de protection ou les limites d&apos;usage&nbsp;; (c) louer, prêter, vendre, sous-licencier ou transférer tout droit d&apos;accès ou d&apos;utilisation à des tiers&nbsp;; (d) utiliser la Plateforme à des fins illégales, pour porter atteinte aux droits de tiers ou pour surcharger ou dégrader les systèmes. Tout usage non autorisé peut entraîner la résiliation du Compte et des poursuites.
                </p>
                <p className="leading-relaxed">
                  Les mises à jour et évolutions de la Plateforme sont incluses dans la licence pendant la durée de l&apos;Abonnement, sous réserve de leur disponibilité et des conditions techniques. Luneo peut imposer des mises à jour nécessaires à la sécurité ou à la compatibilité.
                </p>
              </section>

              {/* 11. Contenus générés par IA */}
              <section>
                <h2 className="text-2xl font-bold text-white mb-4">
                  11. Contenus générés par IA
                </h2>
                <p className="leading-relaxed mb-4">
                  La Plateforme peut inclure des fonctionnalités utilisant l&apos;intelligence artificielle pour générer des textes, images, designs ou autres contenus à partir des instructions ou des données fournies par l&apos;Utilisateur. Ces contenus sont qualifiés de Contenus Générés par IA.
                </p>
                <p className="leading-relaxed mb-4">
                  Luneo met en œuvre des modèles et des processus conformes à ses engagements éthiques et aux réglementations applicables. Toutefois, les systèmes d&apos;IA peuvent produire des résultats imprévisibles, incomplets ou susceptibles de ressembler à des œuvres ou signes distinctifs existants. Luneo ne garantit pas que les Contenus Générés par IA sont exempts de tout risque de contrefaçon ou d&apos;atteinte aux droits de tiers (droits d&apos;auteur, marques, droit à l&apos;image, etc.). Il appartient à l&apos;Utilisateur de vérifier, avant toute exploitation commerciale ou diffusion, que les contenus générés ne violent pas les droits de tiers et de prendre les mesures appropriées (vérifications, assurances, avis juridiques).
                </p>
                <p className="leading-relaxed">
                  Sous réserve des présentes et des conditions des fournisseurs d&apos;IA utilisés par la Plateforme, l&apos;Utilisateur peut être autorisé à utiliser les Contenus Générés par IA qu&apos;il a obtenus via la Plateforme dans le cadre de son activité, selon les règles affichées dans l&apos;interface ou dans la documentation. Luneo décline toute responsabilité en cas de litige entre l&apos;Utilisateur et un tiers portant sur l&apos;origine ou l&apos;exploitation de Contenus Générés par IA.
                </p>
              </section>

              {/* 12. Données personnelles */}
              <section>
                <h2 className="text-2xl font-bold text-white mb-4">
                  12. Données personnelles
                </h2>
                <p className="leading-relaxed mb-4">
                  Le traitement des données personnelles des Utilisateurs est régi par la Politique de confidentialité de Luneo, accessible sur la Plateforme et conforme au Règlement général sur la protection des données (RGPD) et au droit suisse (LPD révisée). En utilisant la Plateforme, l&apos;Utilisateur accepte le traitement de ses données personnelles dans les conditions décrites dans cette politique.
                </p>
                <p className="leading-relaxed mb-4">
                  Les données collectées sont nécessaires à la gestion du Compte, à la fourniture des Services, à la facturation, au support et à l&apos;amélioration de la Plateforme. L&apos;Utilisateur dispose des droits d&apos;accès, de rectification, d&apos;effacement, de limitation du traitement, de portabilité et d&apos;opposition, dans les conditions prévues par la loi et décrites dans la Politique de confidentialité. Pour toute question relative aux données personnelles, l&apos;Utilisateur peut contacter le délégué à la protection des données ou l&apos;équipe indiquée dans la Politique de confidentialité et à la section 23 des présentes CGU.
                </p>
                <p className="leading-relaxed">
                  En cas de contradiction entre les présentes CGU et la Politique de confidentialité sur le traitement des données personnelles, les dispositions de la Politique de confidentialité prévaudront pour ce qui concerne le traitement des données à caractère personnel.
                </p>
              </section>

              {/* 13. Disponibilité et maintenance */}
              <section>
                <h2 className="text-2xl font-bold text-white mb-4">
                  13. Disponibilité et maintenance
                </h2>
                <p className="leading-relaxed mb-4">
                  Luneo s&apos;efforce d&apos;assurer la disponibilité de la Plateforme 24 heures sur 24 et 7 jours sur 7, dans la limite des contraintes techniques et des opérations de maintenance. Un objectif indicatif de disponibilité de 99,9&nbsp;% sur une période mensuelle (hors maintenances planifiées et cas de force majeure) est visé pour les plans payants ; cet objectif ne constitue pas un engagement contractuel (SLA) sauf stipulation contraire dans un accord Enterprise ou un avenant spécifique.
                </p>
                <p className="leading-relaxed mb-4">
                  Les maintenances planifiées (mises à jour, déploiements) peuvent entraîner des indisponibilités de courte durée. Luneo s&apos;efforce de les réaliser en dehors des heures de pointe et d&apos;en informer les Clients lorsque cela est possible. Les maintenances urgentes (sécurité, corrections critiques) peuvent être effectuées sans préavis dans la mesure du raisonnable.
                </p>
                <p className="leading-relaxed">
                  Luneo ne peut être tenue responsable des indisponibilités ou dégradations dues à des facteurs hors de son contrôle raisonnable (force majeure, défaillance des réseaux ou des prestataires tiers, actes malveillants de tiers, etc.), sous réserve des obligations légales et de l&apos;article 16 (Limitation de responsabilité).
                </p>
              </section>

              {/* 14. Limitation de responsabilité */}
              <section>
                <h2 className="text-2xl font-bold text-white mb-4">
                  14. Limitation de responsabilité
                </h2>
                <p className="leading-relaxed mb-4">
                  Dans les limites autorisées par le droit applicable, la responsabilité de Luneo Tech Sarl et de ses préposés, mandataires ou partenaires, à l&apos;égard de l&apos;Utilisateur ou de tout tiers, pour tout dommage résultant de l&apos;accès ou de l&apos;utilisation de la Plateforme ou des Services, ou de l&apos;impossibilité de les utiliser, est limitée au montant effectivement payé par le Client à Luneo Tech Sarl au titre des Services au cours des douze (12) mois précédant le fait générateur du dommage, ou, à défaut de paiement, à un plafond de cent (100) francs suisses.
                </p>
                <p className="leading-relaxed mb-4">
                  Luneo Tech Sarl ne pourra en aucun cas être tenue responsable des dommages indirects, tels que les pertes de chiffre d&apos;affaires, de bénéfices, de données, de clientèle, ou tout autre préjudice économique ou commercial, même si Luneo Tech Sarl a été informée de la possibilité de tels dommages. Cette limitation s&apos;applique que la responsabilité soit invoquée en contractuel, en délictuel ou sur tout autre fondement.
                </p>
                <p className="leading-relaxed">
                  Les limitations et exclusions ci-dessus restent applicables dans toute la mesure permise par la loi. Certaines juridictions n&apos;autorisent pas l&apos;exclusion ou la limitation de la responsabilité pour dommages directs ou pour négligence grave ; dans ces cas, la responsabilité de Luneo Tech Sarl sera limitée au maximum autorisé par la loi applicable.
                </p>
              </section>

              {/* 15. Garanties et exclusions */}
              <section>
                <h2 className="text-2xl font-bold text-white mb-4">
                  15. Garanties et exclusions
                </h2>
                <p className="leading-relaxed mb-4">
                  Les Services sont fournis «&nbsp;en l&apos;état&nbsp;» (as is) et «&nbsp;selon disponibilité&nbsp;» (as available). Dans la mesure permise par le droit applicable, Luneo Tech Sarl n&apos;accorde aucune garantie expresse ou implicite, notamment de conformité à un usage particulier, d&apos;absence d&apos;erreur ou d&apos;interruption, ou de non-contrefaçon des contenus générés par IA.
                </p>
                <p className="leading-relaxed mb-4">
                  L&apos;Utilisateur assume l&apos;ensemble des risques liés à l&apos;utilisation de la Plateforme et à l&apos;exploitation des contenus qu&apos;il y crée ou qu&apos;il en obtient. Aucune déclaration ou information fournie par Luneo (oralement ou par écrit) ne constitue une garantie supplémentaire, sauf mention écrite et signée à cet effet.
                </p>
                <p className="leading-relaxed">
                  Les garanties légales impératives (par exemple pour les consommateurs dans l&apos;UE ou en Suisse) ne sont pas exclues. En cas de défaut de conformité, les droits du consommateur (réparation, remplacement, réduction du prix, résolution) restent régis par la loi applicable.
                </p>
              </section>

              {/* 16. Résiliation */}
              <section>
                <h2 className="text-2xl font-bold text-white mb-4">
                  16. Résiliation
                </h2>
                <p className="leading-relaxed mb-4">
                  <strong className="text-white">Résiliation par le Client.</strong> Le Client peut résilier son Abonnement à tout moment via les paramètres de son Compte ou en contactant le support. La résiliation prend effet à la fin de la période en cours (fin du mois ou de l&apos;année d&apos;abonnement) ; aucun remboursement prorata temporis n&apos;est accordé pour la période déjà facturée, sauf disposition légale contraire ou offre spécifique. Après la date d&apos;effet, l&apos;accès aux Services payants est révoqué ; l&apos;Utilisateur peut toutefois exporter ses données conformément à la section 17.
                </p>
                <p className="leading-relaxed mb-4">
                  <strong className="text-white">Résiliation par Luneo.</strong> Luneo peut suspendre ou résilier l&apos;accès d&apos;un Utilisateur, sans préavis en cas de manquement grave aux présentes CGU, d&apos;utilisation illicite de la Plateforme, de non-paiement après mise en demeure, ou pour tout motif légitime. Elle peut également cesser l&apos;offre d&apos;un plan ou des Services, avec un préavis raisonnable (au moins trente (30) jours pour les Abonnements payants), en proposant le cas échéant une solution de remplacement ou un remboursement prorata.
                </p>
                <p className="leading-relaxed mb-4">
                  <strong className="text-white">Effets de la résiliation.</strong> À l&apos;issue de la résiliation, le droit d&apos;utilisation des Services prend fin. L&apos;Utilisateur reste tenu des sommes dues jusqu&apos;à la date d&apos;effet. Les dispositions qui, par leur nature, doivent survivre à la résiliation (propriété intellectuelle, limitation de responsabilité, droit applicable, etc.) restent en vigueur.
                </p>
                <p className="leading-relaxed">
                  En cas de plan gratuit, Luneo peut supprimer ou désactiver le Compte après une période d&apos;inactivité prolongée, conformément à la Politique de confidentialité et aux informations communiquées à l&apos;Utilisateur.
                </p>
              </section>

              {/* 17. Propriété des données et portabilité */}
              <section>
                <h2 className="text-2xl font-bold text-white mb-4">
                  17. Propriété des données et portabilité
                </h2>
                <p className="leading-relaxed mb-4">
                  Les données et contenus créés ou importés par l&apos;Utilisateur dans le cadre de l&apos;utilisation des Services restent sa propriété. Luneo ne les utilise pas à des fins propres en dehors de la fourniture des Services et des usages autorisés par les présentes CGU et la Politique de confidentialité.
                </p>
                <p className="leading-relaxed mb-4">
                  Luneo met à disposition des moyens d&apos;export des données utilisateur (contenus, projets, configurations) dans des formats standards, dans les limites techniques du Compte et du plan souscrit. L&apos;Utilisateur est invité à procéder à des exports réguliers s&apos;il souhaite conserver une copie locale. Après résiliation, un délai de grâce peut être accordé pour récupérer les données ; passé ce délai, Luneo pourra procéder à la suppression des données conformément à sa Politique de confidentialité et à la loi.
                </p>
                <p className="leading-relaxed">
                  Le droit à la portabilité des données personnelles (RGPD, LPD) s&apos;exerce dans les conditions décrites dans la Politique de confidentialité.
                </p>
              </section>

              {/* 18. Sous-traitants et services tiers */}
              <section>
                <h2 className="text-2xl font-bold text-white mb-4">
                  18. Sous-traitants et services tiers
                </h2>
                <p className="leading-relaxed mb-4">
                  La fourniture des Services peut impliquer l&apos;intervention de sous-traitants et de prestataires tiers, pour l&apos;hébergement, les paiements, le stockage de fichiers, l&apos;intelligence artificielle, l&apos;analyse ou d&apos;autres fonctionnalités. Luneo sélectionne des prestataires reconnus et s&apos;engage à ce que les traitements de données réalisés par ces tiers soient conformes au RGPD et au droit applicable (contrats, garanties, sous-traitance).
                </p>
                <p className="leading-relaxed mb-4">
                  Les principaux sous-traitants ou services tiers utilisés incluent notamment&nbsp;: Stripe (paiement)&nbsp;; Cloudinary (stockage et traitement d&apos;images/médias)&nbsp;; OpenAI ou autres fournisseurs d&apos;IA (génération de contenus)&nbsp;; Vercel (hébergement frontend)&nbsp;; AWS ou équivalents (infrastructure, hébergement backend). La liste détaillée et les garanties peuvent être communiquées sur demande ou figurer dans la Politique de confidentialité ou un DPA (Data Processing Agreement) pour les Clients concernés.
                </p>
                <p className="leading-relaxed">
                  L&apos;utilisation de ces services tiers peut être soumise à leurs propres conditions générales et politiques de confidentialité. En cas de défaillance ou de modification des services tiers, Luneo s&apos;efforcera de maintenir la continuité des Services ou de proposer des alternatives dans la mesure du possible, sans engagement de résultat.
                </p>
              </section>

              {/* 19. Modification des conditions */}
              <section>
                <h2 className="text-2xl font-bold text-white mb-4">
                  19. Modification des conditions
                </h2>
                <p className="leading-relaxed mb-4">
                  Luneo se réserve le droit de modifier les présentes CGU à tout moment, pour des raisons d&apos;adaptation juridique, d&apos;évolution des Services ou pour tout motif légitime. Les modifications seront publiées sur la Plateforme avec indication de la date de dernière mise à jour. Pour les Clients ayant un Abonnement en cours, les modifications substantielles (tarifs, périmètre des Services, responsabilité, résiliation) seront portées à leur connaissance par email ou notification dans l&apos;interface, au moins trente (30) jours avant leur entrée en vigueur, lorsque la loi l&apos;exige ou lorsque Luneo le juge approprié.
                </p>
                <p className="leading-relaxed mb-4">
                  Si l&apos;Utilisateur n&apos;accepte pas les modifications, il peut résilier son Abonnement avant la date d&apos;entrée en vigueur des nouvelles conditions ; à défaut, la poursuite de l&apos;utilisation des Services après cette date vaut acceptation des CGU modifiées. Pour les consommateurs, le droit applicable peut prévoir des règles spécifiques (information, droit de résiliation sans frais, etc.).
                </p>
                <p className="leading-relaxed">
                  Les conditions applicables à un litige ou à une période donnée sont celles en vigueur au moment des faits concernés.
                </p>
              </section>

              {/* 20. Force majeure */}
              <section>
                <h2 className="text-2xl font-bold text-white mb-4">
                  20. Force majeure
                </h2>
                <p className="leading-relaxed mb-4">
                  Aucune des parties ne pourra être tenue responsable d&apos;un retard ou d&apos;une inexécution de ses obligations découlant des présentes CGU lorsque ce retard ou cette inexécution résulte d&apos;un cas de force majeure au sens du droit suisse (art. 97 CO) et du droit applicable, notamment&nbsp;: catastrophe naturelle, guerre, émeute, pandémie, blocage des moyens de transport ou de communication, décision des autorités, grève générale, défaillance majeure d&apos;un fournisseur d&apos;infrastructure ou d&apos;un réseau public, cyberattaque majeure ou tout autre événement échappant au contrôle raisonnable de la partie concernée.
                </p>
                <p className="leading-relaxed mb-4">
                  La partie affectée par un cas de force majeure doit en informer l&apos;autre partie dans les plus brefs délais et faire tout ce qui est raisonnablement possible pour limiter les conséquences et reprendre l&apos;exécution dès que possible. Si la force majeure persiste au-delà d&apos;une durée raisonnable (par exemple soixante (60) jours), chaque partie pourra résilier le contrat pour la partie non exécutée, sans indemnité, par notification écrite.
                </p>
                <p className="leading-relaxed">
                  Pendant la période de force majeure, les obligations du Client (notamment paiement des sommes déjà dues) peuvent rester exigibles pour la partie déjà exécutée ou pour les périodes antérieures à l&apos;événement.
                </p>
              </section>

              {/* 21. Droit applicable et juridiction */}
              <section>
                <h2 className="text-2xl font-bold text-white mb-4">
                  21. Droit applicable et juridiction
                </h2>
                <p className="leading-relaxed mb-4">
                  Les présentes CGU sont régies par le droit suisse, à l&apos;exclusion des règles de conflit de lois et de la Convention des Nations Unies sur les contrats de vente internationale de marchandises (CVIM). Les rapports contractuels entre Luneo Tech Sarl et le Client sont soumis au Code des obligations (CO) et aux autres lois suisses applicables.
                </p>
                <p className="leading-relaxed mb-4">
                  Pour les litiges nés de l&apos;interprétation ou de l&apos;exécution des présentes CGU, les tribunaux du canton de Neuchâtel (Suisse) sont seuls compétents, sous réserve des dispositions impératives protégeant le consommateur (notamment en matière de for en UE ou en Suisse). Luneo Tech Sarl peut toutefois intenter une action devant le tribunal du domicile du Client consommateur lorsque la loi l&apos;y autorise.
                </p>
                <p className="leading-relaxed">
                  En cas de litige, les parties s&apos;efforceront de trouver une solution amiable avant toute action judiciaire. Les langues de la relation contractuelle et des présentes CGU sont le français et, le cas échéant, l&apos;anglais pour les versions traduites ; en cas de divergence, la version française prévaut.
                </p>
              </section>

              {/* 22. Dispositions générales */}
              <section>
                <h2 className="text-2xl font-bold text-white mb-4">
                  22. Dispositions générales
                </h2>
                <p className="leading-relaxed mb-4">
                  <strong className="text-white">Divisibilité.</strong> Si une ou plusieurs dispositions des présentes CGU sont ou deviennent invalides ou inapplicables, la validité des autres dispositions n&apos;en sera pas affectée. La disposition invalide ou inapplicable sera réputée modifiée dans la mesure minimale nécessaire pour la rendre valide et applicable, dans le respect de l&apos;intention des parties.
                </p>
                <p className="leading-relaxed mb-4">
                  <strong className="text-white">Renonciation.</strong> Le fait pour Luneo Tech Sarl de ne pas exiger l&apos;application stricte d&apos;une clause des présentes CGU ou de ne pas se prévaloir d&apos;un manquement ne constitue pas une renonciation à invoquer cette clause ou ce manquement ultérieurement.
                </p>
                <p className="leading-relaxed mb-4">
                  <strong className="text-white">Intégralité.</strong> Les présentes CGU, avec les documents auxquels elles renvoient (Politique de confidentialité, conditions des offres, etc.), constituent l&apos;intégralité de l&apos;accord entre l&apos;Utilisateur et Luneo Tech Sarl concernant l&apos;accès et l&apos;utilisation de la Plateforme, et remplacent toute proposition, accord ou communication antérieure, oral ou écrit, sur le même objet.
                </p>
                <p className="leading-relaxed">
                  <strong className="text-white">Cession.</strong> L&apos;Utilisateur ne peut céder ou transférer ses droits et obligations découlant des présentes CGU sans l&apos;accord préalable écrit de Luneo Tech Sarl. Luneo Tech Sarl peut céder ses droits et obligations à une société affiliée ou dans le cadre d&apos;une fusion, acquisition ou cession d&apos;actifs, sous réserve d&apos;informer les Clients dans des conditions raisonnables.
                </p>
              </section>

              {/* 23. Contact */}
              <section>
                <h2 className="text-2xl font-bold text-white mb-4">
                  23. Contact
                </h2>
                <p className="leading-relaxed mb-4">
                  Pour toute question relative aux présentes CGU, à la Plateforme Luneo ou à vos droits en tant qu&apos;Utilisateur, vous pouvez contacter&nbsp;:
                </p>
                <p className="leading-relaxed mb-2 text-white/90">
                  Luneo Tech Sarl
                  <br />
                  Rue du Seyon 10, 2000 Neuchâtel
                  <br />
                  Neuchâtel, Suisse
                  <br />
                  Identification&nbsp;: CHE-000.000.000
                </p>
                <p className="leading-relaxed">
                  Email juridique et demandes légales&nbsp;:{' '}
                  <a
                    href="mailto:legal@luneo.app"
                    className="text-blue-400 hover:text-blue-300 underline"
                  >
                    legal@luneo.app
                  </a>
                </p>
                <p className="leading-relaxed mt-4 text-white/70 text-sm">
                  Nous nous engageons à traiter les demandes dans un délai raisonnable et conformément aux obligations légales applicables.
                </p>
              </section>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
