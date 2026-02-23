import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import {
  Headphones,
  ShoppingCart,
  TrendingUp,
  Wrench,
  Megaphone,
  ArrowRight,
  Check,
  MessageSquare,
  Zap,
  Clock,
  Users,
  BarChart3,
  Shield,
  Globe,
  Brain,
} from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'agent';
  text: string;
}

const SOLUTIONS: Record<string, {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  stats: { value: string; label: string }[];
  useCases: { title: string; description: string; icon: React.ComponentType<{ className?: string }> }[];
  chatDemo: ChatMessage[];
  benefits: string[];
}> = {
  'customer-service': {
    title: 'Service Client',
    subtitle: 'Automatisez 80% de vos demandes clients',
    description: 'Déployez un agent IA qui répond instantanément aux questions de vos clients, 24h/24, 7j/7. Réduisez vos temps de réponse et augmentez la satisfaction.',
    icon: Headphones,
    stats: [
      { value: '80%', label: 'de demandes automatisées' },
      { value: '< 2s', label: 'temps de réponse moyen' },
      { value: '95%', label: 'satisfaction client' },
      { value: '24/7', label: 'disponibilité' },
    ],
    useCases: [
      { title: 'FAQ intelligente', description: 'Répondez automatiquement aux questions récurrentes grâce à votre base de connaissances.', icon: MessageSquare },
      { title: 'Suivi de commandes', description: 'Fournissez le statut des commandes en temps réel via vos intégrations e-commerce.', icon: Clock },
      { title: 'Escalade intelligente', description: 'Transférez automatiquement les demandes complexes à un agent humain.', icon: Users },
      { title: 'Support multilingue', description: 'Répondez à vos clients dans leur langue grâce au support multi-langues natif.', icon: Globe },
    ],
    chatDemo: [
      { role: 'user', text: 'Bonjour, quel est le statut de ma commande #12847 ?' },
      { role: 'agent', text: 'Bonjour ! Votre commande #12847 est en cours de livraison. Elle arrivera demain avant 18h. Souhaitez-vous le lien de suivi ?' },
    ],
    benefits: [
      'Réduction de 60% des tickets de support',
      'Temps de première réponse < 2 secondes',
      'Résolution automatique de 80% des demandes',
      'Satisfaction client en hausse de 25%',
      'Économie de 3 à 5 ETP par an',
    ],
  },
  ecommerce: {
    title: 'E-commerce',
    subtitle: 'Boostez vos ventes avec un assistant IA',
    description: 'Offrez une expérience d\'achat personnalisée à chaque visiteur. Votre agent IA recommande des produits, répond aux questions et accompagne vos clients jusqu\'à la conversion.',
    icon: ShoppingCart,
    stats: [
      { value: '+35%', label: 'de taux de conversion' },
      { value: '+28%', label: 'de panier moyen' },
      { value: '-40%', label: 'd\'abandon de panier' },
      { value: '24/7', label: 'disponibilité' },
    ],
    useCases: [
      { title: 'Recommandations produits', description: 'Suggérez des produits pertinents en fonction du comportement et des préférences du client.', icon: TrendingUp },
      { title: 'Guide d\'achat', description: 'Aidez vos clients à trouver le produit idéal grâce à un assistant de conseil personnalisé.', icon: MessageSquare },
      { title: 'Suivi post-achat', description: 'Gérez automatiquement les retours, échanges et questions après-vente.', icon: Clock },
      { title: 'Intégration Shopify', description: 'Connectez votre boutique Shopify en un clic pour un accès temps réel à votre catalogue.', icon: Globe },
    ],
    chatDemo: [
      { role: 'user', text: 'Je cherche un cadeau pour ma femme, budget 100€' },
      { role: 'agent', text: 'Avec plaisir ! Voici 3 suggestions populaires dans votre budget : le coffret bien-être (89€), le sac en cuir Élégance (95€), ou le bijou personnalisé (79€). Souhaitez-vous en savoir plus sur l\'un d\'entre eux ?' },
    ],
    benefits: [
      'Augmentation du taux de conversion de 35%',
      'Réduction des abandons de panier de 40%',
      'Panier moyen en hausse de 28%',
      'Automatisation du SAV post-achat',
      'Intégrations natives Shopify, WooCommerce',
    ],
  },
  sales: {
    title: 'Ventes',
    subtitle: 'Qualifiez vos leads automatiquement',
    description: 'Votre agent IA engage les visiteurs, qualifie les prospects et planifie des rendez-vous avec votre équipe commerciale. Ne perdez plus jamais un lead.',
    icon: TrendingUp,
    stats: [
      { value: '+45%', label: 'de leads qualifiés' },
      { value: '3x', label: 'plus de rendez-vous' },
      { value: '< 30s', label: 'd\'engagement' },
      { value: '+20%', label: 'de taux de closing' },
    ],
    useCases: [
      { title: 'Qualification automatique', description: 'Identifiez les prospects à fort potentiel grâce à un scoring IA en temps réel.', icon: BarChart3 },
      { title: 'Prise de rendez-vous', description: 'Planifiez automatiquement des démos et rendez-vous dans le calendrier de votre équipe.', icon: Clock },
      { title: 'Nurturing intelligent', description: 'Relancez les prospects au bon moment avec le bon message, automatiquement.', icon: Brain },
      { title: 'Intégration CRM', description: 'Synchronisez les leads qualifiés directement dans HubSpot, Salesforce ou Pipedrive.', icon: Users },
    ],
    chatDemo: [
      { role: 'user', text: 'Je recherche une solution pour automatiser notre support client' },
      { role: 'agent', text: 'Excellente démarche ! Pour mieux vous orienter, combien de demandes clients traitez-vous par mois ? Et quels canaux utilisez-vous actuellement (email, chat, téléphone) ?' },
    ],
    benefits: [
      '45% de leads qualifiés en plus',
      'Triplement des rendez-vous commerciaux',
      'Engagement visiteur en moins de 30 secondes',
      'Score de qualification IA automatique',
      'Synchronisation CRM en temps réel',
    ],
  },
  'technical-support': {
    title: 'Support Technique',
    subtitle: 'Résolvez les problèmes techniques instantanément',
    description: 'Votre agent IA guide les utilisateurs dans la résolution de problèmes techniques étape par étape. Base de connaissances technique, diagnostic automatisé et escalade vers les experts.',
    icon: Wrench,
    stats: [
      { value: '70%', label: 'de résolution automatique' },
      { value: '-50%', label: 'de temps de résolution' },
      { value: '96%', label: 'de précision technique' },
      { value: '0', label: 'temps d\'attente' },
    ],
    useCases: [
      { title: 'Diagnostic automatisé', description: 'Identifiez la cause du problème grâce à un arbre de décision IA intelligent.', icon: Brain },
      { title: 'Guide pas-à-pas', description: 'Accompagnez les utilisateurs avec des instructions claires et personnalisées.', icon: MessageSquare },
      { title: 'Documentation technique', description: 'Accédez instantanément à la documentation pertinente pour chaque problème.', icon: Zap },
      { title: 'Escalade contextuelle', description: 'Transmettez le contexte complet du problème à un expert en cas d\'escalade.', icon: Users },
    ],
    chatDemo: [
      { role: 'user', text: 'Mon application affiche une erreur 502 depuis ce matin' },
      { role: 'agent', text: 'Je comprends que c\'est bloquant. L\'erreur 502 indique un problème de gateway. Vérifions ensemble : votre service backend est-il démarré ? Pouvez-vous exécuter `docker ps` et me partager le résultat ?' },
    ],
    benefits: [
      'Résolution automatique de 70% des tickets',
      'Temps de résolution divisé par 2',
      'Documentation toujours à jour',
      'Escalade contextuelle vers les experts',
      'Base de connaissances auto-enrichie',
    ],
  },
  marketing: {
    title: 'Marketing',
    subtitle: 'Engagez vos visiteurs et collectez des insights',
    description: 'Votre agent IA engage proactivement les visiteurs de votre site, collecte des données précieuses et personnalise les interactions en fonction du comportement de chaque utilisateur.',
    icon: Megaphone,
    stats: [
      { value: '+60%', label: 'd\'engagement' },
      { value: '2x', label: 'plus de conversions' },
      { value: '+40%', label: 'de collecte de leads' },
      { value: '100%', label: 'personnalisé' },
    ],
    useCases: [
      { title: 'Engagement proactif', description: 'Initiez des conversations contextuelles en fonction du comportement de navigation du visiteur.', icon: MessageSquare },
      { title: 'Collecte d\'insights', description: 'Recueillez automatiquement les préférences, besoins et feedback de vos visiteurs.', icon: BarChart3 },
      { title: 'Personnalisation', description: 'Adaptez les messages et recommandations en temps réel selon le profil du visiteur.', icon: Brain },
      { title: 'Campagnes ciblées', description: 'Segmentez et ciblez vos audiences avec des messages IA ultra-pertinents.', icon: Zap },
    ],
    chatDemo: [
      { role: 'user', text: 'Quelles sont vos offres pour les entreprises ?' },
      { role: 'agent', text: 'Nous proposons des plans adaptés à chaque taille d\'entreprise ! Pour les PME, notre plan Pro à 49€/mois inclut 5 agents IA et 2 000 conversations. Souhaitez-vous voir une démo personnalisée pour votre secteur ?' },
    ],
    benefits: [
      'Engagement visiteur multiplié par 2',
      'Collecte de leads automatisée',
      'Messages personnalisés en temps réel',
      'Analyse des comportements visiteurs',
      'ROI marketing mesurable',
    ],
  },
};

