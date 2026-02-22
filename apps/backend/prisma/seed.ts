import { PrismaClient } from '@prisma/client';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Luneo V2 database...');

  // 1. Super admin
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@luneo.app' },
    update: {},
    create: {
      email: 'admin@luneo.app',
      passwordHash: adminPassword,
      firstName: 'Super',
      lastName: 'Admin',
      emailVerified: true,
      role: 'ADMIN',
    },
  });
  console.log(`✅ Super admin created: ${admin.email}`);

  // 2. Agent Templates
  const templates = [
    {
      name: 'Agent Support Client',
      slug: 'support-agent',
      description: 'Repond aux questions clients 24/7 avec precision et empathie. Ideal pour le service client.',
      category: 'SUPPORT' as const,
      icon: '🎧',
      color: '#6366F1',
      systemPrompt: `Tu es un assistant support client expert et empathique. Tu aides les clients a resoudre leurs problemes rapidement et efficacement. Tu es toujours poli, patient et professionnel. Si tu ne connais pas la reponse, tu l'admets honnetement et proposes d'escalader vers un humain.`,
      defaultModules: JSON.stringify([
        { type: 'rag', enabled: true },
        { type: 'escalation', enabled: true },
        { type: 'sentiment', enabled: true },
      ]),
      capabilities: ['FAQ', 'Troubleshooting', 'Order tracking', 'Returns', 'Escalation'],
      tools: ['knowledge_search', 'escalate_to_human', 'create_ticket'],
      requiredSources: ['faq', 'documentation'],
      suggestedQuestions: [
        'Quel est le delai de livraison ?',
        'Comment retourner un article ?',
        'Je n\'ai pas recu ma commande',
      ],
      setupSteps: JSON.stringify([
        { step: 1, title: 'Importer votre FAQ', description: 'Uploadez vos documents FAQ ou connectez votre base de connaissances' },
        { step: 2, title: 'Configurer l\'escalation', description: 'Definissez quand l\'agent doit passer la main a un humain' },
        { step: 3, title: 'Personnaliser le ton', description: 'Ajustez le ton et le style de reponse' },
        { step: 4, title: 'Tester et deployer', description: 'Testez votre agent et deployez-le sur vos canaux' },
      ]),
      estimatedSetupTime: 15,
      targetUseCases: ['customer-support', 'helpdesk', 'faq-automation'],
    },
    {
      name: 'Agent Sales SDR',
      slug: 'sales-sdr-agent',
      description: 'Qualifie les leads, repond aux questions produit et book des demos automatiquement.',
      category: 'SALES' as const,
      icon: '📈',
      color: '#10B981',
      systemPrompt: `Tu es un SDR (Sales Development Representative) expert. Tu qualifies les leads en posant les bonnes questions, tu reponds aux questions sur le produit/service, et tu proposes de booker une demo quand le lead est qualifie. Tu es enthousiaste mais pas agressif.`,
      defaultModules: JSON.stringify([
        { type: 'rag', enabled: true },
        { type: 'lead_qualification', enabled: true },
        { type: 'calendar_booking', enabled: false },
      ]),
      capabilities: ['Lead qualification', 'Product info', 'Demo booking', 'Pricing questions'],
      tools: ['knowledge_search', 'qualify_lead', 'book_demo', 'send_email'],
      requiredSources: ['product-catalog', 'pricing'],
      suggestedQuestions: [
        'Quels sont vos tarifs ?',
        'Pouvez-vous me faire une demo ?',
        'Quelle est la difference entre vos plans ?',
      ],
      setupSteps: JSON.stringify([
        { step: 1, title: 'Importer catalogue produit', description: 'Connectez vos fiches produits et tarifs' },
        { step: 2, title: 'Definir criteres de qualification', description: 'Configurez votre scoring de leads' },
        { step: 3, title: 'Connecter calendrier', description: 'Liez Calendly ou Google Calendar pour les demos' },
        { step: 4, title: 'Tester et deployer', description: 'Testez votre SDR virtuel' },
      ]),
      estimatedSetupTime: 20,
      targetUseCases: ['lead-generation', 'sales-qualification', 'demo-booking'],
    },
    {
      name: 'Agent Onboarding',
      slug: 'onboarding-agent',
      description: 'Guide les nouveaux utilisateurs etape par etape a travers votre produit.',
      category: 'ONBOARDING' as const,
      icon: '🚀',
      color: '#F59E0B',
      systemPrompt: `Tu es un guide d'onboarding patient et pedagogique. Tu accompagnes les nouveaux utilisateurs dans la decouverte du produit, etape par etape. Tu t'adaptes au niveau de l'utilisateur et tu utilises des exemples concrets.`,
      defaultModules: JSON.stringify([
        { type: 'rag', enabled: true },
        { type: 'progress_tracking', enabled: true },
      ]),
      capabilities: ['Step-by-step guidance', 'Feature discovery', 'Tutorial', 'Best practices'],
      tools: ['knowledge_search', 'track_progress', 'suggest_next_step'],
      requiredSources: ['documentation', 'tutorials'],
      suggestedQuestions: [
        'Comment commencer ?',
        'Quelle est la prochaine etape ?',
        'Montrez-moi comment faire',
      ],
      setupSteps: JSON.stringify([
        { step: 1, title: 'Importer documentation', description: 'Uploadez vos guides et tutoriels' },
        { step: 2, title: 'Definir le parcours', description: 'Creez les etapes d\'onboarding' },
        { step: 3, title: 'Tester et deployer', description: 'Testez le parcours complet' },
      ]),
      estimatedSetupTime: 15,
      targetUseCases: ['user-onboarding', 'product-tour', 'feature-adoption'],
    },
    {
      name: 'Agent FAQ Intelligent',
      slug: 'faq-agent',
      description: 'Repond instantanement aux questions frequentes a partir de votre base de connaissances.',
      category: 'SUPPORT' as const,
      icon: '❓',
      color: '#3B82F6',
      systemPrompt: `Tu es un assistant FAQ specialise. Tu reponds aux questions frequentes de maniere precise et concise en te basant uniquement sur la base de connaissances fournie. Si une question sort de ton domaine, tu le dis clairement.`,
      defaultModules: JSON.stringify([
        { type: 'rag', enabled: true },
      ]),
      capabilities: ['FAQ search', 'Quick answers', 'Source citation'],
      tools: ['knowledge_search'],
      requiredSources: ['faq'],
      suggestedQuestions: [
        'Comment ca marche ?',
        'Quels sont les horaires ?',
        'Comment vous contacter ?',
      ],
      setupSteps: JSON.stringify([
        { step: 1, title: 'Importer votre FAQ', description: 'Uploadez vos FAQ existantes' },
        { step: 2, title: 'Tester et deployer', description: 'Verifiez les reponses et deployez' },
      ]),
      estimatedSetupTime: 10,
      targetUseCases: ['faq-automation', 'self-service'],
    },
    {
      name: 'Agent Avis & Reviews',
      slug: 'reviews-agent',
      description: 'Collecte et repond aux avis clients automatiquement.',
      category: 'REVIEWS' as const,
      icon: '⭐',
      color: '#EF4444',
      systemPrompt: `Tu es un specialiste de la gestion des avis clients. Tu reponds aux avis positifs avec gratitude et aux avis negatifs avec empathie et solutions concretes. Tu cherches toujours a transformer une experience negative en positive.`,
      defaultModules: JSON.stringify([
        { type: 'sentiment', enabled: true },
        { type: 'escalation', enabled: true },
      ]),
      capabilities: ['Review response', 'Sentiment analysis', 'Feedback collection', 'Escalation'],
      tools: ['knowledge_search', 'analyze_sentiment', 'escalate_to_human'],
      requiredSources: ['product-catalog', 'policies'],
      suggestedQuestions: [
        'J\'ai un probleme avec mon achat',
        'Je suis tres satisfait !',
        'Comment laisser un avis ?',
      ],
      setupSteps: JSON.stringify([
        { step: 1, title: 'Definir les politiques', description: 'Importez vos politiques de retour et garantie' },
        { step: 2, title: 'Configurer les reponses', description: 'Personnalisez les templates de reponses' },
        { step: 3, title: 'Tester et deployer', description: 'Testez avec des exemples d\'avis' },
      ]),
      estimatedSetupTime: 15,
      targetUseCases: ['review-management', 'customer-feedback', 'reputation-management'],
    },
    {
      name: 'Agent Email Triage',
      slug: 'email-triage-agent',
      description: 'Trie, categorise et repond automatiquement aux emails entrants.',
      category: 'EMAIL' as const,
      icon: '📧',
      color: '#8B5CF6',
      systemPrompt: `Tu es un assistant de triage email. Tu analyses chaque email entrant, tu le categorises (support, vente, spam, urgent), tu rediges une reponse appropriee et tu escalades si necessaire. Tu es precis et rapide.`,
      defaultModules: JSON.stringify([
        { type: 'rag', enabled: true },
        { type: 'classification', enabled: true },
        { type: 'escalation', enabled: true },
      ]),
      capabilities: ['Email classification', 'Auto-response', 'Priority detection', 'Routing'],
      tools: ['knowledge_search', 'classify_email', 'send_reply', 'escalate_to_human'],
      requiredSources: ['faq', 'email-templates'],
      suggestedQuestions: [],
      setupSteps: JSON.stringify([
        { step: 1, title: 'Connecter email', description: 'Connectez votre boite email (Gmail, Outlook)' },
        { step: 2, title: 'Definir les categories', description: 'Configurez les categories de triage' },
        { step: 3, title: 'Importer templates', description: 'Importez vos templates de reponses email' },
        { step: 4, title: 'Tester et deployer', description: 'Testez avec des emails exemples' },
      ]),
      estimatedSetupTime: 20,
      targetUseCases: ['email-automation', 'inbox-management', 'email-routing'],
    },
    {
      name: 'Agent Custom',
      slug: 'custom-agent',
      description: 'Agent entierement personnalisable. Configurez chaque aspect selon vos besoins.',
      category: 'CUSTOM' as const,
      icon: '⚙️',
      color: '#6B7280',
      systemPrompt: `Tu es un assistant IA personnalise. Suis les instructions specifiques fournies par l'utilisateur.`,
      defaultModules: JSON.stringify([
        { type: 'rag', enabled: true },
      ]),
      capabilities: ['Customizable'],
      tools: ['knowledge_search'],
      requiredSources: [],
      suggestedQuestions: [],
      setupSteps: JSON.stringify([
        { step: 1, title: 'Definir le role', description: 'Ecrivez le prompt systeme et definissez le role de votre agent' },
        { step: 2, title: 'Ajouter des connaissances', description: 'Importez vos documents et donnees' },
        { step: 3, title: 'Configurer les modules', description: 'Activez les modules dont vous avez besoin' },
        { step: 4, title: 'Tester et deployer', description: 'Testez et lancez votre agent' },
      ]),
      estimatedSetupTime: 30,
      targetUseCases: ['custom'],
    },
    {
      name: 'Agent RH & Recrutement',
      slug: 'hr-recruitment-agent',
      description: 'Repond aux candidats, explique les postes ouverts et guide le processus de recrutement.',
      category: 'CUSTOM' as const,
      icon: '👥',
      color: '#8B5CF6',
      systemPrompt: `Tu es un assistant RH specialise dans le recrutement. Tu aides les candidats a comprendre les postes disponibles, le processus de candidature et les avantages de l'entreprise. Tu es accueillant, professionnel et transparent. Tu ne promets jamais un poste et tu rediriges vers le recruteur pour les questions specifiques sur le salaire.`,
      defaultModules: JSON.stringify([
        { type: 'rag', enabled: true },
        { type: 'escalation', enabled: true },
      ]),
      capabilities: ['FAQ postes ouverts', 'Process candidature', 'Avantages entreprise', 'Suivi candidature', 'Redirection recruteur'],
      tools: ['knowledge_search', 'escalate_to_human'],
      requiredSources: ['fiches-de-poste', 'politique-rh'],
      suggestedQuestions: [
        'Quels postes sont ouverts actuellement ?',
        'Comment postuler ?',
        'Quels sont les avantages ?',
      ],
      setupSteps: JSON.stringify([
        { step: 1, title: 'Importer fiches de poste', description: 'Uploadez vos descriptions de postes et avantages' },
        { step: 2, title: 'Configurer escalation', description: 'Definissez quand rediriger vers un recruteur' },
        { step: 3, title: 'Tester et deployer', description: 'Testez avec des questions de candidats' },
      ]),
      estimatedSetupTime: 15,
      targetUseCases: ['recruitment', 'hr-faq', 'candidate-support'],
    },
    {
      name: 'Agent E-commerce',
      slug: 'ecommerce-agent',
      description: 'Gere le suivi de commandes, les retours et les questions produits pour votre boutique en ligne.',
      category: 'SUPPORT' as const,
      icon: '🛒',
      color: '#10B981',
      systemPrompt: `Tu es un assistant e-commerce expert. Tu aides les clients avec le suivi de leurs commandes, les retours et remboursements, les questions sur les produits et la livraison. Tu es patient, precis et oriente solution. Tu peux verifier le statut des commandes si l'integration Shopify est active.`,
      defaultModules: JSON.stringify([
        { type: 'rag', enabled: true },
        { type: 'escalation', enabled: true },
        { type: 'sentiment', enabled: true },
      ]),
      capabilities: ['Suivi commandes', 'Retours et remboursements', 'FAQ produits', 'Livraison', 'Integration Shopify'],
      tools: ['knowledge_search', 'get_order_status', 'escalate_to_human'],
      requiredSources: ['faq-produits', 'politique-retour', 'guide-livraison'],
      suggestedQuestions: [
        'Ou en est ma commande ?',
        'Comment faire un retour ?',
        'Quels sont les delais de livraison ?',
      ],
      setupSteps: JSON.stringify([
        { step: 1, title: 'Connecter Shopify', description: 'Liez votre boutique Shopify pour le suivi des commandes' },
        { step: 2, title: 'Importer FAQ', description: 'Uploadez vos FAQ produits et politiques de retour' },
        { step: 3, title: 'Configurer escalation', description: 'Definissez les regles d\'escalation' },
        { step: 4, title: 'Tester et deployer', description: 'Testez avec des scenarios clients reels' },
      ]),
      estimatedSetupTime: 20,
      targetUseCases: ['ecommerce-support', 'order-tracking', 'returns'],
    },
    {
      name: 'Agent IT Helpdesk',
      slug: 'it-helpdesk-agent',
      description: 'Resout les problemes IT courants: reset mot de passe, VPN, logiciels et troubleshooting.',
      category: 'SUPPORT' as const,
      icon: '💻',
      color: '#3B82F6',
      systemPrompt: `Tu es un technicien IT helpdesk de niveau 1. Tu aides les employes avec les problemes techniques courants: reset de mot de passe, configuration VPN, installation de logiciels, problemes d'imprimante, etc. Tu suis des procedures precises et tu escalades vers le niveau 2 si le probleme est complexe. Tu es patient et pedagogique.`,
      defaultModules: JSON.stringify([
        { type: 'rag', enabled: true },
        { type: 'escalation', enabled: true },
      ]),
      capabilities: ['Reset mot de passe', 'Configuration VPN', 'Installation logiciels', 'Troubleshooting', 'Tickets IT'],
      tools: ['knowledge_search', 'create_ticket', 'escalate_to_human'],
      requiredSources: ['procedures-it', 'faq-technique', 'guide-vpn'],
      suggestedQuestions: [
        'J\'ai oublie mon mot de passe',
        'Comment configurer le VPN ?',
        'Mon imprimante ne fonctionne pas',
      ],
      setupSteps: JSON.stringify([
        { step: 1, title: 'Importer procedures IT', description: 'Uploadez vos guides et procedures techniques' },
        { step: 2, title: 'Configurer escalation', description: 'Definissez quand passer au niveau 2' },
        { step: 3, title: 'Tester et deployer', description: 'Testez avec des tickets IT reels' },
      ]),
      estimatedSetupTime: 15,
      targetUseCases: ['it-support', 'helpdesk', 'technical-support'],
    },
  ];

  for (const template of templates) {
    await prisma.agentTemplate.upsert({
      where: { slug: template.slug },
        update: {},
        create: {
        ...template,
        defaultModules: JSON.parse(template.defaultModules as string),
        setupSteps: JSON.parse(template.setupSteps as string),
        targetIndustries: [],
        targetCompanySizes: [],
        },
      });
  }
  console.log(`✅ ${templates.length} agent templates created`);

  // 3. Feature Flags
  const featureFlags = [
    { key: 'agents.multi_agent', name: 'Multi-agent orchestration', enabled: false, rolloutPercentage: 0 },
    { key: 'agents.voice', name: 'Voice conversations', enabled: false, rolloutPercentage: 0 },
    { key: 'channels.whatsapp', name: 'WhatsApp channel', enabled: false, rolloutPercentage: 0 },
    { key: 'channels.instagram', name: 'Instagram DM channel', enabled: false, rolloutPercentage: 0 },
    { key: 'channels.email', name: 'Email channel', enabled: true, rolloutPercentage: 100 },
    { key: 'channels.slack', name: 'Slack channel', enabled: true, rolloutPercentage: 100 },
    { key: 'analytics.advanced', name: 'Advanced analytics', enabled: true, rolloutPercentage: 100 },
    { key: 'analytics.roi', name: 'ROI calculator', enabled: true, rolloutPercentage: 100 },
    { key: 'integrations.shopify', name: 'Shopify integration', enabled: true, rolloutPercentage: 100 },
    { key: 'integrations.hubspot', name: 'HubSpot integration', enabled: false, rolloutPercentage: 0 },
    { key: 'integrations.zapier', name: 'Zapier integration', enabled: true, rolloutPercentage: 100 },
    { key: 'knowledge.website_crawler', name: 'Website crawler', enabled: true, rolloutPercentage: 100 },
    { key: 'knowledge.api_connectors', name: 'API connectors', enabled: false, rolloutPercentage: 0 },
    { key: 'billing.usage_metering', name: 'Usage-based billing', enabled: true, rolloutPercentage: 100 },
  ];

  for (const flag of featureFlags) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
        update: {},
      create: flag,
    });
  }
  console.log(`✅ ${featureFlags.length} feature flags created`);

  console.log('🎉 Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
