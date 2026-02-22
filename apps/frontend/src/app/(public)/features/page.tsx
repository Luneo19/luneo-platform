import {
  MessageSquareBot,
  BookOpen,
  BarChart3,
  Globe,
  BrainCircuit,
  ShieldCheck,
} from 'lucide-react';

const features = [
  {
    icon: MessageSquareBot,
    title: 'Agents Conversationnels',
    description:
      'Déployez des agents IA entraînés sur vos données pour répondre automatiquement à vos clients, 24h/24 et 7j/7.',
  },
  {
    icon: BookOpen,
    title: 'Base de Connaissances',
    description:
      'Importez et indexez automatiquement vos documents, FAQ et sites web pour alimenter vos agents en quelques clics.',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Insights',
    description:
      'Mesurez la performance de vos agents avec des tableaux de bord en temps réel : résolution, satisfaction, volumes.',
  },
  {
    icon: Globe,
    title: 'Multi-canal',
    description:
      'Widget web, email, Slack, WhatsApp, Telegram — déployez un agent partout où vos clients vous contactent.',
  },
  {
    icon: BrainCircuit,
    title: 'Multi-modèles IA',
    description:
      'GPT-4, Claude, Mistral — choisissez le modèle adapté à vos besoins et basculez en un clic.',
  },
  {
    icon: ShieldCheck,
    title: 'Sécurité & Conformité',
    description:
      'RGPD, chiffrement AES-256, hébergement européen. Vos données restent protégées et souveraines.',
  },
];

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Hero */}
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 blur-3xl" />
        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <span className="mb-4 inline-block rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-sm font-medium text-white/70">
            Fonctionnalités
          </span>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Tout ce qu&apos;il faut pour{' '}
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              automatiser votre support
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/60">
            Une plateforme complète d&apos;agents IA pour transformer votre
            relation client. Déploiement rapide, résultats immédiats.
          </p>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="relative pb-24 sm:pb-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.03] p-8 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.12] hover:bg-white/[0.05]"
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 ring-1 ring-white/10">
                    <Icon className="h-6 w-6 text-blue-400" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-white">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-white/60">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative border-t border-white/[0.06] py-24">
        <div className="absolute inset-0 bg-gradient-to-t from-purple-600/5 to-transparent" />
        <div className="relative z-10 mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Prêt à déployer votre premier agent ?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/60">
            Créez un compte gratuit et lancez votre agent IA en moins de 5
            minutes. Aucune carte bancaire requise.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="/register"
              className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-3 font-medium text-white shadow-lg shadow-purple-500/25 transition-all hover:shadow-purple-500/40"
            >
              Commencer gratuitement
            </a>
            <a
              href="/contact"
              className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-8 py-3 font-medium text-white/80 transition-all hover:bg-white/[0.08]"
            >
              Contacter l&apos;équipe
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
