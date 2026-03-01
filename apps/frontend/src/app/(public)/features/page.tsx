'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Globe,
  BrainCircuit,
  ArrowRight,
  Check,
  Zap,
  Sparkles,
  Bot,
  Database,
  LineChart,
  Plug,
  Lock,
  Star,
  ChevronDown,
  Play,
} from 'lucide-react';

const HERO_STATS = [
  { value: '500+', label: 'Entreprises utilisatrices' },
  { value: '2M+', label: 'Conversations traitées' },
  { value: '95%', label: 'Taux de satisfaction' },
  { value: '<2s', label: 'Temps de réponse moyen' },
];

const FEATURES_DETAILED = [
  {
    id: 'agents',
    icon: Bot,
    title: 'Agents Conversationnels IA',
    subtitle: 'L\'intelligence de GPT-4, Claude et Mistral au service de vos clients',
    description:
      'Créez des agents sur-mesure qui comprennent votre métier, répondent avec la voix de votre marque et apprennent en continu. Choisissez le modèle IA adapté à chaque situation.',
    highlights: [
      'Multi-modèles : GPT-4o, Claude 3.5, Mistral Large',
      'RAG avancé avec recherche sémantique sur vos données',
      'Personnalisation du ton, style et personnalité',
      'Escalade intelligente vers un agent humain',
      'Historique des conversations et contexte persistant',
      'Entraînement continu sur vos feedbacks',
    ],
    gradient: 'from-blue-500 to-indigo-600',
    href: '/product/agents',
  },
  {
    id: 'knowledge',
    icon: Database,
    title: 'Base de Connaissances Vectorielle',
    subtitle: 'Vos documents, FAQ et sites web indexés en quelques minutes',
    description:
      'Importez n\'importe quel format — PDF, DOCX, HTML, CSV — et transformez-le en une base de connaissances intelligente. Vos agents puisent dans vos données pour des réponses précises et sourcées.',
    highlights: [
      'Import drag & drop : PDF, DOCX, HTML, CSV, Markdown',
      'Crawling automatique de sites web',
      'Embeddings vectoriels pour recherche sémantique',
      'Synchronisation automatique des sources',
      'Gestion fine des permissions par équipe',
      'Chunking intelligent et versioning',
    ],
    gradient: 'from-emerald-500 to-teal-600',
    href: '/product/knowledge-base',
  },
  {
    id: 'analytics',
    icon: LineChart,
    title: 'Analytics & Insights Temps Réel',
    subtitle: 'Mesurez, analysez et optimisez la performance de chaque agent',
    description:
      'Tableaux de bord en temps réel, scoring de satisfaction automatique, analyse des sujets tendance et rapports programmables. Prenez des décisions data-driven pour améliorer continuellement vos agents.',
    highlights: [
      'Dashboard en temps réel avec KPIs clés',
      'Score CSAT automatique après chaque conversation',
      'Analyse des sujets et questions fréquentes',
      'Détection automatique des questions sans réponse',
      'Export CSV/PDF et rapports automatisés',
      'Benchmarking par agent, canal et période',
    ],
    gradient: 'from-violet-500 to-purple-600',
    href: '/product/analytics',
  },
  {
    id: 'multichannel',
    icon: Globe,
    title: 'Déploiement Multi-Canal',
    subtitle: 'Vos agents partout où vos clients vous contactent',
    description:
      'Widget web, email, Slack, WhatsApp, Telegram, Messenger — déployez un seul agent sur tous vos canaux. Les conversations sont unifiées dans un seul tableau de bord.',
    highlights: [
      'Widget web personnalisable (couleurs, avatar, position)',
      'Intégration WhatsApp Business & Telegram',
      'Email : réponses automatiques intelligentes',
      'Slack & Teams pour le support interne',
      'SDK JavaScript pour une intégration sur-mesure',
      'Conversations unifiées cross-canal',
    ],
    gradient: 'from-cyan-500 to-blue-600',
    href: '/product/integrations',
  },
  {
    id: 'security',
    icon: Lock,
    title: 'Sécurité & Conformité RGPD',
    subtitle: 'Vos données protégées et souveraines en Europe',
    description:
      'Hébergement européen, chiffrement de bout en bout, contrôle d\'accès granulaire et logs d\'audit complets. Luneo est conçu pour répondre aux exigences des entreprises les plus strictes.',
    highlights: [
      'Hébergement 100% européen (Paris CDG1)',
      'Chiffrement AES-256 au repos et en transit',
      'SSO / SAML pour les entreprises',
      'Contrôle d\'accès par rôle (RBAC)',
      'Logs d\'audit complets et exportables',
      'Certifications SOC 2 et ISO 27001 (en cours)',
    ],
    gradient: 'from-amber-500 to-orange-600',
    href: '/enterprise',
  },
  {
    id: 'integrations',
    icon: Plug,
    title: '30+ Intégrations Natives',
    subtitle: 'Shopify, WooCommerce, HubSpot, Stripe et bien plus',
    description:
      'Connectez vos outils existants en quelques clics. E-commerce, CRM, paiement, communication — Luneo s\'adapte à votre stack technique.',
    highlights: [
      'Shopify & WooCommerce : catalogue, commandes, clients',
      'HubSpot, Salesforce, Pipedrive : CRM natif',
      'Stripe : gestion des paiements et abonnements',
      'Zapier & Make : 5 000+ automatisations',
      'API REST complète avec documentation OpenAPI',
      'Webhooks en temps réel pour vos workflows',
    ],
    gradient: 'from-pink-500 to-rose-600',
    href: '/product/integrations',
  },
];