const VALID_SLUGS = Object.keys(SOLUTIONS);

export async function generateStaticParams() {
  return VALID_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const solution = SOLUTIONS[slug];
  if (!solution) return {};
  return {
    title: `${solution.title} — Solutions Luneo`,
    description: solution.description,
  };
}

export default async function SolutionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const solution = SOLUTIONS[slug];
  if (!solution) notFound();

  const Icon = solution.icon;

  return (
    <div className="min-h-screen bg-[#050510]">
      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-transparent" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-8">
            <Icon className="w-5 h-5 text-cyan-400" />
            <span className="text-sm text-cyan-300 font-medium">Solution</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            {solution.title}
          </h1>
          <p className="text-xl text-white/60 max-w-3xl mx-auto mb-10">
            {solution.description}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 text-white font-semibold hover:from-cyan-500 hover:to-indigo-500 transition-all flex items-center gap-2"
            >
              Essayer gratuitement <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="px-8 py-3.5 rounded-xl border border-white/10 text-white/80 hover:bg-white/5 transition-all font-medium"
            >
              Demander une démo
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-y border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {solution.stats.map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                  {stat.value}
                </p>
                <p className="text-sm text-white/40 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Chat demo */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            Voyez votre agent en action
          </h2>
          <p className="text-white/50 text-center mb-12">
            Exemple de conversation pour le secteur {solution.title.toLowerCase()}
          </p>
          <div className="max-w-lg mx-auto rounded-2xl border border-white/[0.08] bg-[#0a0a18]/90 p-6 space-y-4">
            {solution.chatDemo.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'items-start gap-2'}`}>
                {msg.role === 'agent' && (
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 flex items-center justify-center mt-0.5">
                    <Brain className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-indigo-500/80 to-cyan-500/80 text-white rounded-2xl rounded-tr-sm'
                      : 'bg-white/[0.05] border border-white/[0.08] text-white/80 rounded-2xl rounded-tl-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="py-24 bg-white/[0.01]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white text-center mb-16">
            Cas d&apos;usage
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {solution.useCases.map((uc, i) => {
              const UCIcon = uc.icon;
              return (
                <div
                  key={i}
                  className="group p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-cyan-500/20 transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 flex items-center justify-center mb-4">
                    <UCIcon className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{uc.title}</h3>
                  <p className="text-white/50 leading-relaxed">{uc.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Résultats concrets
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {solution.benefits.map((benefit, i) => (
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
          <div className="p-8 rounded-2xl border border-white/[0.08] bg-gradient-to-b from-cyan-500/5 to-transparent">
            <Shield className="w-10 h-10 text-cyan-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-3">
              Prêt à automatiser votre {solution.title.toLowerCase()} ?
            </h2>
            <p className="text-white/50 mb-8">
              Essai gratuit, sans carte bancaire. Déployez votre premier agent en 15 minutes.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 text-white font-semibold hover:from-cyan-500 hover:to-indigo-500 transition-all"
            >
              Commencer gratuitement <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
