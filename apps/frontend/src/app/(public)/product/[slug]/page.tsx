import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import {
  MessageSquare,
  BookOpen,
  BarChart3,
  Plug,
  ArrowRight,
  Check,
  Brain,
  Zap,
  Shield,
  Globe,
  Database,
  LineChart,
  Layers,
  Clock,
  Users,
  Star,
  Bot,
  Sparkles,
} from 'lucide-react';

const PRODUCTS: Record<string, {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  stats: { value: string; label: string }[];
  features: { title: string; description: string; icon: React.ComponentType<{ className?: string }> }[];
  benefits: string[];
  useCases: { title: string; description: string }[];
  testimonial: { quote: string; author: string; role: string; company: string };
  cta: string;
}> = {
  agents: {
    title: 'Agents Conversationnels IA',
    subtitle: 'Déployez des agents intelligents entraînés sur vos données, opérationnels 24/7',
    description: 'Créez des agents conversationnels alimentés par GPT-4, Claude et Mistral. Ils comprennent votre métier, répondent avec la voix de votre marque et apprennent en continu grâce à vos feedbacks.',
    icon: Bot,
    gradient: 'from-blue-500 to-indigo-600',
    stats: [
      { value: '80%', label: 'des demandes automatisées' },
      { value: '<2s', label: 'temps de réponse moyen' },
      { value: '95%', label: 'de précision des réponses' },
      { value: '24/7', label: 'disponibilité garantie' },
    ],
    features: [
      { title: 'Multi-modèles IA de pointe', description: 'Choisissez GPT-4o, Claude 3.5 Sonnet, Mistral Large ou combinez-les. Basculez de modèle en un clic selon vos besoins de performance et de coût.', icon: Brain },
      { title: 'RAG avancé (Retrieval Augmented Generation)', description: 'Vos agents puisent dans vos données internes via une recherche sémantique vectorielle. Réponses précises, sourcées et toujours à jour.', icon: Database },
      { title: 'Personnalisation complète de la marque', description: 'Définissez la personnalité, le ton, le vocabulaire et les limites de chaque agent. Il parle comme votre équipe, avec votre expertise.', icon: Layers },
      { title: 'Déploiement multi-canal instantané', description: 'Widget web, email, Slack, WhatsApp, Telegram — un seul agent, tous vos canaux. Configuration en quelques clics.', icon: Globe },
      { title: 'Escalade intelligente vers un humain', description: 'Quand l\'agent détecte un cas complexe ou une émotion forte, il transfère le contexte complet à un agent humain en temps réel.', icon: Users },
      { title: 'Apprentissage continu', description: 'Vos feedbacks et corrections entraînent automatiquement l\'agent. Il s\'améliore chaque jour pour des réponses toujours plus pertinentes.', icon: Sparkles },
    ],
    benefits: [
      'Réduction de 80% du volume de tickets de support',
      'Temps de première réponse passé de 4h à 2 secondes',
      'Disponibilité 24/7 sans surcoût de personnel',
      'Réponses cohérentes basées sur vos données vérifiées',
      'Support multilingue automatique (50+ langues)',
      'Économie moyenne de 3 à 5 ETP par an',
    ],
    useCases: [
      { title: 'Support client e-commerce', description: 'Suivi de commandes, retours, FAQ produits — votre agent gère le flux quotidien.' },
      { title: 'Onboarding utilisateurs SaaS', description: 'Guidez vos nouveaux utilisateurs étape par étape avec un assistant contextualisé.' },
      { title: 'Support interne IT', description: 'Résolvez les problèmes techniques des employés sans mobiliser votre équipe IT.' },
      { title: 'Conseil avant-vente', description: 'Qualifiez les prospects, recommandez les produits adaptés et planifiez des démos.' },
    ],
    testimonial: {
      quote: 'Depuis Luneo, nos temps de réponse sont passés de 4 heures à 2 secondes. Nos agents humains se concentrent sur les cas complexes et la satisfaction client a bondi de 25%.',
      author: 'Marie Dupont',
      role: 'Directrice Service Client',
      company: 'ModaShop',
    },
    cta: 'Créer mon premier agent',
  },
  'knowledge-base': {
    title: 'Base de Connaissances Vectorielle',
    subtitle: 'Transformez vos documents en intelligence exploitable par vos agents IA',
    description: 'Importez n\'importe quel format — PDF, DOCX, HTML, CSV — et transformez-le en une base de connaissances vectorielle. Vos agents accèdent instantanément à l\'information la plus pertinente pour chaque question grâce au RAG.',
    icon: BookOpen,
    gradient: 'from-emerald-500 to-teal-600',
    stats: [
      { value: '10 min', label: 'pour indexer 500 pages' },
      { value: '96%', label: 'de précision sémantique' },
      { value: '15+', label: 'formats supportés' },
      { value: '∞', label: 'taille de la base' },
    ],
    features: [
      { title: 'Import drag & drop multi-format', description: 'PDF, DOCX, HTML, CSV, Markdown, JSON, TXT et plus. Glissez-déposez vos fichiers et l\'indexation démarre automatiquement.', icon: Database },
      { title: 'Crawling automatique de sites web', description: 'Entrez une URL et Luneo parcourt et indexe toutes les pages de votre site, centre d\'aide ou documentation en ligne.', icon: Globe },
      { title: 'Embeddings vectoriels de pointe', description: 'Technologie de représentation sémantique avancée pour une recherche qui comprend le sens, pas juste les mots-clés.', icon: Brain },
      { title: 'Synchronisation temps réel', description: 'Vos sources changent ? La base se met à jour automatiquement. Fini les réponses obsolètes.', icon: Zap },
      { title: 'Chunking intelligent & contextuel', description: 'Les documents sont découpés intelligemment pour préserver le contexte. Chaque chunk embarque ses métadonnées sources.', icon: Layers },
      { title: 'Permissions granulaires', description: 'Contrôlez qui accède à quoi. Bases privées par équipe, par agent ou par canal avec RBAC complet.', icon: Shield },
    ],
    benefits: [
      'Indexation de documents de toutes tailles en minutes',
      'Recherche sémantique 10x plus pertinente que le mot-clé',
      'Mise à jour automatique quand vos sources changent',
      'Versioning et historique de tous les documents',
      'Gestion fine des permissions par équipe',
      'Sources citées dans chaque réponse pour vérification',
    ],
    useCases: [
      { title: 'Centre d\'aide intelligent', description: 'Indexez votre FAQ et documentation pour des réponses instantanées et toujours à jour.' },
      { title: 'Base de connaissances interne', description: 'Centralisez les processus, guides et procédures de votre entreprise.' },
      { title: 'Catalogue produit enrichi', description: 'Importez vos fiches produit pour que l\'agent conseille avec expertise.' },
      { title: 'Documentation technique', description: 'Indexez votre doc API, guides dev et runbooks pour un support technique IA.' },
    ],
    testimonial: {
      quote: 'On a importé 500 pages de documentation en 10 minutes. L\'agent cite ses sources et la précision est de 96%. C\'est comme avoir un expert disponible 24/7.',
      author: 'Sophie Bernard',
      role: 'VP Engineering',
      company: 'DataFlow',
    },
    cta: 'Importer mes données',
  },
  analytics: {
    title: 'Analytics & Insights',
    subtitle: 'Mesurez, analysez et optimisez la performance de chaque agent en temps réel',
    description: 'Un tableau de bord complet pour suivre vos KPIs en temps réel. Scoring de satisfaction automatique, analyse des sujets tendance, détection des questions sans réponse et rapports programmables.',
    icon: BarChart3,
    gradient: 'from-violet-500 to-purple-600',
    stats: [
      { value: '100%', label: 'de conversations analysées' },
      { value: 'Temps réel', label: 'rafraîchissement des données' },
      { value: '25+', label: 'KPIs suivis' },
      { value: 'PDF/CSV', label: 'export automatique' },
    ],
    features: [
      { title: 'Dashboard temps réel', description: 'Conversations actives, temps de réponse, taux de résolution, volume horaire — toutes vos métriques en un coup d\'œil sur un dashboard interactif.', icon: LineChart },
      { title: 'Score de satisfaction automatique (CSAT)', description: 'Mesurez la satisfaction de chaque conversation grâce à l\'analyse de sentiment IA. Pas besoin de sondage post-chat.', icon: Star },
      { title: 'Analyse des sujets et tendances', description: 'Identifiez les questions les plus fréquentes, les sujets émergents et les problèmes récurrents pour prioriser vos actions.', icon: Brain },
      { title: 'Détection des questions sans réponse', description: 'Repérez automatiquement les cas où votre agent n\'a pas pu répondre et enrichissez votre base de connaissances.', icon: Zap },
      { title: 'Rapports automatisés', description: 'Programmez des rapports quotidiens, hebdomadaires ou mensuels envoyés par email à votre équipe.', icon: Clock },
      { title: 'Benchmarking multi-agent', description: 'Comparez la performance de vos agents par canal, par période et par type de demande.', icon: BarChart3 },
    ],
    benefits: [
      'Vue d\'ensemble complète en temps réel',
      'Satisfaction client mesurée sans sondage intrusif',
      'Identification proactive des améliorations nécessaires',
      'Détection automatique des lacunes de la base de connaissances',
      'Rapports automatisés pour votre direction',
      'ROI mesurable et démontrable',
    ],
    useCases: [
      { title: 'Reporting direction', description: 'Générez des rapports automatiques sur la performance support pour votre CODIR.' },
      { title: 'Optimisation continue', description: 'Identifiez les points faibles de vos agents et améliorez-les chaque semaine.' },
      { title: 'Prévisions de charge', description: 'Anticipez les pics de volume grâce à l\'analyse des tendances saisonnières.' },
      { title: 'Mesure du ROI', description: 'Quantifiez précisément l\'impact de l\'automatisation sur vos coûts et votre satisfaction client.' },
    ],
    testimonial: {
      quote: 'Les analytics Luneo nous ont permis de découvrir que 40% de nos tickets concernaient la même question. En enrichissant la base, on a éliminé ce volume du jour au lendemain.',
      author: 'Thomas Martin',
      role: 'CEO',
      company: 'TechStore',
    },
    cta: 'Voir le tableau de bord',
  },
  integrations: {
    title: 'Intégrations',
    subtitle: 'Connectez vos outils existants en quelques clics — plus de 30 intégrations natives',
    description: 'Luneo s\'intègre nativement avec vos outils préférés. E-commerce, CRM, communication, paiement, automatisation — déployez vos agents là où vos clients et vos données se trouvent.',
    icon: Plug,
    gradient: 'from-pink-500 to-rose-600',
    stats: [
      { value: '30+', label: 'intégrations natives' },
      { value: '5 000+', label: 'via Zapier & Make' },
      { value: '< 5 min', label: 'pour se connecter' },
      { value: '2-way', label: 'synchronisation' },
    ],
    features: [
      { title: 'E-commerce natif', description: 'Shopify, WooCommerce, Magento — accès temps réel au catalogue, commandes, clients et inventaire pour un support ultra-contextualisé.', icon: Globe },
      { title: 'CRM et ventes', description: 'HubSpot, Salesforce, Pipedrive — synchronisez les données client, enrichissez les fiches et qualifiez les leads automatiquement.', icon: Users },
      { title: 'Communication unifiée', description: 'Slack, Microsoft Teams, Discord, WhatsApp, Telegram — vos agents disponibles sur tous vos canaux internes et externes.', icon: MessageSquare },
      { title: 'Paiement et facturation', description: 'Stripe intégré nativement pour gérer abonnements, factures et paiements directement depuis vos agents.', icon: Shield },
      { title: 'Automatisation (Zapier & Make)', description: 'Connectez Luneo à 5 000+ applications grâce aux automatisations no-code. Déclenchez des workflows sur chaque événement.', icon: Zap },
      { title: 'API REST & Webhooks', description: 'Documentation OpenAPI complète, SDKs TypeScript et Python, webhooks temps réel pour créer vos propres intégrations sur-mesure.', icon: Layers },
    ],
    benefits: [
      'Plus de 30 intégrations natives prêtes à l\'emploi',
      'Configuration en quelques clics, sans code',
      'Synchronisation bidirectionnelle en temps réel',
      '5 000+ automatisations via Zapier et Make',
      'API REST complète avec documentation OpenAPI',
      'SDKs officiels TypeScript et Python',
    ],
    useCases: [
      { title: 'Support e-commerce automatisé', description: 'Connectez Shopify et votre agent répond sur les commandes, retours et produits en temps réel.' },
      { title: 'Lead enrichment CRM', description: 'Chaque conversation qualifiée enrichit automatiquement la fiche contact dans votre CRM.' },
      { title: 'Workflows automatisés', description: 'Déclenchez des actions dans vos outils quand certains événements se produisent dans Luneo.' },
      { title: 'Support interne Slack/Teams', description: 'Vos employés posent leurs questions dans Slack et l\'agent répond instantanément.' },
    ],
    testimonial: {
      quote: 'L\'intégration Shopify s\'est faite en 3 minutes. Maintenant notre agent accède aux commandes en temps réel et nos clients obtiennent leur statut de livraison instantanément.',
      author: 'Julie Leclerc',
      role: 'COO',
      company: 'NeoRetail',
    },
    cta: 'Explorer les intégrations',
  },
};