const TESTIMONIALS = [
  {
    quote:
      'Luneo a transformé notre support client. Nos temps de réponse sont passés de 4h à moins de 2 secondes, et nos clients adorent.',
    author: 'Marie Dupont',
    role: 'Directrice Service Client',
    company: 'ModaShop',
    rating: 5,
  },
  {
    quote:
      'Depuis l\'intégration de Luneo, notre taux de conversion a augmenté de 35%. L\'agent recommande les bons produits au bon moment.',
    author: 'Thomas Martin',
    role: 'CEO',
    company: 'TechStore',
    rating: 5,
  },
  {
    quote:
      'La base de connaissances vectorielle est incroyable. On a importé 500 pages de docs en 10 minutes et l\'agent répond avec une précision de 96%.',
    author: 'Sophie Bernard',
    role: 'VP Engineering',
    company: 'DataFlow',
    rating: 5,
  },
];

const COMPARISON = [
  { feature: 'Agents IA multi-modèles', luneo: true, traditional: false },
  { feature: 'Base de connaissances vectorielle (RAG)', luneo: true, traditional: false },
  { feature: 'Déploiement en < 5 minutes', luneo: true, traditional: false },
  { feature: 'Analytics temps réel', luneo: true, traditional: 'Partiel' },
  { feature: 'Multi-canal unifié', luneo: true, traditional: 'Limité' },
  { feature: 'RGPD & hébergement EU', luneo: true, traditional: 'Variable' },
  { feature: 'API ouverte & webhooks', luneo: true, traditional: 'Limité' },
  { feature: 'Escalade intelligente', luneo: true, traditional: false },
  { feature: 'Tarification transparente', luneo: true, traditional: false },
];

const FAQ = [
  {
    q: 'Combien de temps faut-il pour déployer un agent ?',
    a: 'Moins de 5 minutes. Créez votre compte, importez vos données (ou connectez votre site web), personnalisez le ton de votre agent et déployez-le sur votre site avec un simple snippet JavaScript.',
  },
  {
    q: 'Quels modèles IA sont disponibles ?',
    a: 'GPT-4o, GPT-4 Turbo, Claude 3.5 Sonnet, Claude 3 Opus, Mistral Large et d\'autres. Vous pouvez changer de modèle à tout moment ou combiner plusieurs modèles pour différents cas d\'usage.',
  },
  {
    q: 'Mes données sont-elles sécurisées ?',
    a: 'Absolument. Vos données sont hébergées en Europe (Paris CDG1), chiffrées AES-256, et ne sont jamais utilisées pour entraîner des modèles IA. Nous sommes conformes RGPD avec un DPA disponible sur demande.',
  },
  {
    q: 'Puis-je essayer gratuitement ?',
    a: 'Oui ! Le plan gratuit inclut 1 agent, 100 conversations/mois et l\'accès à toutes les fonctionnalités de base. Aucune carte bancaire requise.',
  },
  {
    q: 'Luneo remplace-t-il mon équipe support ?',
    a: 'Non, Luneo augmente votre équipe. Votre agent IA gère automatiquement 70-80% des demandes répétitives, permettant à vos agents humains de se concentrer sur les cas complexes et la relation client à forte valeur.',
  },
];

export default function FeaturesPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[#050510] text-white">
      {/* Hero */}
      <section className="relative overflow-hidden pt-28 pb-20 sm:pt-36 sm:pb-28">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-transparent to-cyan-600/10" />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-1.5 text-sm font-medium text-indigo-300">
            <Sparkles className="h-4 w-4" />
            Plateforme d&apos;Agents IA #1 en France
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-7xl">
            <span className="block">Automatisez votre</span>
            <span className="mt-2 block bg-gradient-to-r from-indigo-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              relation client avec l&apos;IA
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/60 sm:text-xl">
            Déployez des agents IA entraînés sur vos données en moins de 5 minutes.
            Répondez 24/7, réduisez vos coûts de support de 60% et augmentez la
            satisfaction de vos clients.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40"
            >
              Commencer gratuitement
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-8 py-4 text-lg font-medium text-white/80 transition-all hover:bg-white/[0.08]"
            >
              <Play className="h-5 w-5" />
              Voir la démo
            </Link>
          </div>
          <p className="mt-4 text-sm text-white/40">
            Gratuit pour démarrer — Aucune carte bancaire requise
          </p>
        </div>
      </section>

      {/* Social proof stats */}
      <section className="border-y border-white/[0.06] py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {HERO_STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                  {stat.value}
                </p>
                <p className="mt-2 text-sm text-white/40">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trusted by */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-white/30">
            Utilisé par des entreprises innovantes
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-6 opacity-40">
            {['ModaShop', 'TechStore', 'DataFlow', 'CloudFirst', 'NeoRetail'].map(
              (name) => (
                <span key={name} className="text-lg font-semibold tracking-wide text-white">
                  {name}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      {/* Detailed features */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
              Tout ce dont vous avez besoin
            </h2>
            <p className="mt-4 text-lg text-white/50">
              Une plateforme complète pour créer, déployer et optimiser
              vos agents IA conversationnels
            </p>
          </div>

          <div className="mt-20 space-y-24">
            {FEATURES_DETAILED.map((feature, index) => {
              const Icon = feature.icon;
              const isEven = index % 2 === 0;
              return (
                <div
                  key={feature.id}
                  className={`flex flex-col items-center gap-12 lg:flex-row ${
                    !isEven ? 'lg:flex-row-reverse' : ''
                  }`}
                >
                  {/* Content */}
                  <div className="flex-1 space-y-6">
                    <div
                      className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${feature.gradient} px-4 py-1.5 text-sm font-medium text-white`}
                    >
                      <Icon className="h-4 w-4" />
                      {feature.title}
                    </div>
                    <h3 className="text-2xl font-bold text-white sm:text-3xl">
                      {feature.subtitle}
                    </h3>
                    <p className="text-white/50 leading-relaxed">
                      {feature.description}
                    </p>
                    <ul className="space-y-3">
                      {feature.highlights.map((h) => (
                        <li key={h} className="flex items-start gap-3">
                          <div className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
                            <Check className="h-3 w-3 text-emerald-400" />
                          </div>
                          <span className="text-sm text-white/70">{h}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={feature.href}
                      className="inline-flex items-center gap-2 text-sm font-medium text-indigo-400 transition-colors hover:text-indigo-300"
                    >
                      En savoir plus <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>

                  {/* Visual placeholder */}
                  <div className="flex-1">
                    <div
                      className={`relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br ${feature.gradient} p-[1px]`}
                    >
                      <div className="flex h-full w-full flex-col items-center justify-center rounded-2xl bg-[#0a0a18]">
                        <Icon className="h-16 w-16 text-white/20" />
                        <p className="mt-4 text-sm font-medium text-white/30">
                          {feature.title}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-white/[0.06] py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Déployez votre agent en 3 étapes
            </h2>
            <p className="mt-4 text-lg text-white/50">
              De zéro à un agent opérationnel en moins de 5 minutes
            </p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            {[
              {
                step: '01',
                icon: Database,
                title: 'Importez vos données',
                desc: 'Uploadez vos documents, connectez votre site web ou votre centre d\'aide. L\'indexation est automatique.',
              },
              {
                step: '02',
                icon: BrainCircuit,
                title: 'Personnalisez votre agent',
                desc: 'Choisissez le modèle IA, définissez le ton et les instructions. Testez en direct dans la console.',
              },
              {
                step: '03',
                icon: Zap,
                title: 'Déployez en un clic',
                desc: 'Copiez le snippet, intégrez-le sur votre site. Votre agent est immédiatement opérationnel.',
              },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.step}
                  className="relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 text-center"
                >
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-600 to-cyan-600 px-4 py-1 text-sm font-bold">
                    {s.step}
                  </span>
                  <Icon className="mx-auto mt-4 h-10 w-10 text-indigo-400" />
                  <h3 className="mt-6 text-lg font-semibold text-white">
                    {s.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/50">
                    {s.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Ce que disent nos clients
            </h2>
            <p className="mt-4 text-lg text-white/50">
              Des résultats concrets mesurés par de vraies entreprises
            </p>
          </div>
          <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.author}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8"
              >
                <div className="mb-4 flex gap-1">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                <p className="text-white/70 leading-relaxed">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="mt-6 border-t border-white/[0.06] pt-4">
                  <p className="font-semibold text-white">{t.author}</p>
                  <p className="text-sm text-white/40">
                    {t.role}, {t.company}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="border-y border-white/[0.06] py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Luneo vs. Solutions traditionnelles
            </h2>
            <p className="mt-4 text-lg text-white/50">
              Pourquoi les entreprises passent à l&apos;IA conversationnelle
            </p>
          </div>
          <div className="mt-12 overflow-hidden rounded-2xl border border-white/[0.06]">
            <div className="grid grid-cols-3 bg-white/[0.04] px-6 py-4 text-sm font-semibold">
              <span className="text-white/60">Fonctionnalité</span>
              <span className="text-center text-indigo-400">Luneo</span>
              <span className="text-center text-white/40">Chatbots classiques</span>
            </div>
            {COMPARISON.map((row, i) => (
              <div
                key={row.feature}
                className={`grid grid-cols-3 px-6 py-3.5 text-sm ${
                  i % 2 === 0 ? '' : 'bg-white/[0.02]'
                }`}
              >
                <span className="text-white/70">{row.feature}</span>
                <div className="flex justify-center">
                  {row.luneo === true ? (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20">
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    </div>
                  ) : (
                    <span className="text-white/50">{String(row.luneo)}</span>
                  )}
                </div>
                <div className="flex justify-center">
                  {row.traditional === false ? (
                    <span className="text-white/30">—</span>
                  ) : row.traditional === true ? (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20">
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    </div>
                  ) : (
                    <span className="text-xs text-amber-400/70">
                      {row.traditional}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Questions fréquentes
            </h2>
            <p className="mt-4 text-lg text-white/50">
              Tout ce que vous devez savoir avant de commencer
            </p>
          </div>
          <div className="mt-12 space-y-3">
            {FAQ.map((faq, i) => (
              <div
                key={i}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02]"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between px-6 py-4 text-left"
                >
                  <span className="font-medium text-white">{faq.q}</span>
                  <ChevronDown
                    className={`h-5 w-5 flex-shrink-0 text-white/40 transition-transform ${
                      openFaq === i ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaq === i && (
                  <div className="border-t border-white/[0.06] px-6 py-4">
                    <p className="text-sm leading-relaxed text-white/60">
                      {faq.a}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <div className="rounded-3xl border border-white/[0.08] bg-gradient-to-b from-indigo-600/10 via-cyan-600/5 to-transparent p-12 sm:p-16">
            <Sparkles className="mx-auto h-12 w-12 text-indigo-400" />
            <h2 className="mt-6 text-3xl font-bold sm:text-4xl lg:text-5xl">
              Prêt à transformer votre
              <br />
              <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                relation client ?
              </span>
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg text-white/50">
              Rejoignez 500+ entreprises qui ont déjà automatisé leur support
              avec Luneo. Essai gratuit, déploiement en 5 minutes.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/register"
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40"
              >
                Commencer gratuitement
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-8 py-4 text-lg font-medium text-white/80 transition-all hover:bg-white/[0.08]"
              >
                Voir les tarifs
              </Link>
            </div>
            <p className="mt-4 text-sm text-white/40">
              Plan gratuit disponible — Aucune carte bancaire requise — Annulation à tout moment
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