const VALID_SLUGS = Object.keys(PRODUCTS);

export async function generateStaticParams() {
  return VALID_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = PRODUCTS[slug];
  if (!product) return {};
  return {
    title: `${product.title} | Luneo — Plateforme d'Agents IA`,
    description: product.description,
    openGraph: {
      title: `${product.title} | Luneo`,
      description: product.subtitle,
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = PRODUCTS[slug];
  if (!product) notFound();

  const Icon = product.icon;

  return (
    <div className="min-h-screen bg-[#050510]">
      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-20">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 via-transparent to-transparent" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${product.gradient} bg-opacity-20 border border-indigo-500/20 mb-8`}>
            <Icon className="w-5 h-5 text-white" />
            <span className="text-sm text-white font-medium">Produit</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            {product.title}
          </h1>
          <p className="text-xl text-white/60 max-w-3xl mx-auto mb-10 leading-relaxed">
            {product.description}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="group px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-semibold hover:from-indigo-500 hover:to-cyan-500 transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/25"
            >
              {product.cta} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/pricing"
              className="px-8 py-4 rounded-xl border border-white/10 text-white/80 hover:bg-white/5 transition-all font-medium"
            >
              Voir les tarifs
            </Link>
          </div>
          <p className="mt-4 text-sm text-white/40">Essai gratuit — Aucune carte bancaire requise</p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-y border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {product.stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                  {stat.value}
                </p>
                <p className="text-sm text-white/40 mt-2">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Fonctionnalités clés
            </h2>
            <p className="mt-4 text-lg text-white/50">
              Chaque détail pensé pour maximiser l&apos;impact de vos agents IA
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {product.features.map((feature, i) => {
              const FeatureIcon = feature.icon;
              return (
                <div
                  key={i}
                  className="group p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-indigo-500/20 transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 flex items-center justify-center mb-4 ring-1 ring-white/10">
                    <FeatureIcon className="w-6 h-6 text-indigo-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="py-24 border-y border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Cas d&apos;usage concrets
            </h2>
            <p className="mt-4 text-lg text-white/50">
              Comment nos clients utilisent {product.title.toLowerCase()} au quotidien
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {product.useCases.map((uc, i) => (
              <div key={i} className="flex gap-4 p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 flex items-center justify-center">
                  <span className="text-sm font-bold text-indigo-400">{String(i + 1).padStart(2, '0')}</span>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">{uc.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{uc.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-indigo-500/5 to-cyan-500/5 p-10 sm:p-14 text-center">
            <div className="flex justify-center gap-1 mb-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <blockquote className="text-xl sm:text-2xl font-medium text-white/80 leading-relaxed">
              &ldquo;{product.testimonial.quote}&rdquo;
            </blockquote>
            <div className="mt-8">
              <p className="font-semibold text-white">{product.testimonial.author}</p>
              <p className="text-sm text-white/40">{product.testimonial.role}, {product.testimonial.company}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24 border-t border-white/[0.06]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Résultats concrets
            </h2>
            <p className="mt-4 text-lg text-white/50">
              Ce que nos clients mesurent après 30 jours d&apos;utilisation
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {product.benefits.map((benefit, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center mt-0.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <span className="text-white/70">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="p-10 sm:p-14 rounded-2xl border border-white/[0.08] bg-gradient-to-b from-indigo-500/5 to-transparent">
            <Sparkles className="w-12 h-12 text-indigo-400 mx-auto mb-6" />
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Prêt à déployer {product.title.toLowerCase()} ?
            </h2>
            <p className="text-white/50 mb-8 max-w-lg mx-auto">
              Rejoignez 500+ entreprises qui utilisent Luneo.
              Essai gratuit, déploiement en 5 minutes, aucune carte bancaire.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-semibold hover:from-indigo-500 hover:to-cyan-500 transition-all shadow-lg shadow-indigo-500/25"
              >
                {product.cta} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/features"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-white/10 text-white/80 hover:bg-white/5 transition-all font-medium"
              >
                Toutes les fonctionnalités
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
